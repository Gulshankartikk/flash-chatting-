import React, { useState } from "react";
import ConversationItem from "./ConversationItem";
import { Search, X } from "lucide-react";

const ConversationList = ({
  items,
  activeId,
  onSelect,
  currentUser,
}) => {
  const [query, setQuery] = useState("");

  const filteredItems = items.filter((item) =>
    item.name?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#000000]">
      {/* Search Block */}
      <div className="p-3 border-b border-[#222222]">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555555]"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-[#1c1c1c] border border-[#222222] focus:border-[#FF6B00] rounded-xl pl-9 pr-8 py-2 text-xs text-[#FFFFFF] placeholder-[#555555] focus:outline-none transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-[#FFFFFF]"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* List Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#222222]">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-[#A0A0A0]">
            <p className="text-xs">No conversations found</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <ConversationItem
              key={item._id}
              item={item}
              isActive={item.conversationId === activeId || item._id === activeId}
              onClick={() => onSelect(item)}
              currentUser={currentUser}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
