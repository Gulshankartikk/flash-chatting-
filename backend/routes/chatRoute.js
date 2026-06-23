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

router.put(
  "/message/:messageId",
  authMiddleware,
  chatController.editMessage
);

router.post(
  "/message/bulk-delete",
  authMiddleware,
  chatController.bulkDeleteMessages
);

router.post(
  "/message/:messageId/react",
  authMiddleware,
  chatController.reactToMessage
);

router.put(
  "/message/:messageId/pin",
  authMiddleware,
  chatController.pinMessage
);

module.exports = router;