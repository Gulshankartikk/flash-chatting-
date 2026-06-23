import React, { useState, useEffect, useRef, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MoreVertical,
  MessageSquarePlus,
  X,
  Check,
  CheckCheck,
  LogOut,
  Settings as SettingsIcon,
  Users as UsersIcon,
  Bell,
  Video,
  Phone,
  CircleDot,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useChatStore from "../store/chatStore";
import useUserStore from "../store/useUserStore";
import useLayoutStore from "../store/useLayoutStore";
import useNotifications from "../hooks/useNotifications";
import NotificationPanel from "./notifications/NotificationPanel";
import { getAllUser } from "../services/user.service";
import StatusDot from "./status/StatusDot";
import { CallContext } from "../context/CallContext";

const HomePage = () => {
  const navigate = useNavigate();
  const { startCall } = useContext(CallContext);

  // ── Chat store ──────────────────────────────
  const conversations      = useChatStore((s) => s.conversations);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const openConversation   = useChatStore((s) => s.openConversation);
  const activeConversation = useChatStore((s) => s.activeConversation);
  const createConversation = useChatStore((s) => s.createConversation);
  const unreadCounts       = useChatStore((s) => s.unreadCounts);
  const isLoading          = useChatStore((s) => s.isLoadingConversations);

  // ── Layout store ──────────────────
  const activeView    = useLayoutStore((s) => s.activeView);
  const setActiveView = useLayoutStore((s) => s.setActiveView);
  const contacts       = useLayoutStore((s) => s.contacts);
  const setContacts    = useLayoutStore((s) => s.setContacts);
  const setSelectedContact = useLayoutStore((s) => s.setSelectedContact);

  // ── Current logged-in user ──────────────────
  const currentUser = useUserStore((s) => s.user);
  const logout      = useUserStore((s) => s.logout);

  // ── Notifications hook ──────────────────
  const {
    notifications,
    unreadCount: notifUnread,
    markAllAsRead,
    clearNotification,
  } = useNotifications();

  const [query, setQuery] = useState("");
  const [, setIsLoadingContacts] = useState(false);
  const [startingChatId, setStartingChatId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoadingContacts(true);
      try {
        const res = await getAllUser();
        const users = res?.data || [];
        const mapped = users.map((u) => ({
          _id:          u._id,
          name:         u.username || "Unknown",
          profilePic:   u.profilePicture || "",
          isOnline:     u.isOnline || false,
          lastSeen:     u.lastSeen || null,
          phone:        u.phoneSuffix && u.phoneNumber ? `${u.phoneSuffix} ${u.phoneNumber}` : "",
          conversation: u.conversation || null,
        }));
        setContacts(mapped);
      } catch (err) {
        console.error("Failed to load contacts:", err);
      } finally {
        setIsLoadingContacts(false);
      }
    };
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chatRows = conversations.map((conv) => {
    const other = conv.participants?.find(
      (p) => p._id !== currentUser?._id
    );
    return {
      _id:             conv._id,
      name:            other?.username || other?.name || "Unknown",
      profilePic:      other?.profilePicture || "",
      isOnline:        other?.isOnline || false,
      lastSeen:        other?.lastSeen || null,
      lastMessage:     conv.lastMessage?.content || conv.lastMessage?.message || "",
      lastMessageTime: conv.updatedAt,
      lastMessageMine: conv.lastMessage?.sender === currentUser?._id || conv.lastMessage?.sender?._id === currentUser?._id,
      lastMessageStatus: conv.lastMessage?.messageStatus || conv.lastMessage?.status || null,
      unreadCount:     unreadCounts[conv._id] || 0,
      _conv:           conv,
      otherUser:       other,
    };
  });

  const handleChatClick = (contact) => {
    openConversation(contact._conv);
    setSelectedContact(contact);
  };

  const handleStartChat = async (contact) => {
    if (startingChatId) return;
    setStartingChatId(contact._id);
    try {
      if (contact.conversation) {
        openConversation(contact.conversation);
        setSelectedContact(contact);
      } else {
        const newConv = await createConversation(contact._id);
        setSelectedContact({
          _id: newConv._id,
          conversationId: newConv._id,
          otherUser: contact,
          name: contact.name,
          profilePic: contact.profilePic,
          isOnline: contact.isOnline,
          lastMessage: "",
          unread: 0,
          isDraft: false,
        });
      }
      setActiveView("chats");
    } catch (err) {
      console.error("Failed to start conversation:", err);
    } finally {
      setStartingChatId(null);
    }
  };

  const isContactsView = activeView === "contacts";
  const baseRows = isContactsView ? contacts : chatRows;
  const filteredRows = baseRows.filter((c) =>
    c.name?.toLowerCase().includes(query.toLowerCase())
  );

  const formatPreviewTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const today = new Date();
    return date.toDateString() === today.toDateString()
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const formatLastSeen = (value) => {
    if (!value) return "offline";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "offline";
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "last seen just now";
    if (mins < 60) return `last seen ${mins}m ago`;
    if (hours < 24) return `last seen ${hours}h ago`;
    return `last seen ${days}d ago`;
  };

  const StatusTick = ({ status }) => {
    if (!status) return null;
    if (status === "sent") return <Check size={13} className="text-[#A0A0A0] flex-shrink-0" />;
    if (status === "delivered") return <CheckCheck size={13} className="text-[#A0A0A0] flex-shrink-0" />;
    if (status === "seen" || status === "read") return <CheckCheck size={13} className="text-[#FFD166] flex-shrink-0" />;
    return null;
  };

  const activePeer = activeConversation?.participants?.find(p => p._id !== currentUser?._id);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#000000] text-slate-800 dark:text-[#FFFFFF] font-sans relative">
      {/* Header */}
      <div className="flex-shrink-0 bg-slate-50 dark:bg-[#111111] border-b border-slate-200 dark:border-[#222222] p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-[#FFFFFF]">
            {isContactsView ? "Select contact" : "Flash Chat"}
          </h1>
          
          {/* Quick Action Icons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const input = document.getElementById("home-search-input");
                if (input) input.focus();
              }}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1c1c1c] rounded-full text-slate-400 dark:text-[#A0A0A0] hover:text-[#FF6B00] transition-colors"
              title="Search"
            >
              <Search size={18} />
            </button>

            <button
              onClick={() => {
                if (activePeer) {
                  startCall(activePeer, "video");
                } else {
                  toast.info("Please select a conversation to start a call");
                }
              }}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1c1c1c] rounded-full text-slate-400 dark:text-[#A0A0A0] hover:text-[#FF6B00] transition-colors"
              title="Video Call"
            >
              <Video size={18} />
            </button>

            <button
              onClick={() => {
                if (activePeer) {
                  startCall(activePeer, "voice");
                } else {
                  toast.info("Please select a conversation to start a call");
                }
              }}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1c1c1c] rounded-full text-slate-400 dark:text-[#A0A0A0] hover:text-[#FF6B00] transition-colors"
              title="Voice Call"
            >
              <Phone size={18} />
            </button>

            <button
              onClick={() => navigate("/status")}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1c1c1c] rounded-full text-slate-400 dark:text-[#A0A0A0] hover:text-[#FF6B00] transition-colors"
              title="Status"
            >
              <CircleDot size={18} />
            </button>

            <button
              onClick={() => setNotifPanelOpen(!notifPanelOpen)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1c1c1c] rounded-full text-slate-400 dark:text-[#A0A0A0] hover:text-[#FF9E00] transition-colors relative"
              title="Notifications"
            >
              <Bell size={18} />
              {notifUnread > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FF9E00] rounded-full animate-pulse border-2 border-white dark:border-[#111111]" />
              )}
            </button>

            <button
              onClick={() => navigate("/setting")}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1c1c1c] rounded-full text-slate-400 dark:text-[#A0A0A0] hover:text-[#FF6B00] transition-colors"
              title="Settings"
            >
              <SettingsIcon size={18} />
            </button>

            <div className="relative" ref={menuRef}>
              <button
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1c1c1c] rounded-full text-slate-400 dark:text-[#A0A0A0] hover:text-slate-800 dark:hover:text-[#FFFFFF] transition-colors"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <MoreVertical size={18} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1.5 bg-white dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#222222] rounded-xl shadow-2xl py-1 w-44 z-20 text-left">
                  <button
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-[#FFFFFF] hover:bg-slate-100 dark:hover:bg-[#222222] transition-colors w-full"
                    onClick={() => { setActiveView("contacts"); setMenuOpen(false); }}
                  >
                    <UsersIcon size={14} /> Contacts List
                  </button>
                  <button
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-[#FFFFFF] hover:bg-slate-100 dark:hover:bg-[#222222] transition-colors w-full"
                    onClick={() => { navigate("/setting"); setMenuOpen(false); }}
                  >
                    <SettingsIcon size={14} /> Settings
                  </button>
                  <button
                    className="flex items-center gap-2 px-3 py-2 text-xs text-[#FF3D71] hover:bg-slate-100 dark:hover:bg-[#222222] transition-colors w-full"
                    onClick={() => { setMenuOpen(false); logout && logout(); }}
                  >
                    <LogOut size={14} /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#555555]" />
          <input
            id="home-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isContactsView ? "Search contacts..." : "Search conversations..."}
            className="w-full pl-9 pr-8 py-2 bg-white dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#222222] focus:border-[#FF6B00] rounded-xl text-xs text-slate-800 dark:text-[#FFFFFF] placeholder-slate-400 dark:placeholder-[#555555] focus:outline-none transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-slate-800 dark:hover:text-[#FFFFFF]"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* List Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-[#222222]">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="py-20 text-center text-slate-400 dark:text-[#A0A0A0]">
            <p className="text-xs">
              {isContactsView ? "No contacts found" : "No conversations yet. Start a new chat!"}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredRows.map((row) => {
              const isSelected = activeConversation?._id === row._conv?._id || activeConversation?._id === row._id;
              return (
                <motion.div
                  key={row._id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() =>
                    isContactsView ? handleStartChat(row) : handleChatClick(row)
                  }
                  className={`flex items-center gap-3.5 px-4 py-3.5 cursor-pointer transition-all border-b border-slate-100 dark:border-[#222222] ${
                    isSelected
                      ? "bg-slate-100/70 dark:bg-[#1c1c1c] border-l-4 border-[#FF6B00]"
                      : "hover:bg-slate-50/50 dark:hover:bg-[#111111]/60"
                  }`}
                >
                  {/* Avatar & Status dot */}
                  <div className="relative flex-shrink-0">
                    {row.profilePic ? (
                      <img
                        src={row.profilePic}
                        alt=""
                        className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-[#222222]"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#222222] text-slate-700 dark:text-[#FFFFFF] flex items-center justify-center font-bold text-sm">
                        {row.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0">
                      <StatusDot isOnline={row.isOnline} size={10} />
                    </div>
                  </div>

                  {/* Detail */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-baseline gap-1">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-[#FFFFFF] truncate">
                        {row.name}
                      </h4>
                      {!isContactsView && row.lastMessageTime && (
                        <span className="text-[10px] text-slate-400 dark:text-[#A0A0A0]">
                          {formatPreviewTime(row.lastMessageTime)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        {!isContactsView && row.lastMessageMine && (
                          <StatusTick status={row.lastMessageStatus} />
                        )}
                        <p className="text-xs text-slate-400 dark:text-[#A0A0A0] truncate flex-1">
                          {isContactsView ? "Tap to start chatting" : row.lastMessage}
                        </p>
                      </div>
                      
                      {/* Offline status last seen display */}
                      {!row.isOnline && row.lastSeen && (
                        <span className="text-[9px] text-[#A0A0A0] flex-shrink-0 ml-1">
                          {formatLastSeen(row.lastSeen)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badge */}
                  {!isContactsView && row.unreadCount > 0 && (
                    <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-[#FF9E00] text-white text-[9px] font-bold flex items-center justify-center px-1 shadow-lg shadow-[#FF9E00]/20 animate-pulse">
                      {row.unreadCount > 99 ? "99+" : row.unreadCount}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setActiveView(isContactsView ? "chats" : "contacts")}
        className="absolute bottom-4 right-4 w-12 h-12 bg-[#FF6B00] hover:bg-[#E05E00] text-white rounded-full shadow-2xl transition-transform hover:scale-105 active:scale-95 flex items-center justify-center z-10"
        title={isContactsView ? "Back to chats" : "Start a new chat"}
      >
        <MessageSquarePlus size={20} />
      </button>

      {/* Side Slide-in Notification Panel */}
      <NotificationPanel
        isOpen={notifPanelOpen}
        onClose={() => setNotifPanelOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={markAllAsRead}
        onClearNotification={clearNotification}
      />
    </div>
  );
};

export default HomePage;