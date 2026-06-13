const express = require("express");
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");
const { multerMiddleware } = require("../config/cloudinaryConfig");

const router = express.Router();

router.post(
  "/send-message",
  authMiddleware,
  multerMiddleware,
  chatController.sendMessage
);

router.get(
  "/conversation",
  authMiddleware,
  chatController.getConversation
);

router.get(
  "/conversation/:conversationId/:message",
  authMiddleware,
  chatController.getMessage
);

router.put(
  "/message/read",
  authMiddleware,
  chatController.markAsRead
);

router.delete(
  "/message/:messageId",
  authMiddleware,
  chatController.deleteMessage
);

module.exports = router;