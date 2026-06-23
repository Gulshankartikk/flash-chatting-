import React, { useEffect, useMemo, useState } from "react";
import useLayoutStore from "../../store/useLayoutStore";
import useThemeStore from "../../store/useThemeStore";
import useChatStore from "../../store/chatStore";
import useUserStore from "../../store/useUserStore";
import { getAllUser } from "../../services/user.service";
import StatusDot from "../status/StatusDot";

const ChatRow = ({ contact, isSelected, isDark, onSelect }) => (
  <div
    onClick={() => onSelect(contact)}
    role="button"
    tabIndex={0}
    aria-current={isSelected ? "true" : undefined}
    aria-label={`${contact.name}${contact.unread > 0 ? `, ${contact.unread} unread` : ""}, ${contact.lastMessage}`}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(contact);
      }
    }}
    className={`flex items-center gap-3 p-3 cursor-pointer border-b transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]/40 focus-visible:ring-inset ${
      isDark ? "border-gray-700" : "border-gray-100"
    } ${
      isSelected
        ? isDark
          ? "bg-[#2a3942]"
          : "bg-green-50"
        : isDark
        ? "hover:bg-[#202c33]"
        : "hover:bg-gray-50"
    }`}
  >
    {/* Avatar */}
    <div className="relative flex-shrink-0">
      {contact.profilePic ? (
        <img
          src={contact.profilePic}
          alt=""
          className="w-11 h-11 rounded-full object-cover"
        />
      ) : (
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center font-medium text-sm ${
            isDark ? "bg-gray-700 text-gray-200" : "bg-gray-200 text-gray-700"
          }`}
        >
          {contact.name.charAt(0).toUpperCase()}
        </div>
      )}
      {contact.isOnline && (
        <div className="absolute bottom-0 right-0">
          <StatusDot isOnline size={10} ringColor={isDark ? "#111b21" : "#FFFFFF"} />
        </div>
      )}
    </div>

    {/* Text */}
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-baseline">
        <h3 className="font-medium truncate">{contact.name}</h3>
      </div>
      <p className="text-sm opacity-70 truncate">{contact.lastMessage}</p>
    </div>

    {/* Unread badge */}
    {contact.unread > 0 && (
      <span className="bg-green-500 text-white text-xs font-medium rounded-full px-2 py-0.5 flex-shrink-0">
        {contact.unread > 99 ? "99+" : contact.unread}
      </span>
    )}
  </div>
);

const ChatList = () => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const setSelectedContact = useLayoutStore((state) => state.setSelectedContact);

  const conversations = useChatStore((state) => state.conversations);
  const fetchConversations = useChatStore((state) => state.fetchConversations);
  const isLoadingConversations = useChatStore((state) => state.isLoadingConversations);
  const openConversation = useChatStore((state) => state.openConversation);

  const currentUser = useUserStore((state) => state.user);

  const [allUsers, setAllUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await getAllUser();
        const users = res?.data || res || [];
        if (isMounted) setAllUsers(users);
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        if (isMounted) setIsLoadingUsers(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const items = useMemo(() => {
    const fromConversations = conversations.map((conv) => {
      const other = conv.participants?.find(
        (p) => String(p._id) !== String(currentUser?._id)
      );
      return {
        _id: conv._id,
        conversationId: conv._id,
        otherUser: other || null,
        name: other?.username || other?.name || "Unknown",
        profilePic: other?.profilePicture || "",
        isOnline: other?.isOnline || false,
        lastMessage: conv.lastMessage?.content || "",
        unread: conv.unreadCount || 0,
        isDraft: false,
      };
    });

    const messagedUserIds = new Set(
      fromConversations.map((c) => String(c.otherUser?._id))
    );

    const fromUsersOnly = allUsers
      .filter((u) => String(u._id) !== String(currentUser?._id))
      .filter((u) => !messagedUserIds.has(String(u._id)))
      .map((u) => ({
        _id: u._id,
        conversationId: null,
        otherUser: u,
        name: u.username || u.name || "Unknown",
        profilePic: u.profilePicture || "",
        isOnline: u.isOnline || false,
        lastMessage: "Tap to start chatting",
        unread: 0,
        isDraft: true,
      }));

    return [...fromConversations, ...fromUsersOnly];
  }, [conversations, allUsers, currentUser]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => c.name.toLowerCase().includes(q));
  }, [search, items]);

  const handleSelect = (item) => {
    setSelectedContact(item);

    if (item.isDraft) {
      openConversation({
        _id: `draft_${item.otherUser._id}`,
        isDraft: true,
        participants: [item.otherUser],
        otherUser: item.otherUser,
        lastMessage: null,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    const realConv = conversations.find((c) => c._id === item.conversationId);
    if (realConv) {
      openConversation(realConv);
    } else {
      openConversation({
        _id: item.conversationId,
        isDraft: false,
        participants: item.otherUser ? [item.otherUser] : [],
        otherUser: item.otherUser,
        lastMessage: null,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const isLoading = isLoadingConversations || isLoadingUsers;

  return (
    <div
      className={`h-full flex flex-col overflow-y-auto ${
        isDark ? "bg-[#111b21] text-white" : "bg-white text-black"
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b sticky top-0 z-10 ${
          isDark ? "bg-[#111b21] border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <h2 className="text-xl font-bold mb-3">Chats</h2>

        <label htmlFor="chat-search" className="sr-only">
          Search or start new chat
        </label>
        <div className="relative">
          <input
            id="chat-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search or start new chat"
            className={`w-full px-3 py-2 pr-8 rounded-lg text-sm outline-none ${
              isDark
                ? "bg-[#202c33] text-white placeholder-gray-400"
                : "bg-gray-100 text-black placeholder-gray-500"
            }`}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${
                isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"
              }`}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        {search && (
          <p className="sr-only" aria-live="polite">
            {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* List */}
      <div role="list" aria-label="Chats" className="flex-1">
        {isLoading ? (
          <p className="text-center text-sm opacity-60 mt-8">Loading…</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-center text-sm opacity-60 mt-8">No chats found</p>
        ) : (
          filteredItems.map((contact) => (
            <div role="listitem" key={contact._id}>
              <ChatRow
                contact={contact}
                isSelected={selectedContact?._id === contact._id}
                isDark={isDark}
                onSelect={handleSelect}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;