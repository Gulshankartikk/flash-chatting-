import React, { useState, useContext } from "react";
import { Search } from "lucide-react";
import useChatStore from "../../store/chatStore";
import useUserStore from "../../store/useUserStore";
import { CallContext } from "../../context/CallContext";
import ChatHeader from "../../components/chat/ChatHeader";
import MessageList from "../../components/chat/MessageList";
import ChatInput from "../../components/chat/ChatInput";
import TypingIndicator from "../../components/chat/TypingIndicator";

const ChatWindow = ({ selectedContact, setSelectedContact, isMobile }) => {
  const currentUser = useUserStore((s) => s.user);

  const activeConversation = useChatStore((s) => s.activeConversation);
  const messages            = useChatStore((s) => s.messages);
  const isLoadingMessages   = useChatStore((s) => s.isLoadingMessages);
  const sendMessage         = useChatStore((s) => s.sendMessage);
  const deleteMessage       = useChatStore((s) => s.deleteMessage);
  const reactToMessage       = useChatStore((s) => s.reactToMessage);
  const startTyping         = useChatStore((s) => s.startTyping);
  const stopTyping          = useChatStore((s) => s.stopTyping);
  const getTypingUsers      = useChatStore((s) => s.getTypingUsers);
  const replyTo             = useChatStore((s) => s.replyTo);
  const setReplyTo          = useChatStore((s) => s.setReplyTo);
  const clearReplyTo        = useChatStore((s) => s.clearReplyTo);

  const { startCall } = useContext(CallContext);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const otherUser =
    activeConversation?.participants?.find((p) => p._id !== currentUser?._id) ||
    selectedContact?.otherUser ||
    selectedContact;

  const otherUserId = otherUser?._id;

  const typingUserIds = activeConversation
    ? getTypingUsers(activeConversation._id)
    : [];
  const isOtherTyping = otherUserId ? typingUserIds.includes(otherUserId) : false;

  const handleSend = ({ message, messageType, mediaFile }) => {
    if (!otherUserId) return;
    sendMessage({
      receiverId: otherUserId,
      message,
      messageType,
      mediaFile,
    });
  };

  const handleDelete = (msg, deleteFor) => {
    deleteMessage(msg._id, deleteFor);
  };

  const handleReact = (msg, emoji) => {
    reactToMessage(msg._id, emoji);
  };

  const handleVoiceCall = () => {
    if (otherUser) startCall(otherUser, "voice");
  };

  const handleVideoCall = () => {
    if (otherUser) startCall(otherUser, "video");
  };

  // Filter messages if search is active
  const displayedMessages = searchQuery.trim()
    ? messages.filter((m) =>
        (m.content || m.message || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  if (!selectedContact) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-[#0A0A0F] text-slate-400 dark:text-[#9090B0] font-sans">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 5h16v10H9l-4 4v-4H4V5Z"
            stroke="#6C63FF"
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_#6C63FF]"
          />
        </svg>
        <p className="text-base font-semibold text-slate-800 dark:text-[#F0F0FF]">No conversation open</p>
        <p className="text-xs max-w-xs text-center opacity-70">
          Select a user from the sidebar to begin messaging.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#0A0A0F] text-slate-800 dark:text-[#F0F0FF] font-sans relative">
      {/* Chat Header */}
      <ChatHeader
        otherUser={otherUser}
        isMobile={isMobile}
        onBack={() => setSelectedContact(null)}
        isTyping={isOtherTyping}
        onVoiceCall={handleVoiceCall}
        onVideoCall={handleVideoCall}
        onSearchToggle={() => setSearchOpen(!searchOpen)}
      />

      {/* Inline Search Bar */}
      {searchOpen && (
        <div className="px-4 py-2 bg-slate-50 dark:bg-[#111118] border-b border-slate-200 dark:border-[#2A2A3D] flex items-center gap-2 animate-fade-in">
          <Search size={14} className="text-slate-400 dark:text-[#4A4A6A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="flex-1 bg-white dark:bg-black text-slate-800 dark:text-[#F0F0FF] placeholder-slate-400 dark:placeholder-[#4A4A6A] px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-[#2A2A3D] focus:outline-none focus:border-[#6C63FF]"
          />
          <button
            onClick={() => {
              setSearchQuery("");
              setSearchOpen(false);
            }}
            className="text-xs text-[#9090B0] hover:text-[#FF6584]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Message List */}
      <MessageList
        messages={displayedMessages}
        currentUserId={currentUser?._id}
        isLoadingMore={isLoadingMessages}
        hasMore={false}
        onReply={(msg) => setReplyTo(msg)}
        onReact={handleReact}
        onDelete={handleDelete}
        onReplyPreviewClick={(reply) => {
          // Handle scroll to or highlight replied message
        }}
      />

      {/* Typing Indicator */}
      {isOtherTyping && <TypingIndicator />}

      {/* Chat Input Compose Bar */}
      <ChatInput
        onSend={handleSend}
        replyTo={replyTo}
        onCancelReply={clearReplyTo}
        otherUserId={otherUserId}
        otherUserName={otherUser?.username || otherUser?.name || "Contact"}
        onTypingStart={() => startTyping(otherUserId)}
        onTypingStop={() => stopTyping(otherUserId)}
      />
    </div>
  );
};

export default ChatWindow;