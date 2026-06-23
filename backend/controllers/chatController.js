const mongoose = require("mongoose");
const { uploadFileCloudinary } = require("../config/cloudinaryConfig");
const Conversation = require("../models/conversation");
const Message = require("../models/message");
const response = require("../utils/responseHandler");

const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes, like WhatsApp
const DELETE_FOR_EVERYONE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Small helper so we don't repeat the "find other participant" logic everywhere.
// NOTE: this assumes 1:1 conversations (sender/receiver). If group chat is ever
// added, this helper (and the schema) will need to change to participants[].
function getOtherUserId(message, userId) {
  const senderId = String(message.sender?._id || message.sender);
  const receiverId = String(message.receiver?._id || message.receiver);
  return senderId === String(userId) ? receiverId : senderId;
}

function emitToUser(req, userId, event, payload) {
  if (!req.io || !req.socketUserMap) return;
  const socketId = req.socketUserMap.get(String(userId));
  if (socketId) {
    req.io.to(socketId).emit(event, payload);
  }
}

// ================= SEND MESSAGE =================
exports.sendMessage = async (req, res) => {
  const { senderId, receiverId, content, messageStatus } = req.body;
  const file = req.file;

  if (!senderId || !receiverId) {
    return response(res, 400, "senderId and receiverId are required");
  }

  if (senderId === receiverId) {
    return response(res, 400, "Cannot send a message to yourself");
  }

  if (!content?.trim() && !file) {
    return response(res, 400, "Message content or media is required");
  }

  // Upload BEFORE opening the transaction. Cloudinary isn't transactional and
  // we don't want a DB session held open during a slow external network call.
  let imageOrVideoUrl = null;
  let contentType = null;

  if (file) {
    let uploadFile;
    try {
      uploadFile = await uploadFileCloudinary(file);
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      return response(res, 400, "Failed to upload media");
    }

    if (!uploadFile?.secure_url) {
      return response(res, 400, "Failed to upload media");
    }

    imageOrVideoUrl = uploadFile.secure_url;

    if (file.mimetype.startsWith("image")) contentType = "image";
    else if (file.mimetype.startsWith("video")) contentType = "video";
    else if (file.mimetype.startsWith("audio")) contentType = "audio";
    else contentType = "document";
  } else {
    contentType = "text";
  }

  const session = await mongoose.startSession();

  try {
    let newMessage;
    let populatedMessage;
    let wasDeliveredImmediately = false;

    await session.withTransaction(async () => {
      const participants = [senderId, receiverId].sort();

      let conversationDoc = await Conversation.findOne({ participants }).session(session);

      if (!conversationDoc) {
        conversationDoc = new Conversation({ participants, unreadCounts: new Map() });
      }

      newMessage = new Message({
        conversation: conversationDoc._id,
        sender: senderId,
        receiver: receiverId,
        content: content?.trim() || "",
        imageOrVideoUrl,
        contentType,
        messageStatus: messageStatus || "sent",
      });

      // Mark delivered immediately if the receiver is currently online.
      // Done here (pre-save) instead of as a second save, to avoid an extra write.
      const receiverSocketId = req.socketUserMap?.get(String(receiverId));
      if (receiverSocketId) {
        newMessage.messageStatus = "delivered";
        newMessage.deliveredTo.push({ user: receiverId });
        wasDeliveredImmediately = true;
      }

      await newMessage.save({ session });

      conversationDoc.lastMessage = newMessage._id;

      if (!conversationDoc.unreadCounts) conversationDoc.unreadCounts = new Map();
      const currentUnread = conversationDoc.unreadCounts.get(String(receiverId)) || 0;
      conversationDoc.unreadCounts.set(String(receiverId), currentUnread + 1);

      await conversationDoc.save({ session });
    });

    populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture")
      .populate("conversation", "participants lastMessage");

    const receiverSocketId = req.socketUserMap?.get(String(receiverId));
    if (receiverSocketId) {
      emitToUser(req, receiverId, "receive_message", populatedMessage);

      if (wasDeliveredImmediately) {
        emitToUser(req, senderId, "message_status_update", {
          messageId: newMessage._id,
          messageStatus: "delivered",
        });
      }
    }

    return response(res, 200, "Message sent successfully", populatedMessage);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  } finally {
    session.endSession();
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
      obj.unreadCount = conv.unreadCounts?.get(String(userId)) || 0;
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

    // Mark this user's incoming, unseen messages as seen.
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

      for (const msg of toMarkSeen) {
        emitToUser(req, msg.sender._id || msg.sender, "message_status_update", {
          messageId: msg._id,
          messageStatus: "seen",
        });
      }
    }

    // Only reset unread count when the viewer is looking at the latest page
    // (no `before` cursor). Paginating backward into history shouldn't zero
    // out unread state for messages the viewer hasn't actually reached yet.
    if (!before && conversationDoc.unreadCounts?.get(String(userId))) {
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

    for (const msg of messages) {
      emitToUser(req, msg.sender, "message_status_update", {
        messageId: msg._id,
        messageStatus: "seen",
      });
    }

    // Keep the conversation list's unread badge in sync. Without this, a
    // client that calls markAsRead directly (without hitting getMessage)
    // would leave a stale unread count on the conversation.
    const conversationIds = [...new Set(messages.map((m) => String(m.conversation)))];
    for (const convId of conversationIds) {
      const conversationDoc = await Conversation.findById(convId);
      if (conversationDoc?.unreadCounts?.get(String(userId))) {
        conversationDoc.unreadCounts.set(String(userId), 0);
        await conversationDoc.save();
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

      if (messageDoc.isDeletedForEveryone) {
        return response(res, 400, "Message already deleted");
      }

      const age = Date.now() - messageDoc.createdAt.getTime();
      if (age > DELETE_FOR_EVERYONE_WINDOW_MS) {
        return response(res, 400, "Too late to delete this message for everyone");
      }

      messageDoc.content = "";
      messageDoc.imageOrVideoUrl = null;
      messageDoc.isDeletedForEveryone = true;
      await messageDoc.save();

      const otherUserId = getOtherUserId(messageDoc, userId);
      emitToUser(req, otherUserId, "message_deleted", {
        messageId: messageDoc._id,
        deleteForEveryone: true,
      });

      return response(res, 200, "Message deleted for everyone");
    }

    if (!messageDoc.deletedFor.map(String).includes(String(userId))) {
      messageDoc.deletedFor.push(userId);
      await messageDoc.save();
    }

    // Sync "delete for me" across the deleter's own other sessions/devices.
    emitToUser(req, userId, "message_deleted", {
      messageId: messageDoc._id,
      deleteForEveryone: false,
    });

    return response(res, 200, "Message deleted for you");
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// ================= ADD / REMOVE / UPDATE REACTION =================
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

    const existingIndex = messageDoc.reactions.findIndex(
      (r) => String(r.user) === String(userId)
    );
    let action;

    if (existingIndex !== -1) {
      if (messageDoc.reactions[existingIndex].emoji === emoji) {
        // Tapping the same emoji again removes it, like WhatsApp.
        messageDoc.reactions.splice(existingIndex, 1);
        action = "removed";
      } else {
        messageDoc.reactions[existingIndex].emoji = emoji;
        action = "updated";
      }
    } else {
      messageDoc.reactions.push({ user: userId, emoji });
      action = "added";
    }

    await messageDoc.save();

    const otherUserId = getOtherUserId(messageDoc, userId);
    emitToUser(req, otherUserId, "message_reaction", {
      messageId: messageDoc._id,
      userId,
      emoji: action === "removed" ? null : emoji,
      action,
    });

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

  if (!content?.trim()) {
    return response(res, 400, "Content is required to edit a message");
  }

  try {
    const message = await Message.findById(messageId);
    if (!message) return response(res, 404, "Message not found");

    if (String(message.sender) !== String(userId)) {
      return response(res, 403, "You can only edit your own messages");
    }

    if (message.isDeletedForEveryone) {
      return response(res, 400, "Cannot edit a deleted message");
    }

    if (message.contentType !== "text") {
      return response(res, 400, "Only text messages can be edited");
    }

    const age = Date.now() - message.createdAt.getTime();
    if (age > EDIT_WINDOW_MS) {
      return response(res, 400, "Too late to edit this message");
    }

    message.content = content.trim();
    message.isEdited = true;
    await message.save();

    const populated = await Message.findById(message._id)
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture");

    const otherUserId = getOtherUserId(populated, userId);
    emitToUser(req, otherUserId, "message_edited", {
      messageId: populated._id,
      content: populated.content,
      isEdited: true,
    });

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
      const cutoff = new Date(Date.now() - DELETE_FOR_EVERYONE_WINDOW_MS);

      // Only the sender can wipe a message, and only within the time window.
      const messages = await Message.find({
        _id: { $in: messageIds },
        sender: userId,
        isDeletedForEveryone: { $ne: true },
        createdAt: { $gte: cutoff },
      });

      const idsToWipe = messages.map((m) => m._id);

      if (idsToWipe.length > 0) {
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
      }

      messages.forEach((msg) => {
        const otherUserId = getOtherUserId(msg, userId);
        emitToUser(req, otherUserId, "message_deleted", {
          messageId: msg._id,
          deleteForEveryone: true,
        });
      });

      const skipped = messageIds.length - idsToWipe.length;
      return response(
        res,
        200,
        skipped > 0
          ? `${idsToWipe.length} message(s) deleted, ${skipped} skipped (not yours or too old)`
          : "Messages deleted successfully"
      );
    } else {
      // "Delete for me"
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $addToSet: { deletedFor: userId } }
      );

      emitToUser(req, userId, "messages_deleted", {
        messageIds,
        deleteForEveryone: false,
      });

      return response(res, 200, "Messages deleted successfully");
    }
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// ================= PIN MESSAGE =================
exports.pinMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.userId;

  const session = await mongoose.startSession();

  try {
    let populated;

    await session.withTransaction(async () => {
      const message = await Message.findById(messageId).session(session);
      if (!message) {
        throw Object.assign(new Error("Message not found"), { statusCode: 404 });
      }

      const isParticipant =
        String(message.sender) === String(userId) ||
        String(message.receiver) === String(userId);

      if (!isParticipant) {
        throw Object.assign(new Error("Unauthorized"), { statusCode: 403 });
      }

      message.isPinned = !message.isPinned;
      await message.save({ session });

      // WhatsApp only allows one pinned message per chat. Unpinning the
      // others happens inside the same transaction as the toggle above, so
      // two near-simultaneous pin requests can't both end up pinned.
      if (message.isPinned) {
        await Message.updateMany(
          { conversation: message.conversation, _id: { $ne: messageId } },
          { $set: { isPinned: false } },
          { session }
        );
      }

      populated = await Message.findById(message._id)
        .session(session)
        .populate("sender", "username profilePicture")
        .populate("receiver", "username profilePicture");
    });

    const otherUserId = getOtherUserId(populated, userId);
    emitToUser(req, otherUserId, "message_pinned", {
      messageId: populated._id,
      isPinned: populated.isPinned,
      conversationId: populated.conversation,
    });

    return response(res, 200, "Message pin toggled successfully", populated);
  } catch (error) {
    if (error.statusCode) {
      return response(res, error.statusCode, error.message);
    }
    console.error(error);
    return response(res, 500, "Internal server error");
  } finally {
    session.endSession();
  }
};