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
    <div className="flex-1 relative overflow-hidden bg-[#0A0A0F]">
      {/* Scrollable Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 py-6 flex flex-col gap-1.5"
      >
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <div className="w-5 h-5 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {groupedMessages.map((group) => (
          <React.Fragment key={group.key}>
            {/* Day Divider */}
            <div className="flex justify-center my-3.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#9090B0] bg-[#1A1A26] border border-[#2A2A3D] rounded-full px-3 py-1 shadow-sm">
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
          className="absolute bottom-4 right-4 p-2.5 bg-[#6C63FF] hover:bg-[#5b52e6] text-[#F0F0FF] rounded-full shadow-2xl transition-all hover:scale-105 z-10"
          aria-label="Scroll to bottom"
        >
          <ArrowDown size={16} />
        </button>
      )}
    </div>
  );
};

export default MessageList;
