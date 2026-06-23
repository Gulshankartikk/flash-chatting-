import React, { useState, useRef } from "react";
import ConversationItem from "./ConversationItem";
import { Search, X } from "lucide-react";

const ConversationList = ({ items, activeId, onSelect, currentUser }) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const filteredItems = items.filter((item) =>
    item.name?.toLowerCase().includes(query.toLowerCase())
  );

  const clearQuery = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape" && query) {
      e.preventDefault();
      clearQuery();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#000000] text-slate-800 dark:text-[#FFFFFF]">
      {/* Search Block */}
      <div className="p-3 border-b border-slate-200 dark:border-[#222222]">
        <label htmlFor="conversation-search" className="sr-only">
          Search conversations
        </label>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#555555]"
            aria-hidden="true"
          />
          <input
            id="conversation-search"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search conversations..."
            className="w-full bg-slate-100 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#222222] focus:border-[#FF6B00] rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 dark:text-[#FFFFFF] placeholder-slate-400 dark:placeholder-[#555555] focus:outline-none transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#A0A0A0] hover:text-slate-800 dark:hover:text-[#FFFFFF]"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {query && (
          <p className="sr-only" aria-live="polite">
            {filteredItems.length} conversation{filteredItems.length !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* List Body */}
      <div
        role="list"
        aria-label="Conversations"
        className="flex-1 overflow-y-auto"
      >
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-[#A0A0A0]">
            <p className="text-xs">No conversations found</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div role="listitem" key={item._id}>
              <ConversationItem
                item={item}
                isActive={item.conversationId === activeId || item._id === activeId}
                onClick={() => onSelect(item)}
                currentUser={currentUser}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;