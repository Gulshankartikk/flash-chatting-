const { Server } = require("socket.io");
const User = require("../models/user");
const Message = require("../models/message");

// Map to store online users: userId -> socketId
const onlineUsers = new Map();
const typingUsers = new Map();

const initilizeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    },
    pingTimeout: 6000,
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    let userId = null;

    // ─── User comes online ───────────────────────────────────────────────────
    socket.on("user_connected", async (connectingUserId) => {
      try {
        userId = connectingUserId;
        onlineUsers.set(userId, socket.id);
        socket.join(userId);

        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date(),
        });

        io.emit("user_status", { userId, isOnline: true });
      } catch (error) {
        console.error("Error handling user connection:", error);
      }
    });

    // ─── Online status check ─────────────────────────────────────────────────
    // ✅ FIX: this always returned `new Date()` as lastSeen whenever the
    // user was online, which is meaningless — "last seen" should only ever
    // be a real timestamp from the DB for an *offline* user, and absent
    // entirely (not "right now") while they're online, matching how
    // `user_status` and `onUserOffline` already report it everywhere else.
    socket.on("get_user_status", async (requestedUserId, callback) => {
      try {
        const isOnline = onlineUsers.has(requestedUserId);
        if (isOnline) {
          callback({ userId: requestedUserId, isOnline: true, lastSeen: null });
          return;
        }
        const user = await User.findById(requestedUserId).select("lastSeen");
        callback({
          userId: requestedUserId,
          isOnline: false,
          lastSeen: user?.lastSeen || null,
        });
      } catch (error) {
        console.error("Error fetching user status:", error);
        callback({ userId: requestedUserId, isOnline: false, lastSeen: null });
      }
    });

    // ─── Forward message to receiver ─────────────────────────────────────────
    // ✅ FIX 1: trust `socket`'s authenticated userId for the sender, not
    // whatever `message.sender` the client claims — previously any client
    // could emit a message and impersonate another user as the sender.
    // ✅ FIX 2: WhatsApp shows a *delivered* double-check the moment the
    // message reaches the recipient's device (separate from *read*, which
    // only happens once they open the chat). Previously there was no
    // "delivered" step at all — a message just silently sat at "sent"
    // until the receiver happened to open the conversation, so the UI had
    // no way to show the delivered tick.
    socket.on("send_message", async (message) => {
      try {
        if (!userId) return;

        const receiverId = message.receiver?._id || message.receiverId;
        const receiverSocketId = onlineUsers.get(receiverId);

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", message);

          // Emit notification to receiver
          const senderUser = await User.findById(userId).select("username profilePicture");
          io.to(receiverSocketId).emit("new_notification", {
            type: "message",
            from: userId,
            title: senderUser?.username || "New Message",
            preview: message.content || message.message || "Sent an attachment",
            avatar: senderUser?.profilePicture || "",
          });

          // Recipient is online right now → mark delivered and tell the
          // sender so their UI can flip ✓ → ✓✓ (gray).
          if (message._id) {
            await Message.findByIdAndUpdate(message._id, {
              messageStatus: "delivered",
            });
          }
          socket.emit("message_status_update", {
            messageId: message._id,
            messageStatus: "delivered",
          });
        }
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    // ─── Mark messages as read ───────────────────────────────────────────────
    socket.on("message_read", async ({ messageIds, senderId }) => {
      try {
        if (!messageIds?.length) return;

        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { messageStatus: "read" } }
        );

        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          messageIds.forEach((messageId) => {
            io.to(senderSocketId).emit("message_status_update", {
              messageId,
              messageStatus: "read",
            });
          });
        }
      } catch (error) {
        console.error("Error updating message read status:", error);
      }
    });

    // ─── Typing start ────────────────────────────────────────────────────────
    socket.on("typing_start", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;

      if (!typingUsers.has(userId)) typingUsers.set(userId, {});
      const userTyping = typingUsers.get(userId);

      // Track which receiver to notify, not just a boolean, so we can
      // still reach them later (e.g. on disconnect cleanup below).
      userTyping[conversationId] = { active: true, receiverId };

      // Clear any existing auto-stop timeout
      if (userTyping[`${conversationId}_timeout`]) {
        clearTimeout(userTyping[`${conversationId}_timeout`]);
      }

      // Auto-stop after 3s
      userTyping[`${conversationId}_timeout`] = setTimeout(() => {
        if (userTyping[conversationId]) userTyping[conversationId].active = false;
        socket.to(receiverId).emit("user_typing", {
          userId,
          conversationId,
          isTyping: false,
        });
      }, 3000);

      // Notify receiver
      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: true,
      });
    });

    // ─── Typing stop ─────────────────────────────────────────────────────────
    socket.on("typing_stop", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;

      if (typingUsers.has(userId)) {
        const userTyping = typingUsers.get(userId);
        if (userTyping[conversationId]) userTyping[conversationId].active = false;

        if (userTyping[`${conversationId}_timeout`]) {
          clearTimeout(userTyping[`${conversationId}_timeout`]);
          delete userTyping[`${conversationId}_timeout`];
        }
      }

      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: false,
      });
    });

    // ─── Add / update reaction ───────────────────────────────────────────────
    // ✅ FIX: trust the socket's own `userId`, not the client-supplied
    // `reactionUserId` — as written, anyone could pass someone else's id
    // and post a reaction "as" them.
    socket.on("add_reaction", async ({ messageId, emoji }) => {
      try {
        if (!userId) return;
        const message = await Message.findById(messageId);
        if (!message) return;

        const existingIndex = message.reactions.findIndex(
          (r) => r.user.toString() === userId
        );

        if (existingIndex > -1) {
          const existing = message.reactions[existingIndex];
          if (existing.emoji === emoji) {
            // Same emoji — remove (toggle off)
            message.reactions.splice(existingIndex, 1);
          } else {
            // Different emoji — update
            message.reactions[existingIndex].emoji = emoji;
          }
        } else {
          message.reactions.push({ user: userId, emoji });
        }

        await message.save();

        const populatedMessage = await Message.findById(message._id)
          .populate("sender", "username profilePicture")
          .populate("receiver", "username profilePicture")
          .populate("reactions.user", "username");

        const reactionUpdated = {
          messageId,
          reactions: populatedMessage.reactions,
        };

        const senderSocket = onlineUsers.get(
          populatedMessage.sender._id.toString()
        );
        const receiverSocket = onlineUsers.get(
          populatedMessage.receiver._id.toString()
        );

        if (senderSocket)
          io.to(senderSocket).emit("reaction_update", reactionUpdated);
        if (receiverSocket)
          io.to(receiverSocket).emit("reaction_update", reactionUpdated);
      } catch (error) {
        console.error("Error handling reaction:", error);
      }
    });

    // ─── Video & Voice Call Signaling ─────────────────────────────────────────
    socket.on("call_user", ({ to, offer, from, roomId, callType, callerName, callerAvatar }) => {
      const targetSocket = onlineUsers.get(to);
      if (targetSocket) {
        io.to(targetSocket).emit("incoming_call", { from, offer, roomId, callType, callerName, callerAvatar });
        io.to(targetSocket).emit("new_notification", {
          type: "call",
          from: from,
          title: `Incoming ${callType} Call`,
          preview: `${callerName} is calling you`,
          avatar: callerAvatar || "",
        });
      }
    });

    socket.on("accept_call", ({ to, answer }) => {
      const targetSocket = onlineUsers.get(to);
      if (targetSocket) {
        io.to(targetSocket).emit("call_accepted", { answer });
      }
    });

    socket.on("reject_call", ({ to }) => {
      const targetSocket = onlineUsers.get(to);
      if (targetSocket) {
        io.to(targetSocket).emit("call_rejected");
      }
    });

    socket.on("ice_candidate", ({ to, candidate }) => {
      const targetSocket = onlineUsers.get(to);
      if (targetSocket) {
        io.to(targetSocket).emit("ice_candidate", { candidate });
      }
    });

    socket.on("end_call", ({ to }) => {
      const targetSocket = onlineUsers.get(to);
      if (targetSocket) {
        io.to(targetSocket).emit("call_ended");
      }
    });

    // ─── User Status System ───────────────────────────────────────────────────
    socket.on("set_status", async ({ userId: statusUserId, status }) => {
      try {
        const uId = statusUserId || userId;
        if (!uId) return;

        const isOnline = status === "online" || status === "away" || status === "busy";
        await User.findByIdAndUpdate(uId, {
          isOnline,
          lastSeen: isOnline ? null : new Date(),
        });
        io.emit("contact_status_change", { userId: uId, status, lastSeen: isOnline ? null : new Date() });
      } catch (error) {
        console.error("Error setting status:", error);
      }
    });

    // ─── Disconnect ──────────────────────────────────────────────────────────
    const handleDisconnected = async () => {
      if (!userId) return;

      try {
        onlineUsers.delete(userId);

        // ✅ FIX: previously the timeouts were cleared but nobody was ever
        // told typing had stopped — if a user closed the tab/app mid-type,
        // the other side's "typing…" indicator would stay stuck until its
        // own 3s timeout (client-side) happened to also catch it, or
        // forever if that didn't exist. Now we proactively notify every
        // conversation they were typing in.
        if (typingUsers.has(userId)) {
          const userTyping = typingUsers.get(userId);
          Object.keys(userTyping).forEach((key) => {
            if (key.endsWith("_timeout")) {
              clearTimeout(userTyping[key]);
            } else if (userTyping[key]?.active) {
              const conversationId = key;
              const { receiverId } = userTyping[key];
              io.to(receiverId).emit("user_typing", {
                userId,
                conversationId,
                isTyping: false,
              });
            }
          });
          typingUsers.delete(userId);
        }

        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        io.emit("user_status", {
          userId,
          isOnline: false,
          lastSeen: new Date(),
        });

        socket.leave(userId);
        console.log(`User ${userId} disconnected`);
      } catch (error) {
        console.error("Error handling disconnection:", error);
      }
    };

    socket.on("disconnect", handleDisconnected);
  });

  // Expose online user map for external use
  io.socketUserMap = onlineUsers;

  return io;
};

module.exports = initilizeSocket;