const { uploadFileCloudinary } = require("../config/cloudinaryConfig");
const status = require("../models/status");
const Message = require("../models/message");
const response = require("../utils/responseHandler");
const status = require("../models/status");
const status = require("../models/status");
const status = require("../models/status");

// ================= SEND MESSAGE =================
exports.createStatus= async (req, res) => {
  try {
    const {  content } = req.body;
    const userId =req.user.userId;
    const file = req.file;

   let mediaUrl = null;
   let finalcontentType = contentType || "text";

    // handle file upload
    if (file) {
      const uploadFile = await uploadFileCloudinary(file);

      if (!uploadFile?.secure_url) {
        return response(res, 400, "Failed to upload media");
      }

      mediaUrl = uploadFile.secure_url;

      if (file.mimetype.startsWith("image")) {
        finalcontentType = "image";
      } else if (file.mimetype.startsWith("video")) {
        finalcontentType = "video";
      } else {
        return response(res, 400, "Unsupported file type");
      }
    } else if (content?.trim()) {
      finalcontentType = "text";
    } else {
      return response(res, 400, "Message content or media is required");
    }

    const expiresAt =new Date();
    expiresAt.setHoure(expiresAt.getHours()+24)

    const status  = new status({
      user:userId,
      content:mediaUrl ||content,
      contentType:finalcontentType,
      imageOrVideoUrl,
      messageStatus,
    });

    await status.save();

   

  

    const populatedstatus = await Message.findOne(status?._id)
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture")
      

    return response(res, 200, "status created successfully", populatedstatus);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

exports.getstatus = async(res,res) =>{
    try{
        const statuses =await status.find({
            expiresAt:{$gt:new Date()},
        })
        .populate("user","username profilepicture")
        .populate("viewers","username profilepicture")
        .sort({cretedAt: -1});

        return response(res,200,"statuses retrived successfully",statuses)
    } catch(error){
        console.error(error);
        return response(res,500, "Internal server error");
    }

};

exports.viewStatus = async(req,res) =>{
    const{statusId} =req.prams;
    const userId =req.user.userId;
    try{
        const status =await status.findById(statusId);
        if(!status){
            return response(res,404, 'status not found')
        }
        if(!status.viewer.includes(userId)){
            status.viewer.push(userId);
            await status.save();

            const updateStatus = await status.findById(statusId)
             .populate("user","username profilepicture")
             .populate("viewers","username profilepicture")
        }else{
            console.log('user already viewed the status')
        }
       return response(res,200,'status viewed successfully')
    }catch(error){
        console.error(error);
        return response(res,500, "Internal server error");

    }
};

exports.deleteStatus =async(req,res) =>{
    const {statusId} =req.prams;
    const userId =req.user.userId;
    try{
        const status =await status.findById(statusId);
        if(!status){
            return response(req, 404,"status not found" );
        }
        if(status.user.tostring() !==userId){
            return response(res,403, "not authorized to delete this status")
        }
        await status.deleteOne();

        return response(res,200,"status deleted successfully")
    }catch(error){
        console.error(error);
        return response(res,500, "Internal server error");

    }
    
}