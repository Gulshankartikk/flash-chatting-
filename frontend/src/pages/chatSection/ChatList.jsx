import React, { useMemo, useState } from "react";
import useLayoutStore from "../../store/useLayoutStore";
import useThemeStore from "../../store/useThemeStore";

const ChatList = () => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const setSelectedContact = useLayoutStore((state) => state.setSelectedContact);

  const [search, setSearch] = useState("");

  // TODO: replace with real data from your store/API
  const contacts = [
    { _id: "1", name: "Rahul", lastMessage: "Hello", isOnline: true, unread: 2 },
    { _id: "2", name: "Aman", lastMessage: "How are you?", isOnline: false, unread: 0 },
    { _id: "3", name: "Priya", lastMessage: "Good Morning", isOnline: true, unread: 0 },
  ];

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => c.name.toLowerCase().includes(q));
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

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

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search or start new chat"
          className={`w-full px-3 py-2 rounded-lg text-sm outline-none ${
            isDark
              ? "bg-[#202c33] text-white placeholder-gray-400"
              : "bg-gray-100 text-black placeholder-gray-500"
          }`}
        />
      </div>

      {/* List */}
      {filteredContacts.length === 0 ? (
        <p className="text-center text-sm opacity-60 mt-8">No chats found</p>
      ) : (
        filteredContacts.map((contact) => {
          const isSelected = selectedContact?._id === contact._id;

          return (
            <div
              key={contact._id}
              onClick={() => setSelectedContact(contact)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelectedContact(contact)}
              className={`flex items-center gap-3 p-3 cursor-pointer border-b transition-colors ${
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
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-medium text-sm ${
                    isDark ? "bg-gray-700 text-gray-200" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                {contact.isOnline && (
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 ${
                      isDark ? "border-[#111b21]" : "border-white"
                    }`}
                  />
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
                  {contact.unread}
                </span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default ChatList;