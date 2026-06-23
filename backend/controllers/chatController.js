const { uploadFileCloudinary } = require("../config/cloudinaryConfig");
const Conversation = require("../models/Conversation");
const Message = require("../models/message");
const response = require("../utils/responseHandler");

// ================= SEND MESSAGE =================
// ================= SEND MESSAGE =================
exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content, messageStatus } = req.body;
    const file = req.file;

    if (!senderId || !receiverId) {
      return response(res, 400, "senderId and receiverId are required");
    }

    if (senderId === receiverId) {
      return response(res, 400, "Cannot send a message to yourself");
    }

    const participants = [senderId, receiverId].sort();

    let conversationDoc = await Conversation.findOne({ participants });

    if (!conversationDoc) {
      conversationDoc = new Conversation({ participants, unreadCounts: {} });
      await conversationDoc.save();
    }

    let imageOrVideoUrl = null;
    let contentType = null;

    if (file) {
      const uploadFile = await uploadFileCloudinary(file);

      if (!uploadFile?.secure_url) {
        return response(res, 400, "Failed to upload media");
      }

      imageOrVideoUrl = uploadFile.secure_url;

      if (file.mimetype.startsWith("image")) {
        contentType = "image";
      } else if (file.mimetype.startsWith("video")) {
        contentType = "video";
      } else if (file.mimetype.startsWith("audio")) {
        contentType = "audio";
      } else {
        contentType = "document";
      }
    } else if (content?.trim()) {
      contentType = "text";
    } else {
      return response(res, 400, "Message content or media is required");
    }

    const newMessage = new Message({
      conversation: conversationDoc._id,
      sender: senderId,
      receiver: receiverId,
      content: content?.trim() || "",
      imageOrVideoUrl,
      contentType,
      messageStatus: messageStatus || "sent",
    });

    await newMessage.save();

    conversationDoc.lastMessage = newMessage._id;

    if (!conversationDoc.unreadCounts) conversationDoc.unreadCounts = new Map();
    const currentUnread = conversationDoc.unreadCounts.get(receiverId) || 0;
    conversationDoc.unreadCounts.set(receiverId, currentUnread + 1);

    await conversationDoc.save();

    // mark delivered immediately if the receiver is online
    if (req.io && req.socketUserMap) {
      const receiverSocketId = req.socketUserMap.get(receiverId);

      if (receiverSocketId) {
        newMessage.messageStatus = "delivered";
        newMessage.deliveredTo.push({ user: receiverId });
        await newMessage.save();
      }
    }

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture")
      .populate("conversation", "participants lastMessage");

    if (req.io && req.socketUserMap) {
      const receiverSocketId = req.socketUserMap.get(receiverId);

      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("receive_message", populatedMessage);

        const senderSocketId = req.socketUserMap.get(senderId);
        if (senderSocketId) {
          req.io.to(senderSocketId).emit("message_status_update", {
            messageId: newMessage._id,
            messageStatus: "delivered",
          });
        }
      }
    }

    return response(res, 200, "Message sent successfully", populatedMessage);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// ================= GET ALL CONVERSATIONS =================
exports.getConversation = async (req, res) => {
  const userId = req.user.userId;

  try {
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "username profilePicture isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender receiver",
          select: "username profilePicture",
        },
      })
      .sort({ updatedAt: -1 });

    const formatted = conversations.map((conv) => {
      const obj = conv.toObject();
      obj.unreadCount = conv.unreadCounts?.get(userId.toString()) || 0;
      delete obj.unreadCounts;
      return obj;
    });

    return response(res, 200, "Conversations fetched successfully", formatted);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// ================= GET MESSAGES (paginated) =================
