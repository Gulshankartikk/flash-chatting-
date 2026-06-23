import React, { useEffect } from "react";
import { X } from "lucide-react";

const ReplyPreview = ({ replyTo, onCancel = () => {}, otherUserName }) => {
  useEffect(() => {
    if (!replyTo) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [replyTo, onCancel]);

  if (!replyTo) return null;

  const replyingToLabel = replyTo.isMine
    ? "yourself"
    : otherUserName || "Contact";

  const previewText = replyTo.content || replyTo.message || "Media message";

  return (
    <div
      role="region"
      aria-label="Reply preview"
      className="flex items-center justify-between gap-3 px-5 py-2.5 bg-white dark:bg-[#111111] border-t border-slate-200 dark:border-[#222222] z-10 animate-in slide-in-from-bottom-2 fade-in duration-150"
    >
      <div className="flex-1 border-l-4 border-[#FF6B00] pl-3 min-w-0">
        <p className="text-xs font-semibold text-[#FF6B00] truncate">
          Replying to {replyingToLabel}
        </p>
        <p className="text-xs text-slate-400 dark:text-[#A0A0A0] truncate">
          {previewText}
        </p>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="shrink-0 p-1.5 rounded-full text-slate-400 dark:text-[#A0A0A0] hover:bg-slate-100 dark:hover:bg-[#1c1c1c] hover:text-[#FF9E00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]/40 transition-colors"
        aria-label="Cancel reply"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default ReplyPreview;