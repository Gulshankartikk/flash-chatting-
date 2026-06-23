const { uploadFileCloudinary } = require("../config/cloudinaryConfig");
const Status = require("../models/status");
const response = require("../utils/responseHandler");

// NOTE: this app doesn't have a contacts/friends feature yet, so status
// visibility is intentionally NOT scoped here — createStatus/deleteStatus
// broadcast to every connected user, and getStatus returns every active
// status on the platform. This matches your original behavior. If you add
// a contacts feature later, the places to add filtering are marked below
// with "CONTACT SCOPING GOES HERE".

// ================= CREATE STATUS =================
exports.createStatus = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.userId;
    const file = req.file;

    let finalContentType = "text";

    // Validate file type BEFORE uploading, so we don't pay for/store an
    // upload to Cloudinary for a file type we're about to reject.
    if (file) {
      if (file.mimetype.startsWith("image")) {
        finalContentType = "image";
      } else if (file.mimetype.startsWith("video")) {
        finalContentType = "video";
      } else {
        return response(res, 400, "Unsupported file type");
      }
    } else if (!content?.trim()) {
      return response(res, 400, "Status content or media is required");
    }

    let mediaUrl = null;

    if (file) {
      const uploadFile = await uploadFileCloudinary(file);

      if (!uploadFile?.secure_url) {
        return response(res, 400, "Failed to upload media");
      }

      mediaUrl = uploadFile.secure_url;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const newStatus = new Status({
      user: userId,
      content: content?.trim() || "",
      mediaUrl,
      contentType: finalContentType,
      expiresAt,
    });

    await newStatus.save();

    const populatedStatus = await Status.findById(newStatus._id)
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture");

    // CONTACT SCOPING GOES HERE: broadcasts to every connected user since
    // there's no contacts feature yet. Once you have one, filter
    // req.socketUserMap entries down to this user's contacts before emitting.
    if (req.io && req.socketUserMap) {
      for (const [connectedId, socketId] of req.socketUserMap) {
        if (connectedId !== String(userId)) {
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
    // CONTACT SCOPING GOES HERE: fetches every active status on the
    // platform since there's no contacts feature yet. Once you have one,
    // add `user: { $in: [...contactIds, String(userId)] }` to this query.
    const statuses = await Status.find({
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture")
      .sort({ createdAt: 1 }); // oldest first within each user's tray

    // Group into "my status" + "contacts' statuses", each contact bucketed
    // with all their active updates — mirrors how the status tab renders,
    // instead of a flat list.
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

    if (status.expiresAt <= new Date()) {
      return response(res, 410, "Status has expired");
    }

    // Owners viewing their own status shouldn't be recorded as a viewer,
    // and shouldn't trigger a "someone viewed your status" notification
    // to themselves.
    const isOwner = String(status.user) === String(userId);

    if (isOwner) {
      return response(res, 200, "Status viewed successfully");
    }

    // Atomic add — avoids a read-then-write race where two near-simultaneous
    // view requests from the same user could both pass an "already viewed"
    // check before either save lands, double-adding the viewer.
    const updateResult = await Status.updateOne(
      { _id: statusId, viewers: { $ne: userId } },
      { $addToSet: { viewers: userId } }
    );

    const isNewView = updateResult.modifiedCount > 0;

    if (isNewView && req.io && req.socketUserMap) {
      const updatedStatus = await Status.findById(statusId).populate(
        "viewers",
        "username profilePicture"
      );

      const statusOwnerSocketId = req.socketUserMap.get(String(status.user));

      if (statusOwnerSocketId) {
        req.io.to(statusOwnerSocketId).emit("status_viewed", {
          statusId,
          viewerId: userId,
          totalViewers: updatedStatus.viewers.length,
          viewers: updatedStatus.viewers,
        });
      }
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

    if (String(status.user) !== String(userId)) {
      return response(res, 403, "Not authorized to delete this status");
    }

    await status.deleteOne();

    // CONTACT SCOPING GOES HERE: same as createStatus above — broadcasts to
    // every connected user until a contacts feature exists.
    if (req.io && req.socketUserMap) {
      for (const [connectedId, socketId] of req.socketUserMap) {
        if (connectedId !== String(userId)) {
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