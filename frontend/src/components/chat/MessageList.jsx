import React, { useRef, useEffect, useState } from "react";
import MessageBubble from "./MessageBubble";
import { ArrowDown } from "lucide-react";

const MessageList = ({
  messages,
  currentUserId,
  isLoadingMore,
  onLoadMore,
  hasMore,
  onReply,
  onReact,
  onDelete,
  onForward,
  onReplyPreviewClick,
  onRetry,
  onEdit,
  onPin,
}) => {
  const containerRef = useRef(null);
  const [showScrollFAB, setShowScrollFAB] = useState(false);
  const prevScrollHeightRef = useRef(0);

  const scrollToBottom = (behavior = "smooth") => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  // Scroll to bottom on first load or new message
  useEffect(() => {
    if (containerRef.current && !isLoadingMore) {
      // If we are close to bottom, or it's the first render, scroll to bottom
      const isNearBottom =
        containerRef.current.scrollHeight - containerRef.current.scrollTop - containerRef.current.clientHeight < 200;
      if (isNearBottom || messages.length <= 30) {
        scrollToBottom("instant");
      }
    }
  }, [messages, isLoadingMore]);

  // Adjust scroll position after loading older messages
  useEffect(() => {
    if (isLoadingMore && containerRef.current) {
      const delta = containerRef.current.scrollHeight - prevScrollHeightRef.current;
      containerRef.current.scrollTop = delta;
    }
  }, [messages.length, isLoadingMore]);

  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

    // Show FAB if scrolled up
    setShowScrollFAB(scrollHeight - scrollTop - clientHeight > 400);

    // Trigger infinite scroll on top scroll
    if (scrollTop === 0 && hasMore && !isLoadingMore && onLoadMore) {
      prevScrollHeightRef.current = scrollHeight;
      onLoadMore();
    }
  };

  // Group messages by day
  const formatDayLabel = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString([], {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const groupedMessages = messages.reduce((acc, msg) => {
    const dayKey = new Date(msg.createdAt).toDateString();
    if (!acc.length || acc[acc.length - 1].key !== dayKey) {
      acc.push({
        key: dayKey,
        label: formatDayLabel(msg.createdAt),
        items: [msg],
      });
    } else {
      acc[acc.length - 1].items.push(msg);
    }
    return acc;
  }, []);

  return (
    <div className="flex-1 relative overflow-hidden bg-white dark:bg-[#000000]">
      {/* Scrollable Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 py-6 flex flex-col gap-1.5"
      >
        {/* End-to-End Encryption Banner */}
        <div className="flex justify-center my-2">
          <div className="bg-[#FFD166]/10 border border-[#FFD166]/20 rounded-xl px-4 py-2.5 max-w-xs text-center shadow-sm">
            <p className="text-[11px] text-slate-500 dark:text-[#A0A0A0] leading-relaxed">
              🔒 Messages and calls are end-to-end encrypted. No one outside of this chat, not even Flash Chat, can read or listen to them.
            </p>
          </div>
        </div>

        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <div className="w-5 h-5 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {groupedMessages.map((group) => (
          <React.Fragment key={group.key}>
            {/* Day Divider */}
            <div className="flex justify-center my-3.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-[#A0A0A0] bg-slate-100 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#222222] rounded-full px-3 py-1 shadow-sm">
                {group.label}
              </span>
            </div>

            {/* Messages in Group */}
            {group.items.map((msg) => (
              <MessageBubble
                key={msg._id}
                msg={msg}
                currentUserId={currentUserId}
                onRetry={onRetry}
                onReply={onReply}
                onReact={onReact}
                onDelete={onDelete}
                onForward={onForward}
                onEdit={onEdit}
                onPin={onPin}
                onReplyPreviewClick={onReplyPreviewClick}
              />
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Jump to bottom FAB */}
      {showScrollFAB && (
        <button
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-4 right-4 p-2.5 bg-[#FF6B00] hover:bg-[#E05E00] text-[#FFFFFF] rounded-full shadow-2xl transition-all hover:scale-105 z-10"
          aria-label="Scroll to bottom"
        >
          <ArrowDown size={16} />
        </button>
      )}
    </div>
  );
};

export default MessageList;
