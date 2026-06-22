const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    // Per-user unread count — required since each participant needs
    // their own count (a 1-on-1 chat's "unread" is different for each
    // side, and a group has one count per member).
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },

    conversationType: {
      type: String,
      enum: ["private", "group"],
      default: "private",
    },

    // Group-chat fields — unused for private chats but needed once
    // conversationType is "group".
    groupName: {
      type: String,
      trim: true,
    },

    groupAvatar: {
      type: String,
    },

    groupAdmins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // WhatsApp's "mute" toggle, per-user — left as a flat array of
    // userIds with an optional mutedUntil, simplest version.
    mutedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Prevent duplicate 1-on-1 conversations between the same two users.
// Only enforced for private chats — groups can share the same pair
// of participants across multiple group conversations.
conversationSchema.index(
  { participants: 1 },
  {
    unique: true,
    partialFilterExpression: { conversationType: "private" },
  }
);

module.exports =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", conversationSchema);