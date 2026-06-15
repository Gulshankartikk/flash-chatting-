const { uploadFileCloudinary } = require("../config/cloudinaryConfig");
const Status = require("../models/status");
const response = require("../utils/responseHandler");

// ================= CREATE STATUS =================
exports.createStatus = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.userId;
    const file = req.file;

    let mediaUrl = null;
    let finalcontentType = "text";

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

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const newStatus = new Status({
      user: userId,
      content: mediaUrl || content,
      contentType: finalcontentType,
      expiresAt,
    });

    await newStatus.save();

    const populatedStatus = await Status.findById(newStatus._id)
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture");

    return response(
      res,
      200,
      "Status created successfully",
      populatedStatus
    );
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// ================= GET STATUS =================
exports.getStatus = async (req, res) => {
  try {
    const statuses = await Status.find({
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture")
      .sort({ createdAt: -1 });

    return response(
      res,
      200,
      "Statuses retrieved successfully",
      statuses
    );
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// ================= VIEW STATUS =================
exports.viewStatus = async (req, res) => {
  const { statusId } = req.params;
  const userId = req.user.userId;

  try {
    const status = await Status.findById(statusId);

    if (!status) {
      return response(res, 404, "Status not found");
    }

    if (!status.viewers.includes(userId)) {
      status.viewers.push(userId);
      await status.save();

      await Status.findById(statusId)
        .populate("user", "username profilePicture")
        .populate("viewers", "username profilePicture");
    } else {
      console.log("User already viewed the status");
    }

    return response(res, 200, "Status viewed successfully");
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// ================= DELETE STATUS =================
exports.deleteStatus = async (req, res) => {
  const { statusId } = req.params;
  const userId = req.user.userId;

  try {
    const status = await Status.findById(statusId);

    if (!status) {
      return response(res, 404, "Status not found");
    }

    if (status.user.toString() !== userId) {
      return response(
        res,
        403,
        "Not authorized to delete this status"
      );
    }

    await status.deleteOne();

    return response(res, 200, "Status deleted successfully");
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};