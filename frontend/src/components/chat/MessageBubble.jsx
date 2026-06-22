import React, { useState, useRef, useEffect } from "react";
import {
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Smile,
  Reply,
  MoreHorizontal,
  Forward,
  Trash2,
  Copy,
} from "lucide-react";
import { toast } from "react-toastify";

const QUICK_REACTIONS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];

const MessageBubble = ({
  msg,
  onRetry,
  onReplyPreviewClick,
  onReply,
  onReact,
  onDelete,
  onForward,
  currentUserId,
}) => {
  const [hovered, setHovered] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const pickerRef = useRef(null);
  const menuRef = useRef(null);

  const isMine = msg.sender?._id === currentUserId || msg.sender === currentUserId || msg.isMine;
  const reactions = msg.reactions || [];

  useEffect(() => {
    if (!pickerOpen) return;
    const onDocClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [pickerOpen]);

  useEffect(() => {
    if (!contextMenuOpen) return;
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setContextMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [contextMenuOpen]);

  const formatTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handlePickReaction = (emoji) => {
    setPickerOpen(false);
    if (onReact) onReact(msg, emoji);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content || msg.message || "");
    toast.success("Copied to clipboard");
    setContextMenuOpen(false);
  };

  // Group reactions
  const groupedReactions = reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { emoji: r.emoji, count: 0, mine: false };
    acc[r.emoji].count += 1;
    if (r.user?._id === currentUserId || r.user === currentUserId || r.userId === currentUserId) {
      acc[r.emoji].mine = true;
    }
    return acc;
  }, {});
  const reactionList = Object.values(groupedReactions);

  const isImage = msg.contentType === "image" || msg.messageType === "image" || (msg.imageOrVideoUrl && !msg.contentType);
  const isVideo = msg.contentType === "video" || msg.messageType === "video";
  const isAudio = msg.contentType === "audio" || msg.messageType === "audio";

  return (
    <div
      className="flex w-full mb-2 px-4 relative justify-end"
      style={{ justifyContent: isMine ? "flex-end" : "flex-start" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPickerOpen(false);
        setContextMenuOpen(false);
      }}
    >
      <div
        className={`flex items-center gap-2 relative ${isMine ? "flex-row-reverse" : "flex-row"}`}
        style={{ maxWidth: "75%" }}
      >
        {/* Bubble container */}
        <div
          className={`relative rounded-2xl px-4 py-2.5 shadow-md transition-all duration-150 ${
            isMine
              ? "bg-[#6C63FF] text-[#F0F0FF] rounded-tr-none"
              : "bg-[#1A1A26] text-[#F0F0FF] rounded-tl-none"
          }`}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenuOpen(true);
          }}
        >
          {msg.isDeletedForEveryone || msg.isDeleted ? (
            <p className="text-xs italic text-[#4A4A6A] flex items-center gap-2">
              🚫 This message was deleted
            </p>
          ) : (
            <>
              {msg.replyTo && (
                <div
                  onClick={() => onReplyPreviewClick && onReplyPreviewClick(msg.replyTo)}
                  className="border-l-2 border-[#00D4FF] bg-black/25 rounded p-2 mb-2 text-left cursor-pointer"
                >
                  <p className="text-xs font-semibold text-[#00D4FF]">
                    {msg.replyTo.sender === currentUserId ? "You" : "Contact"}
                  </p>
                  <p className="text-xs text-[#9090B0] truncate">
                    {msg.replyTo.content || msg.replyTo.message || "Media"}
                  </p>
                </div>
              )}

              {isImage && msg.imageOrVideoUrl && (
                <div className="rounded overflow-hidden mb-2 max-w-xs bg-black/40">
                  <img
                    src={msg.imageOrVideoUrl}
                    alt="Attachment"
                    className="max-h-60 object-cover w-full cursor-zoom-in"
                    onClick={() => window.open(msg.imageOrVideoUrl, "_blank")}
                  />
                </div>
              )}

              {isVideo && msg.imageOrVideoUrl && (
                <div className="rounded overflow-hidden mb-2 max-w-xs bg-black/40">
                  <video src={msg.imageOrVideoUrl} controls className="max-h-60 w-full" />
                </div>
              )}

              {isAudio && msg.imageOrVideoUrl && (
                <div className="rounded p-2 mb-2 max-w-xs bg-black/30 flex items-center gap-2">
                  <span className="text-lg">🎵</span>
                  <audio src={msg.imageOrVideoUrl} controls className="w-full h-8" />
                </div>
              )}

              {msg.content || msg.message ? (
                <p className="text-[14.5px] leading-relaxed break-words text-left">
                  {msg.content || msg.message}
                </p>
              ) : null}

              {/* Status and timestamp */}
              <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-[#9090B0]/80">
                <span>{formatTime(msg.createdAt)}</span>
                {isMine && (
                  <StatusTick status={msg.messageStatus || msg.status} />
                )}
              </div>
            </>
          )}

          {/* Reactions Overlay */}
          {reactionList.length > 0 && (
            <div className="absolute -bottom-2.5 right-2 flex gap-1 bg-[#1A1A26] border border-[#2A2A3D] rounded-full px-1.5 py-0.5 shadow-lg">
              {reactionList.map((r) => (
                <button
                  key={r.emoji}
                  onClick={() => handlePickReaction(r.emoji)}
                  className={`text-xs hover:scale-125 transition-transform ${r.mine ? "opacity-100" : "opacity-80"}`}
                >
                  {r.emoji} <span className="text-[9px] font-bold">{r.count > 1 ? r.count : ""}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hover Controls */}
        {hovered && !(msg.isDeletedForEveryone || msg.isDeleted) && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPickerOpen(true)}
              className="p-1.5 hover:bg-[#1A1A26] rounded-full text-[#9090B0] hover:text-[#F0F0FF] transition-colors"
              title="Add reaction"
            >
              <Smile size={14} />
            </button>
            <button
              onClick={() => onReply && onReply(msg)}
              className="p-1.5 hover:bg-[#1A1A26] rounded-full text-[#9090B0] hover:text-[#F0F0FF] transition-colors"
              title="Reply"
            >
              <Reply size={14} />
            </button>
            <button
              onClick={() => setContextMenuOpen(true)}
              className="p-1.5 hover:bg-[#1A1A26] rounded-full text-[#9090B0] hover:text-[#F0F0FF] transition-colors"
              title="More"
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
        )}

        {/* EMOJI PICKER TOOLTIP */}
        {pickerOpen && (
          <div
            ref={pickerRef}
            className="absolute bottom-full mb-2 bg-[#1A1A26] border border-[#2A2A3D] rounded-full py-1 px-3 flex gap-2.5 shadow-xl z-20"
            style={{ [isMine ? "right" : "left"]: 0 }}
          >
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handlePickReaction(emoji)}
                className="text-lg hover:scale-135 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* CONTEXT MENU */}
        {contextMenuOpen && (
          <div
            ref={menuRef}
            className="absolute bottom-full mb-2 bg-[#1A1A26] border border-[#2A2A3D] rounded-lg py-1 flex flex-col shadow-2xl w-36 z-25 text-left"
            style={{ [isMine ? "right" : "left"]: 0 }}
          >
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 text-xs text-[#F0F0FF] hover:bg-[#2A2A3D] transition-colors w-full"
            >
              <Copy size={12} /> Copy Message
            </button>
            <button
              onClick={() => {
                if (onForward) onForward(msg);
                setContextMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 text-xs text-[#F0F0FF] hover:bg-[#2A2A3D] transition-colors w-full"
            >
              <Forward size={12} /> Forward
            </button>
            <button
              onClick={() => {
                if (onDelete) onDelete(msg, "me");
                setContextMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 text-xs text-[#FF6584] hover:bg-[#2A2A3D] transition-colors w-full"
            >
              <Trash2 size={12} /> Delete for Me
            </button>
            {isMine && (
              <button
                onClick={() => {
                  if (onDelete) onDelete(msg, "everyone");
                  setContextMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-[#FF3D71] hover:bg-[#2A2A3D] transition-colors w-full"
              >
                <Trash2 size={12} /> Delete for All
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const StatusTick = ({ status }) => {
  if (status === "sending") return <Clock size={10} className="text-[#9090B0]" />;
  if (status === "failed") return <AlertCircle size={10} className="text-[#FF3D71]" />;
  if (status === "sent") return <Check size={11} className="text-[#9090B0]" />;
  if (status === "delivered") return <CheckCheck size={11} className="text-[#9090B0]" />;
  if (status === "seen" || status === "read") return <CheckCheck size={11} className="text-[#00D4FF]" />;
  return null;
};

export default MessageBubble;
