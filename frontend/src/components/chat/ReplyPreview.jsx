import React from "react";
import { X } from "lucide-react";

const ReplyPreview = ({ replyTo, onCancel, otherUserName }) => {
  if (!replyTo) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-[#111118] border-t border-[#2A2A3D] z-10">
      <div className="flex-1 border-l-3 border-[#6C63FF] pl-3 min-w-0">
        <p className="text-xs font-semibold text-[#6C63FF]">
          Replying to {replyTo.isMine ? "yourself" : otherUserName || "Contact"}
        </p>
        <p className="text-xs text-[#9090B0] truncate">
          {replyTo.content || replyTo.message || "Media message"}
        </p>
      </div>
      <button
        onClick={onCancel}
        className="p-1 hover:bg-[#1A1A26] rounded-full text-[#9090B0] hover:text-[#FF6584] transition-colors"
        aria-label="Cancel reply"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default ReplyPreview;
