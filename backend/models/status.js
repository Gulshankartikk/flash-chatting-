const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  contentType: {
    type: String,
    enum: ["image", "video", "text"],
    default: "text",
  },
  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

// Prevent OverwriteModelError
const Status = mongoose.model("status", statusSchema);

module.exports = Status;