exports.getMessage = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.userId;
  const limit = Math.min(parseInt(req.query.limit) || 30, 100);
  const before = req.query.before;

  try {
    const conversationDoc = await Conversation.findById(conversationId);

    if (!conversationDoc) {
      return response(res, 404, "Conversation not found");
    }

    if (!conversationDoc.participants.map(String).includes(String(userId))) {
      return response(res, 403, "Unauthorized");
    }

    const query = { conversation: conversationId, deletedFor: { $ne: userId } };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture")
      .sort({ createdAt: -1 })
      .limit(limit);

    // mark this user's incoming, unseen messages as seen
    const toMarkSeen = messages.filter(
      (m) =>
        String(m.receiver?._id || m.receiver) === String(userId) &&
        m.messageStatus !== "seen" &&
        !m.seenBy.some((s) => String(s.user) === String(userId))
    );

    if (toMarkSeen.length > 0) {
      const ids = toMarkSeen.map((m) => m._id);

      await Message.updateMany(
        { _id: { $in: ids } },
        {
          $set: { messageStatus: "seen" },
          $push: { seenBy: { user: userId, at: new Date() } },
        }
      );

      if (req.io && req.socketUserMap) {
        for (const msg of toMarkSeen) {
          const senderSocketId = req.socketUserMap.get(String(msg.sender._id || msg.sender));
          if (senderSocketId) {
            req.io.to(senderSocketId).emit("message_status_update", {
              messageId: msg._id,
              messageStatus: "seen",
            });
          }
        }
      }
    }

    if (conversationDoc.unreadCounts?.get(String(userId))) {
      conversationDoc.unreadCounts.set(String(userId), 0);
      await conversationDoc.save();
    }

    return response(res, 200, "Messages fetched successfully", messages.reverse());
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// ================= MARK AS READ (SEEN) =================
exports.markAsRead = async (req, res) => {
  const { messageIds } = req.body;
  const userId = req.user.userId;

  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    return response(res, 400, "messageIds must be a non-empty array");
  }

  try {
    const messages = await Message.find({
      _id: { $in: messageIds },
      receiver: userId,
      messageStatus: { $ne: "seen" },
    });

    if (messages.length === 0) {
      return response(res, 200, "No messages to update");
    }

    await Message.updateMany(
      { _id: { $in: messages.map((m) => m._id) } },
      {
        $set: { messageStatus: "seen" },
        $push: { seenBy: { user: userId, at: new Date() } },
      }
    );

    if (req.io && req.socketUserMap) {
      for (const msg of messages) {
        const senderSocketId = req.socketUserMap.get(String(msg.sender));
        if (senderSocketId) {
          req.io.to(senderSocketId).emit("message_status_update", {
            messageId: msg._id,
            messageStatus: "seen",
          });
        }
      }
    }

    return response(res, 200, "Messages marked as seen");
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// ================= DELETE MESSAGE =================
exports.deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const { deleteForEveryone } = req.body;
  const userId = req.user.userId;

  const DELETE_FOR_EVERYONE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

  try {
    const messageDoc = await Message.findById(messageId);

    if (!messageDoc) {
      return response(res, 404, "Message not found");
    }

    const isParticipant =
      String(messageDoc.sender) === String(userId) ||
      String(messageDoc.receiver) === String(userId);

    if (!isParticipant) {
      return response(res, 403, "Unauthorized");
    }

    if (deleteForEveryone) {
      if (String(messageDoc.sender) !== String(userId)) {
        return response(res, 403, "Only the sender can delete this message for everyone");
      }

      const age = Date.now() - messageDoc.createdAt.getTime();
      if (age > DELETE_FOR_EVERYONE_WINDOW_MS) {
        return response(res, 400, "Too late to delete this message for everyone");
      }

      messageDoc.content = "";
      messageDoc.imageOrVideoUrl = null;
      messageDoc.isDeletedForEveryone = true;
      await messageDoc.save();

      if (req.io && req.socketUserMap) {
        const otherUserId =
          String(messageDoc.sender) === String(userId)
            ? messageDoc.receiver
            : messageDoc.sender;
        const otherSocketId = req.socketUserMap.get(String(otherUserId));
        if (otherSocketId) {
          req.io.to(otherSocketId).emit("message_deleted", {
            messageId: messageDoc._id,
            deleteForEveryone: true,
          });
        }
      }

      return response(res, 200, "Message deleted for everyone");
    }

    if (!messageDoc.deletedFor.map(String).includes(String(userId))) {
      messageDoc.deletedFor.push(userId);
      await messageDoc.save();
    }

    return response(res, 200, "Message deleted for you");
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// ================= ADD / UPDATE REACTION =================
exports.reactToMessage = async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user.userId;

  if (!emoji) {
    return response(res, 400, "emoji is required");
  }

  try {
    const messageDoc = await Message.findById(messageId);

    if (!messageDoc) {
      return response(res, 404, "Message not found");
    }

    const isParticipant =
      String(messageDoc.sender) === String(userId) ||
      String(messageDoc.receiver) === String(userId);

    if (!isParticipant) {
      return response(res, 403, "Unauthorized");
    }

    const existing = messageDoc.reactions.find((r) => String(r.user) === String(userId));

    if (existing) {
      existing.emoji = emoji; // replace previous reaction, like WhatsApp
    } else {
      messageDoc.reactions.push({ user: userId, emoji });
    }

    await messageDoc.save();

    if (req.io && req.socketUserMap) {
      const otherUserId =
        String(messageDoc.sender) === String(userId)
          ? messageDoc.receiver
          : messageDoc.sender;
      const otherSocketId = req.socketUserMap.get(String(otherUserId));
      if (otherSocketId) {
        req.io.to(otherSocketId).emit("message_reaction", {
          messageId: messageDoc._id,
          userId,
          emoji,
        });
      }
    }

    return response(res, 200, "Reaction updated", messageDoc.reactions);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// ================= EDIT MESSAGE =================
exports.editMessage = async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;
  const userId = req.user.userId;

  try {
    const message = await Message.findById(messageId);
    if (!message) return response(res, 404, "Message not found");

    if (String(message.sender) !== String(userId)) {
      return response(res, 403, "You can only edit your own messages");
    }

    message.content = content;
    message.isEdited = true;
    await message.save();

    const populated = await Message.findById(message._id)
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture");

    if (req.io && req.socketUserMap) {
      const otherUserId =
        String(populated.sender._id) === String(userId)
          ? populated.receiver?._id
          : populated.sender._id;
      if (otherUserId) {
        const otherSocketId = req.socketUserMap.get(String(otherUserId));
        if (otherSocketId) {
          req.io.to(otherSocketId).emit("message_edited", {
            messageId: populated._id,
            content: populated.content,
            isEdited: true,
          });
        }
      }
    }

    return response(res, 200, "Message edited successfully", populated);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// ================= BULK DELETE MESSAGES =================
exports.bulkDeleteMessages = async (req, res) => {
  const { messageIds, deleteFor } = req.body;
  const userId = req.user.userId;

  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    return response(res, 400, "messageIds is required and must be an array");
  }

  try {
    if (deleteFor === "everyone") {
      // "Delete for everyone" only allows sender to delete
      const messages = await Message.find({ _id: { $in: messageIds }, sender: userId });
      const idsToWipe = messages.map((m) => m._id);

      await Message.updateMany(
        { _id: { $in: idsToWipe } },
        {
          $set: {
            content: "",
            imageOrVideoUrl: null,
            isDeletedForEveryone: true,
          },
        }
      );

      if (req.io && req.socketUserMap) {
        messages.forEach((msg) => {
          const otherUserId =
            String(msg.sender) === String(userId)
              ? msg.receiver
              : msg.sender;
          if (otherUserId) {
            const otherSocketId = req.socketUserMap.get(String(otherUserId));
            if (otherSocketId) {
              req.io.to(otherSocketId).emit("message_deleted", {
                messageId: msg._id,
                deleteForEveryone: true,
              });
            }
          }
        });
      }
    } else {
      // "Delete for me"
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $addToSet: { deletedFor: userId } }
      );
    }

    return response(res, 200, "Messages deleted successfully");
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// ================= PIN MESSAGE =================
exports.pinMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.userId;

  try {
    const message = await Message.findById(messageId);
    if (!message) return response(res, 404, "Message not found");

    const isParticipant =
      String(message.sender) === String(userId) ||
      String(message.receiver) === String(userId);

    if (!isParticipant) {
      return response(res, 403, "Unauthorized");
    }

    // Toggle pin status
    message.isPinned = !message.isPinned;
    await message.save();

    // If pinning a new message, unpin all other messages in this conversation (WhatsApp only allows 1 pinned message per chat)
    if (message.isPinned) {
      await Message.updateMany(
        { conversation: message.conversation, _id: { $ne: messageId } },
        { $set: { isPinned: false } }
      );
    }

    const populated = await Message.findById(message._id)
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture");

    if (req.io && req.socketUserMap) {
      const otherUserId =
        String(populated.sender._id) === String(userId)
          ? populated.receiver?._id
          : populated.sender._id;
      if (otherUserId) {
        const otherSocketId = req.socketUserMap.get(String(otherUserId));
        if (otherSocketId) {
          req.io.to(otherSocketId).emit("message_pinned", {
            messageId: populated._id,
            isPinned: populated.isPinned,
            conversationId: populated.conversation,
          });
        }
      }
    }

    return response(res, 200, "Message pin toggled successfully", populated);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};