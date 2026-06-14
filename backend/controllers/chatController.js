const { uploadFileCloudinary } = require("../config/cloudinaryConfig");
const Conversation = require("../models/Conversation");
const Message = require("../models/message");
const response = require("../utils/responseHandler");


// ================= SEND MESSAGE =================
exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content, messageStatus } = req.body;
    const file = req.file;

    const participants = [senderId, receiverId].sort();

    // check if conversation exists
    let conversationDoc = await Conversation.findOne({
      participants,
    });

    if (!conversationDoc) {
      conversationDoc = new Conversation({ participants });
      await conversationDoc.save();
    }

    let imageOrVideoUrl = null;
    let contentType = null;

    // handle file upload
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
      } else {
        return response(res, 400, "Unsupported file type");
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
      content,
      imageOrVideoUrl,
      contentType,
      messageStatus: messageStatus || "sent",
    });

    await newMessage.save();

    conversationDoc.lastMessage = newMessage._id;
    conversationDoc.unreadCount = (conversationDoc.unreadCount || 0) + 1;

    await conversationDoc.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture")
      .populate("conversation", "participants lastMessage");

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

    return response(res, 200, "Conversations fetched successfully", conversations);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// ================= GET MESSAGES =================
exports.getMessage = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.userId;

  try {
    const conversationDoc = await Conversation.findById(conversationId);

    if (!conversationDoc) {
      return response(res, 404, "Conversation not found");
    }

    if (!conversationDoc.participants.includes(userId)) {
      return response(res, 403, "Unauthorized");
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture")
      .sort({ createdAt: 1 });

    // mark as read
    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: userId,
        messageStatus: { $in: ["sent", "delivered"] },
      },
      { $set: { messageStatus: "read" } }
    );

    conversationDoc.unreadCount = 0;
    await conversationDoc.save();

    return response(res, 200, "Messages fetched successfully", messages);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// ================= MARK AS READ =================
exports.markAsRead = async (req, res) => {
  const { messageIds } = req.body;
  const userId = req.user.userId;

  try {
    await Message.updateMany(
      { _id: { $in: messageIds }, receiver: userId },
      { $set: { messageStatus: "read" } }
    );

    return response(res, 200, "Messages marked as read");
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// ================= DELETE MESSAGE =================
exports.deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.userId;

  try {
    const messageDoc = await Message.findById(messageId);

    if (!messageDoc) {
      return response(res, 404, "Message not found");
    }

    if (messageDoc.sender.toString() !== userId) {
      return response(res, 403, "Unauthorized");
    }

    await Message.deleteOne({ _id: messageId });

    return response(res, 200, "Message deleted successfully");
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};