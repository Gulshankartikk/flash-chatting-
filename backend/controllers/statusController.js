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
    let finalContentType = "text";

    if (file) {
      const uploadFile = await uploadFileCloudinary(file);

      if (!uploadFile?.secure_url) {
        return response(res, 400, "Failed to upload media");
      }

      mediaUrl = uploadFile.secure_url;

      if (file.mimetype.startsWith("image")) {
        finalContentType = "image";
      } else if (file.mimetype.startsWith("video")) {
        finalContentType = "video";
      } else {
        return response(res, 400, "Unsupported file type");
      }
    } else if (content?.trim()) {
      finalContentType = "text";
    } else {
      return response(res, 400, "Status content or media is required");
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const newStatus = new Status({
      user: userId,
      content: mediaUrl || content,
      contentType: finalContentType,
      expiresAt,
    });

    await newStatus.save();

    const populatedStatus = await Status.findById(newStatus._id)
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture");

    // broadcast to all connected users except the creator, so their
    // status list updates live (like WhatsApp's status tray)
    if (req.io && req.socketUserMap) {
      for (const [connectedId, socketId] of req.socketUserMap) {
        if (connectedId !== userId) {
          req.io.to(socketId).emit("new_status", populatedStatus);
        }
      }
    }

    return response(res, 200, "Status created successfully", populatedStatus);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// ================= GET STATUS (grouped by user, WhatsApp-style) =================
exports.getStatus = async (req, res) => {
  const userId = req.user.userId;

  try {
    const statuses = await Status.find({
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture")
      .sort({ createdAt: 1 }); // oldest first within each user's tray

    // group into "my status" + "contacts' statuses", each contact
    // bucketed with all their active updates — mirrors how the
    // status tab actually renders, instead of a flat list
    const grouped = {};

    for (const status of statuses) {
      const ownerId = String(status.user._id);

      if (!grouped[ownerId]) {
        grouped[ownerId] = {
          user: status.user,
          updates: [],
          allViewed: true,
        };
      }

      const viewedByMe = status.viewers.some((v) => String(v._id) === String(userId));
      if (!viewedByMe && ownerId !== String(userId)) {
        grouped[ownerId].allViewed = false;
      }

      grouped[ownerId].updates.push(status);
    }

    const result = Object.values(grouped);

    return response(res, 200, "Statuses retrieved successfully", result);
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

    const alreadyViewed = status.viewers.some((v) => String(v) === String(userId));

    if (!alreadyViewed) {
      status.viewers.push(userId);
      await status.save();

      const updatedStatus = await Status.findById(statusId)
        .populate("user", "username profilePicture")
        .populate("viewers", "username profilePicture");

      if (req.io && req.socketUserMap) {
        const statusOwnerSocketId = req.socketUserMap.get(
          updatedStatus.user._id.toString()
        );

        if (statusOwnerSocketId) {
          const viewData = {
            statusId,
            viewerId: userId,
            totalViewers: updatedStatus.viewers.length,
            viewers: updatedStatus.viewers,
          };
          req.io.to(statusOwnerSocketId).emit("status_viewed", viewData);
        } else {
          console.log("Status owner not connected");
        }
      }
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
      return response(res, 403, "Not authorized to delete this status");
    }

    await status.deleteOne();

    if (req.io && req.socketUserMap) {
      for (const [connectedId, socketId] of req.socketUserMap) {
        if (connectedId !== userId) {
          req.io.to(socketId).emit("status_deleted", statusId);
        }
      }
    }

    return response(res, 200, "Status deleted successfully");
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};