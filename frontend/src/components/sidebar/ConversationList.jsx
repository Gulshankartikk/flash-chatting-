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
    <div className="flex flex-col h-full bg-[#0A0A0F]">
      {/* Search Block */}
      <div className="p-3 border-b border-[#2A2A3D]">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4A6A]"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-[#1A1A26] border border-[#2A2A3D] focus:border-[#6C63FF] rounded-xl pl-9 pr-8 py-2 text-xs text-[#F0F0FF] placeholder-[#4A4A6A] focus:outline-none transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9090B0] hover:text-[#F0F0FF]"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* List Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#2A2A3D]">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-[#9090B0]">
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
