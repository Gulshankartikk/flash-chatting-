const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.type.objectId, ref: "User" }],
    lastmessage: { type: mongoose.Schema.type.ObjectId, ref: "message" },
    unreadCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const conversation = mongoose.model("conversation", conversationSchema);
module.exports = conversation;
