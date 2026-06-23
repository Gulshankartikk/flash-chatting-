import { io } from "socket.io-client";

let socket = null;
let typingStartCallback = null;
let typingStopCallback = null;
let onlineCallback = null;
let offlineCallback = null;


export const initializeSocket = (user) => {
  if (socket) return socket;

  const BACKEND_URL = new URL(process.env.REACT_APP_API_URL).origin;

  socket = io(BACKEND_URL, {
    withCredentials: true,
    transports: ["polling", "websocket"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    path: "/socket.io",
  });

  socket.on("connect", () => {
    if (user?._id) socket.emit("user_connected", user._id);
  });

  // ✅ Re-announce presence after a reconnect (dropped wifi, tab sleep,
  // etc.) — without this the backend may still think we're offline even
  // though the socket silently reconnected.
  socket.io.on("reconnect", () => {
    if (user?._id) socket.emit("user_connected", user._id);
  });

  socket.on("connect_error", (error) => console.error("Socket error:", error));
  socket.on("disconnect", (reason) => console.log("Disconnected:", reason));

  return socket;
};

export const getSocket = () => socket;

// ─── Send message ─────────────────────────────
export const sendMessage = (messageData) => {
  if (!socket) return;
  socket.emit("send_message", messageData);
};

// ─── Receive message ──────────────────────────
export const onReceiveMessage = (callback) => {
  if (!socket) return;
  socket.off("receive_message");
  socket.on("receive_message", callback);
};

// ─── Typing  (backend uses "typing_start" / "typing_stop") ───
export const emitTyping = ({ conversationId, receiverId }) => {
  if (!socket) return;
  socket.emit("typing_start", { conversationId, receiverId }); // ✅ backend event name
};

export const emitStopTyping = ({ conversationId, receiverId }) => {
  if (!socket) return;
  socket.emit("typing_stop", { conversationId, receiverId }); // ✅ backend event name
};

// ─── Backend emits a single "user_typing" event with { userId, conversationId, isTyping } ──
// ✅ FIX: onUserTyping and onUserStopTyping both listened on "user_typing"
// but called socket.off() with event names ("user_stop_typing") that were
// never actually registered. That off() was a no-op, so every time a
// component re-mounted (or this was called again on reconnect) a *second*
// "user_typing" listener stacked on top of the first instead of replacing
// it — each incoming event then fired the callback twice, three times,
// etc. Both listeners now correctly clear the real "user_typing" event
// before re-attaching.
export const onUserTyping = (callback) => {
  typingStartCallback = callback;
  setupUserTypingListener();
};

export const onUserStopTyping = (callback) => {
  typingStopCallback = callback;
  setupUserTypingListener();
};

const setupUserTypingListener = () => {
  if (!socket) return;
  socket.off("user_typing");
  socket.on("user_typing", (data) => {
    if (data.isTyping && typingStartCallback) typingStartCallback(data);
    if (!data.isTyping && typingStopCallback) typingStopCallback(data);
  });
};

// ─── Read receipts ────────────────────────────
// Backend expects: { messageIds: [], senderId }
// Backend emits:  "message_status_update" { messageId, messageStatus }
export const emitMessageRead = ({ messageIds, senderId }) => {
  if (!socket) return;
  socket.emit("message_read", { messageIds, senderId }); // ✅ backend event name
};

export const onMessageRead = (callback) => {
  if (!socket) return;
  socket.off("message_status_update");
  socket.on("message_status_update", callback); // ✅ backend emits this
};

// ─── Online / Offline ─────────────────────────
// Backend emits a single "user_status" event with { userId, isOnline, lastSeen }
// ✅ FIX: same bug as typing above — onUserOnline/onUserOffline called
// socket.off("user_status_online") / socket.off("user_status_offline"),
// neither of which is a real event name, so nothing was ever cleared.
// Each re-registration stacked another listener on "user_status",
// causing online/offline callbacks to fire multiple times per event
// after a remount or reconnect.
export const onUserOnline = (callback) => {
  onlineCallback = callback;
  setupUserStatusListener();
};

export const onUserOffline = (callback) => {
  offlineCallback = callback;
  setupUserStatusListener();
};

const setupUserStatusListener = () => {
  if (!socket) return;
  socket.off("user_status");
  socket.on("user_status", (data) => {
    if (data.isOnline && onlineCallback) onlineCallback(data);
    if (!data.isOnline && offlineCallback) offlineCallback(data);
  });
};

// ─── Reactions ────────────────────────────────
// Backend expects: { messageId, emoji, reactionUserId }
// Backend emits:  "reaction_update" { messageId, reactions }
export const emitReaction = ({ messageId, emoji, reactionUserId }) => {
  if (!socket) return;
  socket.emit("add_reaction", { messageId, emoji, reactionUserId }); // ✅ backend event
};

export const onReactionUpdate = (callback) => {
  if (!socket) return;
  socket.off("reaction_update");
  socket.on("reaction_update", callback);
};

// ─── User status check ────────────────────────
export const getUserStatus = (userId, callback) => {
  if (!socket) return;
  socket.emit("get_user_status", userId, callback);
};

// ─── Join / Leave room ────────────────────────
export const joinConversation = (conversationId) => {
  if (!socket) return;
  socket.emit("join_conversation", conversationId);
};

export const leaveConversation = (conversationId) => {
  if (!socket) return;
  socket.emit("leave_conversation", conversationId);
};

// ─── Disconnect ───────────────────────────────
export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners(); // ✅ also clear listeners, not just the connection
    socket.disconnect();
    socket = null;
  }
};