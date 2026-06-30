const User = require("../models/user");
const sendOtpToEmail = require("../services/emailService");
const otpGenerate = require("../utils/otpGenerater");
const response = require("../utils/responseHandler");
const twilioService = require("../services/twilloService");
const generateToken = require("../utils/generateToken");
const { uploadFileToCloudinary } = require("../config/cloudinaryConfig");
const Conversation = require("../models/Conversation");
const jwt = require("jsonwebtoken");
const cache = require("../config/redis");

// STEP 1 — SEND OTP
const sendOtp = async (req, res) => {
  const { phoneNumber, phoneSuffix, email } = req.body;

  try {
    // EMAIL OTP
    if (email) {
      const otp = otpGenerate();
      const expiry = new Date(Date.now() + 5 * 60 * 1000);

      let user = await User.findOne({ email });
      if (!user) user = new User({ email });

      await sendOtpToEmail(email, otp);

      user.emailOtp = otp;
      user.emailOtpExpiry = expiry;
      await user.save();

      return response(res, 200, "OTP sent to your email", { email });
    }

    // PHONE OTP
    if (!phoneNumber || !phoneSuffix) {
      return response(res, 400, "Phone number and country code are required");
    }

    const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;

    let user = await User.findOne({ phoneNumber, phoneSuffix });
    if (!user) user = new User({ phoneNumber, phoneSuffix });

    // ✅ Twilio manages its own OTP — no need to store one locally for phone flow
    await twilioService.sendOtpToPhone(fullPhoneNumber);

    await user.save();

    return response(res, 200, "OTP sent successfully", { phoneNumber, phoneSuffix });
  } catch (error) {
    console.error("sendOtp error:", error);
    return response(res, 500, error.message || "Internal server error");
  }
};

// STEP 2 — VERIFY OTP
const verifyOtp = async (req, res) => {
  const { phoneNumber, phoneSuffix, email, otp } = req.body;

  if (!otp) return response(res, 400, "OTP is required");

  try {
    let user;

    // EMAIL VERIFY
    if (email) {
      user = await User.findOne({ email });
      if (!user) return response(res, 404, "User not found");

      const now = new Date();
      if (
        !user.emailOtp ||
        String(user.emailOtp) !== String(otp) ||
        now > new Date(user.emailOtpExpiry)
      ) {
        return response(res, 400, "Invalid or expired OTP");
      }

      user.isVerified = true;
      user.emailOtp = null;
      user.emailOtpExpiry = null;
      await user.save();
    }

    // PHONE VERIFY
    else {
      if (!phoneNumber || !phoneSuffix) {
        return response(res, 400, "Phone number and country code are required");
      }

      const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
      user = await User.findOne({ phoneNumber, phoneSuffix });
      if (!user) return response(res, 404, "User not found");

      // ✅ Twilio is the source of truth for phone OTPs — no local fallback
      const result = await twilioService.verifyOtp(fullPhoneNumber, otp);
      if (result.status !== "approved") {
        return response(res, 400, "Invalid OTP");
      }

      user.isVerified = true;
      user.emailOtp = null;
      user.emailOtpExpiry = null;
      await user.save();
    }

    const token = generateToken(user._id);

    // ✅ Added secure + sameSite for production safety
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });

    // ✅ Tells the frontend whether this person already finished profile
    // setup (returning user → go straight into the app) or hasn't set a
    // username yet (first-time → still needs the profile-setup step).
    // Without this, every login — new or returning — was being routed
    // back through "set up your profile", overwriting the user's
    // existing username/photo on every sign-in.
    const isNewUser = !user.username;

    return response(res, 200, "OTP verified successfully", { token, user, isNewUser });
  } catch (error) {
    console.error("verifyOtp error:", error);
    return response(res, 500, error.message || "Internal server error");
  }
};

// UPDATE PROFILE
const updateProfile = async (req, res) => {
  const { username, agreed, about } = req.body;
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);
    if (!user) return response(res, 404, "User not found");

    if (req.file) {
      const uploadResult = await uploadFileToCloudinary(req.file);
      user.profilePicture = uploadResult?.secure_url;
    } else if (req.body.profilePicture) {
      user.profilePicture = req.body.profilePicture;
    }

    if (username) user.username = username;
    if (about) user.about = about;
    if (typeof agreed !== "undefined") user.agreed = agreed;

    await user.save();
    await cache.del(`user:${userId}`);
    return response(res, 200, "Profile updated successfully", user);
  } catch (error) {
    // Duplicate key on the unique username index — most likely two
    // requests racing for the same name after both passed the
    // client-side availability check.
    if (error.code === 11000 && error.keyPattern?.username) {
      return response(res, 409, "That username is already taken. Please choose another.");
    }
    console.error("updateProfile error:", error);
    return response(res, 500, "Internal server error");
  }
};

