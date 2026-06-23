import React, { useState, useContext } from "react";
import { Search, Pin } from "lucide-react";
import { toast } from "react-toastify";
import useChatStore from "../../store/chatStore";
import useUserStore from "../../store/useUserStore";
import useLayoutStore from "../../store/useLayoutStore";
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

  const editMessage         = useChatStore((s) => s.editMessage);
  const pinMessage          = useChatStore((s) => s.pinMessage);
  const forwardMessage      = useChatStore((s) => s.forwardMessage);

  const contacts            = useLayoutStore((s) => s.contacts);

  const { startCall } = useContext(CallContext);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [forwardingMsg, setForwardingMsg] = useState(null);
  const [forwardTargets, setForwardTargets] = useState([]);

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

  const handleEdit = async (msg, newText) => {
    try {
      await editMessage(msg._id, newText);
      toast.success("Message edited successfully");
    } catch (err) {
      toast.error("Failed to edit message");
    }
  };

  const handlePin = async (msg) => {
    try {
      await pinMessage(msg._id);
      toast.success(msg.isPinned ? "Message unpinned" : "Message pinned");
    } catch (err) {
      toast.error("Failed to pin message");
    }
  };

  // Find the pinned message in the current conversation
  const pinnedMessage = messages.find((m) => m.isPinned && !m.isDeletedForEveryone && !m.isDeleted);

  // Filter messages if search is active
  const displayedMessages = searchQuery.trim()
    ? messages.filter((m) =>
        (m.content || m.message || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  if (!selectedContact) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-[#000000] text-slate-400 dark:text-[#A0A0A0] font-sans">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 5h16v10H9l-4 4v-4H4V5Z"
            stroke="#FF6B00"
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_#FF6B00]"
          />
        </svg>
        <p className="text-base font-semibold text-slate-800 dark:text-[#FFFFFF]">No conversation open</p>
        <p className="text-xs max-w-xs text-center opacity-70">
          Select a user from the sidebar to begin messaging.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#000000] text-slate-800 dark:text-[#FFFFFF] font-sans relative">
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
        <div className="px-4 py-2 bg-slate-50 dark:bg-[#111111] border-b border-slate-200 dark:border-[#222222] flex items-center gap-2 animate-fade-in">
          <Search size={14} className="text-slate-400 dark:text-[#555555]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="flex-1 bg-white dark:bg-black text-slate-800 dark:text-[#FFFFFF] placeholder-slate-400 dark:placeholder-[#555555] px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-[#222222] focus:outline-none focus:border-[#FF6B00]"
          />
          <button
            onClick={() => {
              setSearchQuery("");
              setSearchOpen(false);
            }}
            className="text-xs text-[#A0A0A0] hover:text-[#FF9E00]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Pinned Message Indicator Banner */}
      {pinnedMessage && (
        <div className="bg-slate-50 dark:bg-[#1c1c1c] border-b border-slate-200 dark:border-[#222222] px-4 py-2 flex items-center justify-between text-xs text-slate-400 dark:text-[#A0A0A0] gap-3">
          <div
            className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
            onClick={() => {
              const element = document.getElementById(`msg-${pinnedMessage._id}`);
              if (element) {
                element.scrollIntoView({ behavior: "smooth" });
                element.classList.add("bg-[#FF6B00]/25");
                setTimeout(() => {
                  element.classList.remove("bg-[#FF6B00]/25");
                }, 2000);
              }
            }}
          >
            <Pin size={12} className="text-[#FFD166] rotate-45 flex-shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-white flex-shrink-0">Pinned Message:</span>
            <span className="truncate flex-1">{pinnedMessage.content || "Media"}</span>
          </div>
          <button
            onClick={() => handlePin(pinnedMessage)}
            className="text-[#FF3D71] hover:underline flex-shrink-0 text-[10px]"
          >
            Unpin
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
        onEdit={handleEdit}
        onPin={handlePin}
        onForward={(msg) => setForwardingMsg(msg)}
        onReplyPreviewClick={(reply) => {
          const element = document.getElementById(`msg-${reply._id}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
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

      {/* Forward Message Modal */}
      {forwardingMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#222222] rounded-2xl p-6 shadow-2xl flex flex-col max-h-[80vh]">
            <h3 className="text-slate-800 dark:text-white font-bold text-base border-b border-slate-200 dark:border-[#222222] pb-3 mb-4 text-left">Forward Message</h3>
            
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-[#222222] mb-4">
              {contacts.map((contact) => {
                const isChecked = forwardTargets.includes(contact._id);
                return (
                  <div
                    key={contact._id}
                    onClick={() => {
                      setForwardTargets(prev =>
                      isChecked ? prev.filter(id => id !== contact._id) : [...prev, contact._id]
                      );
                    }}
                    className="flex items-center gap-3 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#1c1c1c] px-2 rounded-xl transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      className="accent-[#FF6B00] rounded"
                    />
                    <img
                      src={contact.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=25D366&color=fff`}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-[#222222]"
                    />
                    <span className="text-sm font-semibold text-slate-800 dark:text-white text-left truncate flex-1">{contact.name}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setForwardingMsg(null);
                  setForwardTargets([]);
                }}
                className="flex-1 py-2.5 border border-slate-200 dark:border-[#222222] hover:bg-slate-100 dark:hover:bg-[#222222] text-slate-800 dark:text-white rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (forwardTargets.length === 0) return;
                  try {
                    await forwardMessage(forwardingMsg, forwardTargets);
                    toast.success("Message forwarded!");
                  } catch (e) {
                    toast.error("Failed to forward message");
                  }
                  setForwardingMsg(null);
                  setForwardTargets([]);
                }}
                disabled={forwardTargets.length === 0}
                className="flex-1 py-2.5 bg-[#FF6B00] hover:bg-[#E05E00] disabled:opacity-50 text-white rounded-xl text-xs font-semibold"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;