const { uploadFileCloudinary } = require("../config/cloudinaryConfig");
const Conversation = require("../models/Conversation");
const response = require("../utils/responseHandler");
const Message = require("../models/message");
const conversation = require("../models/status");

exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content, messageStatus } = req.body;
    const file = req.file;

    const participants = [senderId, receiverId].sort();

    // check if conversation exists
    let conversation = await Conversation.findOne({
      participants: participants,
    });

    if (!conversation) {
      conversation = new Conversation({
        participants,
      });
      await conversation.save();
    }

    let imageOrVideoUrl = null;
    let contentType = null;

    // handle file upload
    if (file) {
      const uploadFile = await uploadFileCloudinary(file);

      if (!uploadFile?.secure_url) {
        return response(res, 400, "failed to upload media");
      }

      imageOrVideoUrl = uploadFile.secure_url;

      if (file.mimetype.startsWith("image")) {
        contentType = "image";
      } else if (file.mimetype.startsWith("video")) {
        contentType = "video";
      } else {
        return response(res, 400, "unsupported file type");
      }
    } else if (content?.trim()) {
      contentType = "text";
    } else {
      return response(res, 400, "message content or media is required");
    }

    const message = new Message({
      conversation: conversation._id,
      sender: senderId,
      content,
      imageOrVideoUrl,
      contentType,
      messageStatus: messageStatus || "sent",
    });

    await message.save();

    conversation.lastMessage = message._id;
    conversation.unreadCount = (conversation.unreadCount || 0) + 1;

    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username profilePicture")
      .populate("conversation", "participants lastMessage");

    return response(res, 200, "message sent successfully", populatedMessage);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// get all conversation
exports.getConversation =async (req,res)=>{
  const userId =req.user.userId;
  try{
    let conversation = await conversation.find({
    participants:userId,
}).populate("participants","username profilePicture isOnline lastSeen")
.populate({
  path:"lastMessage",
  populate:{
    path:"sender receiver",
    select:"username profilePicture"
  }
}).sort({updatedAt:-1})
return response(res,201,'conversation get successfully',conversation)
} catch(error){
  console.error(error);
  return response(res,500,'internal server error')
}
};