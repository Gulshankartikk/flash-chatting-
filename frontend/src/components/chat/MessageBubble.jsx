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
  FileText,
  Edit2,
  Pin,
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
  onEdit,
  onPin,
  currentUserId,
}) => {
  const [hovered, setHovered] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
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

  const handleEditSubmit = () => {
    if (!editText.trim()) return;
    if (onEdit) {
      onEdit(msg, editText.trim());
    }
    setIsEditing(false);
  };

  const getFileName = (url) => {
    if (!url) return "Document";
    const parts = url.split("/");
    const lastPart = parts[parts.length - 1];
    try {
      return decodeURIComponent(lastPart);
    } catch (e) {
      return lastPart;
    }
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

  const isOnlyEmojis = (str) => {
    if (!str) return false;
    const emojiRegex = /^(?:\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])+$/;
    const cleanStr = str.replace(/\s/g, "");
    return emojiRegex.test(cleanStr) && [...cleanStr].length <= 3;
  };

  const isImage = msg.contentType === "image" || msg.messageType === "image" || (msg.imageOrVideoUrl && !msg.contentType && !msg.imageOrVideoUrl.endsWith(".gif"));
  const isVideo = msg.contentType === "video" || msg.messageType === "video";
  const isAudio = msg.contentType === "audio" || msg.messageType === "audio";
  const isDocument = msg.contentType === "document" || msg.messageType === "document";
  const isGif = msg.contentType === "gif" || msg.messageType === "gif" || (msg.imageOrVideoUrl && msg.imageOrVideoUrl.endsWith(".gif"));

  const isPureEmoji = isOnlyEmojis(msg.content || msg.message) && !isImage && !isVideo && !isAudio && !isDocument && !isGif;

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
          id={`msg-${msg._id}`}
          className={`relative rounded-2xl px-4 py-2.5 transition-all duration-150 ${
            isPureEmoji
              ? "bg-transparent shadow-none"
              : isMine
              ? "bg-[#FF6B00] text-[#FFFFFF] rounded-tr-none shadow-md"
              : "bg-[#1c1c1c] text-[#FFFFFF] rounded-tl-none shadow-md"
          }`}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenuOpen(true);
          }}
        >
          {/* Pinned Indicator badge */}
          {msg.isPinned && (
            <div className="flex items-center gap-1 text-[10px] text-[#FFD166] mb-1 font-semibold">
              <Pin size={10} className="rotate-45" /> Pinned
            </div>
          )}

          {msg.isDeletedForEveryone || msg.isDeleted ? (
            <p className="text-xs italic text-[#555555] flex items-center gap-2">
              🚫 This message was deleted
            </p>
          ) : isEditing ? (
            <div className="flex flex-col gap-2 min-w-[200px]">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                className="w-full p-2 bg-black text-[#FFFFFF] border border-[#222222] focus:border-[#FF6B00] rounded-xl text-xs outline-none resize-none"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 text-[10px] bg-slate-700 rounded-lg text-white hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={!editText.trim()}
                  className="px-2.5 py-1 text-[10px] bg-[#FF6B00] rounded-lg text-white hover:bg-[#E05E00]"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              {msg.replyTo && (
                <div
                  onClick={() => onReplyPreviewClick && onReplyPreviewClick(msg.replyTo)}
                  className="border-l-2 border-[#FFD166] bg-black/25 rounded p-2 mb-2 text-left cursor-pointer"
                >
                  <p className="text-xs font-semibold text-[#FFD166]">
                    {msg.replyTo.sender === currentUserId ? "You" : "Contact"}
                  </p>
                  <p className="text-xs text-[#A0A0A0] truncate">
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

              {isGif && msg.imageOrVideoUrl && (
                <div className="rounded overflow-hidden mb-2 max-w-xs bg-black/40">
                  <img
                    src={msg.imageOrVideoUrl}
                    alt="GIF Attachment"
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

              {isDocument && msg.imageOrVideoUrl && (
                <div className="rounded p-3 mb-2 max-w-xs bg-black/40 border border-[#222222] flex items-center gap-3">
                  <div className="p-2.5 bg-[#FF6B00]/15 text-[#FF6B00] rounded-xl flex-shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {msg.content || getFileName(msg.imageOrVideoUrl)}
                    </p>
                    <a
                      href={msg.imageOrVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#00E676] hover:underline block mt-0.5"
                    >
                      Download File
                    </a>
                  </div>
                </div>
              )}

              {(msg.content || msg.message) && (!isPureEmoji) ? (
                <p className="text-[14.5px] leading-relaxed break-words text-left">
                  {msg.content || msg.message}
                </p>
              ) : isPureEmoji ? (
                <p className="text-4xl leading-relaxed break-words text-center py-1">
                  {msg.content || msg.message}
                </p>
              ) : null}

              {/* Status and timestamp */}
              <div className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] text-[#A0A0A0]/80 ${isPureEmoji ? "absolute bottom-1 right-2 bg-black/60 rounded px-1" : ""}`}>
                <span>{formatTime(msg.createdAt)}</span>
                {msg.isEdited && <span className="text-[9px] italic">(edited)</span>}
                {isMine && (
                  <StatusTick status={msg.messageStatus || msg.status} />
                )}
              </div>
            </>
          )}

          {/* Reactions Overlay */}
          {reactionList.length > 0 && !isEditing && (
            <div className="absolute -bottom-2.5 right-2 flex gap-1 bg-[#1c1c1c] border border-[#222222] rounded-full px-1.5 py-0.5 shadow-lg">
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
        {hovered && !(msg.isDeletedForEveryone || msg.isDeleted) && !isEditing && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPickerOpen(true)}
              className="p-1.5 hover:bg-[#1c1c1c] rounded-full text-[#A0A0A0] hover:text-[#FFFFFF] transition-colors"
              title="Add reaction"
            >
              <Smile size={14} />
            </button>
            <button
              onClick={() => onReply && onReply(msg)}
              className="p-1.5 hover:bg-[#1c1c1c] rounded-full text-[#A0A0A0] hover:text-[#FFFFFF] transition-colors"
              title="Reply"
            >
              <Reply size={14} />
            </button>
            <button
              onClick={() => setContextMenuOpen(true)}
              className="p-1.5 hover:bg-[#1c1c1c] rounded-full text-[#A0A0A0] hover:text-[#FFFFFF] transition-colors"
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
            className="absolute bottom-full mb-2 bg-[#1c1c1c] border border-[#222222] rounded-full py-1 px-3 flex gap-2.5 shadow-xl z-20"
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
            className="absolute bottom-full mb-2 bg-[#1c1c1c] border border-[#222222] rounded-lg py-1 flex flex-col shadow-2xl w-36 z-25 text-left"
            style={{ [isMine ? "right" : "left"]: 0 }}
          >
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 text-xs text-[#FFFFFF] hover:bg-[#222222] transition-colors w-full"
            >
              <Copy size={12} /> Copy Message
            </button>
            <button
              onClick={() => {
                if (onForward) onForward(msg);
                setContextMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 text-xs text-[#FFFFFF] hover:bg-[#222222] transition-colors w-full"
            >
              <Forward size={12} /> Forward
            </button>
            {isMine && !isDocument && !isImage && !isVideo && !isAudio && !isGif && (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditText(msg.content || msg.message || "");
                  setContextMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-[#FFFFFF] hover:bg-[#222222] transition-colors w-full"
              >
                <Edit2 size={12} /> Edit Message
              </button>
            )}
            <button
              onClick={() => {
                if (onPin) onPin(msg);
                setContextMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 text-xs text-[#FFFFFF] hover:bg-[#222222] transition-colors w-full"
            >
              <Pin size={12} className="rotate-45" /> {msg.isPinned ? "Unpin Message" : "Pin Message"}
            </button>
            <button
              onClick={() => {
                if (onDelete) onDelete(msg, "me");
                setContextMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 text-xs text-[#FF9E00] hover:bg-[#222222] transition-colors w-full"
            >
              <Trash2 size={12} /> Delete for Me
            </button>
            {isMine && (
              <button
                onClick={() => {
                  if (onDelete) onDelete(msg, "everyone");
                  setContextMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-[#FF3D71] hover:bg-[#222222] transition-colors w-full"
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
  if (status === "sending") return <Clock size={10} className="text-[#A0A0A0]" />;
  if (status === "failed") return <AlertCircle size={10} className="text-[#FF3D71]" />;
  if (status === "sent") return <Check size={11} className="text-[#A0A0A0]" />;
  if (status === "delivered") return <CheckCheck size={11} className="text-[#A0A0A0]" />;
  if (status === "seen" || status === "read") return <CheckCheck size={11} className="text-[#FFD166]" />;
  return null;
};

export default MessageBubble;