// LOGOUT
const logout = (req, res) => {
  try {
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    return response(res, 200, "Logged out successfully");
  } catch (error) {
    console.error("logout error:", error);
    return response(res, 500, "Internal server error");
  }
};

// CHECK AUTH
const checkAuthenticated = async (req, res) => {
  try {
    const authToken = req.cookies?.auth_token;
    if (!authToken) {
      return response(res, 200, "Not authenticated", { isAuthenticated: false, user: null });
    }

    const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
    const cacheKey = `user:${decoded.userId}`;
    
    let user = await cache.get(cacheKey);
    if (!user) {
      user = await User.findById(decoded.userId).select("-emailOtp -emailOtpExpiry");
      if (user) {
        await cache.set(cacheKey, user, 3600); // Cache for 1 hour
      }
    }
    
    if (!user) {
      return response(res, 200, "User not found", { isAuthenticated: false, user: null });
    }

    return response(res, 200, "Authenticated", { isAuthenticated: true, user });
  } catch (error) {
    return response(res, 200, "Session expired or invalid", { isAuthenticated: false, user: null });
  }
};

// GET ALL USERS
const getAllUser = async (req, res) => {
  const loggedInUser = req.user.userId;

  try {
    const users = await User.find({ _id: { $ne: loggedInUser } })
      .select("username profilePicture lastSeen isOnline about phoneNumber phoneSuffix")
      .lean();

    const userIds = users.map((u) => u._id);

    // ✅ Single query instead of N+1 — fetch all relevant conversations at once
    const conversations = await Conversation.find({
      participants: { $all: [loggedInUser], $in: userIds },
    })
      .populate({ path: "lastMessage", select: "content createdAt sender receiver" })
      .lean();

    // Map conversations by the other participant's ID for O(1) lookup
    const conversationMap = {};
    for (const convo of conversations) {
      const otherId = convo.participants
        .find((p) => String(p) !== String(loggedInUser))
        ?.toString();
      if (otherId) conversationMap[otherId] = convo;
    }

    const usersWithConversation = users.map((user) => ({
      ...user,
      conversation: conversationMap[user._id.toString()] || null,
    }));

    return response(res, 200, "Users fetched successfully", usersWithConversation);
  } catch (error) {
    console.error("getAllUser error:", error);
    return response(res, 500, "Internal server error");
  }
};

// UPDATE USER STATUS
const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status, customStatusText } = req.body;

  // ✅ Prevent users from updating someone else's status
  if (String(req.user.userId) !== String(id)) {
    return response(res, 403, "You can only update your own status");
  }

  try {
    const user = await User.findById(id);
    if (!user) return response(res, 404, "User not found");

    if (status) {
      const activeStatuses = ["online", "away", "busy"];
      user.isOnline = activeStatuses.includes(status);
      user.lastSeen = user.isOnline ? null : new Date();
    }

    if (customStatusText) user.about = customStatusText;

    await user.save();
    await cache.del(`user:${id}`);
    return response(res, 200, "Status updated successfully", user);
  } catch (error) {
    console.error("updateUserStatus error:", error);
    return response(res, 500, "Internal server error");
  }
};

// CHECK USERNAME AVAILABILITY
const checkUsernameAvailability = async (req, res) => {
  const { username } = req.params;

  if (!username || username.trim().length < 3) {
    return response(res, 400, "Username must be at least 3 characters");
  }

  try {
    const safe = username.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Case-insensitive match so "Admin" and "admin" are treated as the
    // same username — otherwise two people could register near-identical
    // handles that only differ by case.
    const existing = await User.findOne({
      username: { $regex: `^${safe}$`, $options: "i" },
    }).select("_id");

    return response(res, 200, "Checked username availability", {
      available: !existing,
    });
  } catch (error) {
    console.error("checkUsernameAvailability error:", error);
    return response(res, 500, "Internal server error");
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  updateProfile,
  logout,
  checkAuthenticated,
  getAllUser,
  updateUserStatus,
  checkUsernameAvailability,
};