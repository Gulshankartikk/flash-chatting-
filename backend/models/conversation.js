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

    unreadCount: {
      type: Number,
      default: 0,
    },

    conversationType: {
      type: String,
      enum: ["private", "group"],
      default: "private",
    },
  },
  { timestamps: true }
);

// prevent duplicate 1-1 conversations
conversationSchema.index({ participants: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
