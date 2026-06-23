import { create } from "zustand";
import axios from "axios";
import {
  initializeSocket,
  disconnectSocket,
  getSocket,
  joinConversation,
  leaveConversation,
  sendMessage as emitSendMessage,
  onReceiveMessage,
  emitTyping,
  emitStopTyping,
  onUserTyping,
  onUserStopTyping,
  emitMessageRead,
  onMessageRead,
  onUserOnline,
  onUserOffline,
} from "../services/chat.services";

const API = process.env.REACT_APP_API_URL;

// ─── Axios instance ───────────────────────────
const api = axios.create({ baseURL: API, withCredentials: true });

const TYPING_AUTO_CLEAR_MS = 5000; // WhatsApp auto-clears "typing…" if stop event never arrives
const typingTimeouts = {}; // { `${conversationId}_${userId}`: timeoutId } — module-level, not state

const useChatStore = create((set, get) => ({
  // ─────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────
  currentUser: null, // ✅ now actually part of the store
  conversations: [], // all conversations (sorted by latest)
  activeConversation: null, // currently open chat
  messages: [], // messages of active chat
  onlineUsers: new Set(),
  lastSeenMap: {}, // { userId: ISOString }  ← WhatsApp "last seen"
  typingUsers: {}, // { conversationId: [userId] }
  unreadCounts: {}, // { conversationId: number }

  // Message states
  replyTo: null, // message being replied to
  selectedMessages: [], // for multi-select (delete / forward)

  // Media preview
  mediaPreview: null, // { url, type: "image"|"video"|"document" }

  // Loading / error
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSendingMessage: false,
  error: null,

  // ─────────────────────────────────────────────
  // 1. SOCKET — connect after login
  // ─────────────────────────────────────────────
  // ✅ Now takes the user explicitly instead of silently reading
  // get().currentUser before it's ever set (which was always undefined).
  connectSocket: (user) => {
    if (user) set({ currentUser: user });
    initializeSocket(user || get().currentUser);

    // ── Online / Offline ──
    onUserOnline(({ userId }) => {
      set((s) => ({
        onlineUsers: new Set([...s.onlineUsers, userId]),
        lastSeenMap: { ...s.lastSeenMap, [userId]: null }, // null = online now
      }));
    });

    onUserOffline(({ userId, lastSeen }) => {
      set((s) => {
        const updated = new Set(s.onlineUsers);
        updated.delete(userId);
        return {
          onlineUsers: updated,
          lastSeenMap: { ...s.lastSeenMap, [userId]: lastSeen },
        };
      });
    });

    // ── Incoming message ──
    onReceiveMessage((data) => {
      const { activeConversation, messages, unreadCounts, conversations } =
        get();

      // ✅ Guard against duplicate delivery (socket + REST race, or re-subscribe)
      const alreadyHave = messages.some((m) => m._id === data._id);

      if (activeConversation?._id === data.conversationId) {
        if (!alreadyHave) {
          set({ messages: [...messages, data] });
        }
        // Only send a read receipt for messages that aren't our own
        if (!data.isMine) {
          emitMessageRead({
            messageId: data._id,
            conversationId: data.conversationId,
            senderId: data.senderId,
            status: "read", // ✅✅ blue ticks
          });
        }
      } else {
        // Background → bump unread badge
        set({
          unreadCounts: {
            ...unreadCounts,
            [data.conversationId]: (unreadCounts[data.conversationId] || 0) + 1,
          },
        });
      }

      // Reorder conversations: latest on top (WhatsApp behavior)
      const updatedConvs = conversations
        .map((c) =>
          c._id === data.conversationId
            ? { ...c, lastMessage: data, updatedAt: data.createdAt }
            : c,
        )
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      set({ conversations: updatedConvs });
    });

    // ── Read receipts: ✓ → ✓✓ → ✓✓(blue) ──
    onMessageRead(({ messageId, status }) => {
      set((s) => ({
        messages: s.messages.map((msg) =>
          msg._id === messageId ? { ...msg, status } : msg,
        ),
      }));
    });

    // ── Typing ──
    onUserTyping(({ conversationId, userId }) => {
      const key = `${conversationId}_${userId}`;

      // ✅ Auto-clear after a few seconds in case "stop typing" never arrives
      // (dropped connection, app killed, etc.) — exactly what WhatsApp does.
      clearTimeout(typingTimeouts[key]);
      typingTimeouts[key] = setTimeout(() => {
        get().clearTypingUser(conversationId, userId);
      }, TYPING_AUTO_CLEAR_MS);

      set((s) => {
        const prev = s.typingUsers[conversationId] || [];
        if (prev.includes(userId)) return {};
        return {
          typingUsers: {
            ...s.typingUsers,
            [conversationId]: [...prev, userId],
          },
        };
      });
    });

    onUserStopTyping(({ conversationId, userId }) => {
      const key = `${conversationId}_${userId}`;
      clearTimeout(typingTimeouts[key]);
      get().clearTypingUser(conversationId, userId);
    });

    const s = getSocket();
    if (s) {
      s.off("message_edited");
      s.on("message_edited", ({ messageId, content }) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === messageId ? { ...m, content, isEdited: true } : m
          ),
        }));
      });

      s.off("message_pinned");
      s.on("message_pinned", ({ messageId, isPinned, conversationId }) => {
        set((state) => ({
          messages: state.messages.map((m) => {
            if (m._id === messageId) return { ...m, isPinned };
            if (m.conversation === conversationId || m.conversationId === conversationId) {
              return { ...m, isPinned: false };
            }
            return m;
          }),
        }));
      });
    }
  },

  clearTypingUser: (conversationId, userId) => {
    set((s) => ({
      typingUsers: {
        ...s.typingUsers,
        [conversationId]: (s.typingUsers[conversationId] || []).filter(
          (id) => id !== userId,
        ),
      },
    }));
  },

  // ─────────────────────────────────────────────
  // 2. SOCKET — disconnect on logout
  // ─────────────────────────────────────────────
  disconnectSocket: () => {
    disconnectSocket();
    Object.values(typingTimeouts).forEach(clearTimeout);
    set({ onlineUsers: new Set(), typingUsers: {}, lastSeenMap: {} });
  },

  setCurrentUser: (user) => set({ currentUser: user }),

  // ─────────────────────────────────────────────
  // 3. FETCH CONVERSATIONS
  // ─────────────────────────────────────────────
  fetchConversations: async () => {
    set({ isLoadingConversations: true, error: null });
    try {
      const { data } = await api.get("/api/chat/conversation");
      const list = data?.data || data;
      const sorted = [...list].sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
      );

      // ✅ Seed unread counts from server so badges survive a refresh,
      // instead of only existing in memory after fetchConversations runs once.
      const unreadCounts = {};
      sorted.forEach((c) => {
        if (typeof c.unreadCount === "number") unreadCounts[c._id] = c.unreadCount;
      });

      set((s) => ({
        conversations: sorted,
        unreadCounts: { ...unreadCounts, ...s.unreadCounts },
        isLoadingConversations: false,
      }));
    } catch (err) {
      set({
        error: err?.response?.data?.message || "Failed to load conversations",
        isLoadingConversations: false,
      });
    }
  },

  // ─────────────────────────────────────────────
  // 4. OPEN CONVERSATION
  // ─────────────────────────────────────────────
  openConversation: async (conversation) => {
    const { activeConversation } = get();
    if (activeConversation?._id === conversation._id) return;

    if (activeConversation?._id && !activeConversation.isDraft) {
      leaveConversation(activeConversation._id);
    }

    set({
      activeConversation: conversation,
      messages: [],
      replyTo: null,
      selectedMessages: [],
      isLoadingMessages: !conversation.isDraft, // ✅ was hardcoded false even for real chats
      error: null,
    });

    // ✅ Draft conversation — nothing to fetch, no backend call
    if (conversation.isDraft) {
      return;
    }

    joinConversation(conversation._id);

    set((s) => ({
      unreadCounts: { ...s.unreadCounts, [conversation._id]: 0 },
    }));

    try {
      const { data } = await api.get(
        `/api/chat/conversation/${conversation._id}/message`,
      );
      const list = data?.data || data;
      set({ messages: list, isLoadingMessages: false });

      list
        .filter((m) => m.status !== "read" && !m.isMine)
        .forEach((m) =>
          emitMessageRead({ messageIds: [m._id], senderId: m.senderId }),
        );
    } catch (err) {
      set({
        error: err?.response?.data?.message || "Failed to load messages",
        isLoadingMessages: false,
      });
    }
  },

  // ─────────────────────────────────────────────
  // 5. CLOSE CONVERSATION
  // ─────────────────────────────────────────────
  closeConversation: () => {
    const { activeConversation } = get();
    if (activeConversation?._id && !activeConversation.isDraft) {
      leaveConversation(activeConversation._id);
    }
    set({
      activeConversation: null,
      messages: [],
      replyTo: null,
      selectedMessages: [],
    });
  },

  // ─────────────────────────────────────────────
  // 6. SEND MESSAGE  (text / image / video / doc)
  // ─────────────────────────────────────────────
  sendMessage: async ({
    receiverId,
    message,
    messageType = "text",
    mediaFile = null,
  }) => {
    const { activeConversation, messages, replyTo } = get();
    if (!activeConversation) return;

    set({ isSendingMessage: true });

    // Optimistic message (clock icon while sending)
    const tempId = `temp_${Date.now()}`;
    const objectUrl = mediaFile ? URL.createObjectURL(mediaFile) : null;
    const tempMsg = {
      _id: tempId,
      conversationId: activeConversation._id,
      receiverId,
      message,
      messageType,
      mediaUrl: objectUrl,
      replyTo: replyTo || null,
      status: "sending", // ⏱
      isMine: true,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    set({ messages: [...messages, tempMsg], replyTo: null });

    // ✅ Was a draft conversation (first message to this person) — the real
    // conversationId only exists once the backend creates it below.
    const wasDraft = !!activeConversation.isDraft;

    try {
      let savedMessage;

      if (mediaFile) {
        // Upload media via FormData
        const formData = new FormData();
        formData.append("file", mediaFile);
        formData.append("messageType", messageType);
        formData.append("receiverId", receiverId);
        if (replyTo) formData.append("replyToId", replyTo._id);
        formData.append("senderId", get().currentUser?._id || "");

        const { data: mediaData } = await api.post(
          `/api/chat/send-message`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        savedMessage = mediaData?.data || mediaData;
      } else {
        // Text: emit socket first (fast), then persist via REST
        // (skip the socket emit for drafts — there's no real conversationId yet)
        if (!wasDraft) {
          emitSendMessage({
            conversationId: activeConversation._id,
            receiverId,
            message,
            messageType,
            replyToId: replyTo?._id || null,
          });
        }

        const { data: msgData } = await api.post(`/api/chat/send-message`, {
          senderId: get().currentUser?._id,
          receiverId,
          content: message,
          contentType: messageType,
        });
        savedMessage = msgData?.data || msgData;
      }

      // ✅ Free the temporary blob URL now that we have the real mediaUrl
      if (objectUrl) URL.revokeObjectURL(objectUrl);

      const realConversationId = savedMessage.conversationId || activeConversation._id;

      // Replace optimistic → real (status: "sent" ✓)
      set((s) => ({
        messages: s.messages.map((m) => (m._id === tempId ? savedMessage : m)),
        isSendingMessage: false,
      }));

      // ✅ If this was a draft, swap it out for the real, joinable conversation
      // returned by the backend instead of staying on the fake draft id forever.
      if (wasDraft) {
        const realConversation = {
          ...activeConversation,
          _id: realConversationId,
          isDraft: false,
          lastMessage: savedMessage,
          updatedAt: savedMessage.createdAt,
        };
        joinConversation(realConversationId);
        set((s) => ({
          activeConversation: realConversation,
          conversations: [
            realConversation,
            ...s.conversations.filter((c) => c._id !== realConversationId),
          ],
        }));
      } else {
        // Reorder conversations list
        set((s) => ({
          conversations: s.conversations
            .map((c) =>
              c._id === activeConversation._id
                ? {
                    ...c,
                    lastMessage: savedMessage,
                    updatedAt: savedMessage.createdAt,
                  }
                : c,
            )
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
        }));
      }
    } catch (err) {
      // Mark failed — WhatsApp shows a retry icon (don't delete)
      set((s) => ({
        messages: s.messages.map((m) =>
          m._id === tempId ? { ...m, status: "failed" } : m,
        ),
        isSendingMessage: false,
        error: err?.response?.data?.message || "Message failed",
      }));
    }
  },

  // Retry failed message
  retryMessage: (failedMsg) => {
    set((s) => ({
      messages: s.messages.filter((m) => m._id !== failedMsg._id),
    }));
    get().sendMessage({
      receiverId: failedMsg.receiverId,
      message: failedMsg.message,
      messageType: failedMsg.messageType,
    });
  },

  // ─────────────────────────────────────────────
  // 7. REPLY TO MESSAGE  (WhatsApp quoted reply)
  // ─────────────────────────────────────────────
  setReplyTo: (message) => set({ replyTo: message }),
  clearReplyTo: () => set({ replyTo: null }),

  // ─────────────────────────────────────────────
  // 8. DELETE MESSAGE  ("Delete for me" / "Delete for everyone")
  // ─────────────────────────────────────────────
  deleteMessage: async (messageId, deleteFor = "me") => {
    try {
      await api.delete(`/api/chat/message/${messageId}`, { data: { deleteFor } });

      if (deleteFor === "everyone") {
        // Show "This message was deleted" placeholder — WhatsApp style
        set((s) => ({
          messages: s.messages.map((m) =>
            m._id === messageId ? { ...m, message: null, isDeleted: true } : m,
          ),
        }));
      } else {
        set((s) => ({
          messages: s.messages.filter((m) => m._id !== messageId),
        }));
      }
    } catch (err) {
      set({ error: err?.response?.data?.message || "Delete failed" });
    }
  },

  // ─────────────────────────────────────────────
  // 9. EMOJI REACTIONS
  // ─────────────────────────────────────────────
  reactToMessage: async (messageId, emoji) => {
    // ✅ Optimistic toggle so the UI responds instantly, like WhatsApp's
    // reaction picker — previously the reaction only appeared after the
    // round-trip completed.
    const { currentUser, messages } = get();
    const prevMessages = messages;

    set((s) => ({
      messages: s.messages.map((m) => {
        if (m._id !== messageId) return m;
        const existing = m.reactions || [];
        const mine = existing.find((r) => r.userId === currentUser?._id);
        let reactions;
        if (mine && mine.emoji === emoji) {
          // tapping the same emoji again removes it
          reactions = existing.filter((r) => r.userId !== currentUser?._id);
        } else {
          reactions = [
            ...existing.filter((r) => r.userId !== currentUser?._id),
            { emoji, userId: currentUser?._id, userName: currentUser?.name },
          ];
        }
        return { ...m, reactions };
      }),
    }));

    try {
      const { data } = await api.post(`/api/chat/message/${messageId}/react`, {
        emoji,
      });
      const saved = data?.data || data;
      set((s) => ({
        messages: s.messages.map((m) => (m._id === messageId ? saved : m)),
      }));
    } catch (err) {
      // roll back on failure
      set({ messages: prevMessages, error: "Reaction failed" });
    }
  },

  // ─────────────────────────────────────────────
  // 10. MULTI-SELECT (bulk delete / forward)
  // ─────────────────────────────────────────────
  toggleSelectMessage: (messageId) => {
    set((s) => {
      const already = s.selectedMessages.includes(messageId);
      return {
        selectedMessages: already
          ? s.selectedMessages.filter((id) => id !== messageId)
          : [...s.selectedMessages, messageId],
      };
    });
  },

  clearSelection: () => set({ selectedMessages: [] }),

  deleteSelectedMessages: async (deleteFor = "me") => {
    const { selectedMessages } = get();
    try {
      await api.post("/api/chat/message/bulk-delete", {
        messageIds: selectedMessages,
        deleteFor,
      });
      if (deleteFor === "everyone") {
        set((s) => ({
          messages: s.messages.map((m) =>
            selectedMessages.includes(m._id)
              ? { ...m, message: null, isDeleted: true }
              : m,
          ),
          selectedMessages: [],
        }));
      } else {
        set((s) => ({
          messages: s.messages.filter((m) => !selectedMessages.includes(m._id)),
          selectedMessages: [],
        }));
      }
    } catch (err) {
      set({ error: "Bulk delete failed" });
    }
  },

  // ─────────────────────────────────────────────
  // EDIT MESSAGE
  // ─────────────────────────────────────────────
  editMessage: async (messageId, newContent) => {
    try {
      const { data } = await api.put(`/api/chat/message/${messageId}`, { content: newContent });
      const updated = data?.data || data;
      set((s) => ({
        messages: s.messages.map((m) => m._id === messageId ? updated : m),
      }));
    } catch (err) {
      set({ error: "Edit message failed" });
      throw err;
    }
  },

  // ─────────────────────────────────────────────
  // PIN MESSAGE
  // ─────────────────────────────────────────────
  pinMessage: async (messageId) => {
    try {
      const { data } = await api.put(`/api/chat/message/${messageId}/pin`);
      const updated = data?.data || data;
      set((s) => ({
        messages: s.messages.map((m) => {
          if (m._id === messageId) return updated;
          return { ...m, isPinned: false };
        }),
      }));
    } catch (err) {
      set({ error: "Pin message failed" });
      throw err;
    }
  },

  // ─────────────────────────────────────────────
  // FORWARD MESSAGE
  // ─────────────────────────────────────────────
  forwardMessage: async (message, targetUserIds) => {
    const promises = targetUserIds.map(async (receiverId) => {
      return api.post(`/api/chat/send-message`, {
        senderId: get().currentUser?._id,
        receiverId,
        content: message.content || message.message || "",
        contentType: message.contentType || message.messageType || "text",
        imageOrVideoUrl: message.imageOrVideoUrl || null,
      });
    });
    try {
      await Promise.all(promises);
      get().fetchConversations();
    } catch (err) {
      set({ error: "Forward message failed" });
      throw err;
    }
  },

  // ─────────────────────────────────────────────
  // 11. TYPING
  // ─────────────────────────────────────────────
  startTyping: (receiverId) => {
    const { activeConversation } = get();
    if (activeConversation && !activeConversation.isDraft) {
      emitTyping({ conversationId: activeConversation._id, receiverId });
    }
  },

  stopTyping: (receiverId) => {
    const { activeConversation } = get();
    if (activeConversation && !activeConversation.isDraft) {
      emitStopTyping({ conversationId: activeConversation._id, receiverId });
    }
  },

  // ─────────────────────────────────────────────
  // 12. MEDIA PREVIEW LIGHTBOX
  // ─────────────────────────────────────────────
  openMediaPreview: (media) => set({ mediaPreview: media }),
  closeMediaPreview: () => set({ mediaPreview: null }),

  // ─────────────────────────────────────────────
  // 13. SELECT CONTACT / START DRAFT CONVERSATION
  // ─────────────────────────────────────────────
  createConversation: (participant) => {
    // No backend call needed — conversation is created lazily by
    // sendMessage() on the first real message (see chatController.sendMessage),
    // which now also swaps the draft for the real conversation once it exists.
    const existing = get().conversations.find(
      (c) =>
        !c.isDraft && c.participants?.some((p) => p._id === participant._id),
    );
    if (existing) {
      get().openConversation(existing);
      return existing;
    }

    const draftConversation = {
      _id: `draft_${participant._id}`, // temporary id, replaced once a real message is sent
      participants: [participant],
      isDraft: true,
      lastMessage: null,
      updatedAt: new Date().toISOString(),
    };

    get().openConversation(draftConversation);
    return draftConversation;
  },

  // ─────────────────────────────────────────────
  // 14. HELPERS
  // ─────────────────────────────────────────────

  // "online" | "last seen X ago" — WhatsApp style
  getUserStatus: (userId) => {
    const { onlineUsers, lastSeenMap } = get();
    if (onlineUsers.has(userId)) return "online";
    const lastSeen = lastSeenMap[userId];
    if (!lastSeen) return "offline";
    const diff = Date.now() - new Date(lastSeen).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "last seen just now";
    if (mins < 60) return `last seen ${mins}m ago`;
    if (hours < 24) return `last seen ${hours}h ago`;
    return `last seen ${days}d ago`;
  },

  isUserOnline: (userId) => get().onlineUsers.has(userId),
  getTypingUsers: (conversationId) => get().typingUsers[conversationId] || [],
  getUnreadCount: (conversationId) => get().unreadCounts[conversationId] || 0,
  getTotalUnread: () =>
    Object.values(get().unreadCounts).reduce((s, n) => s + n, 0),
  clearError: () => set({ error: null }),
}));

export default useChatStore;