import React, { useState, useRef } from "react";
import { Paperclip, Smile, Send, X, File, Video } from "lucide-react";
import ReplyPreview from "./ReplyPreview";

const ChatInput = ({
  onSend,
  replyTo,
  onCancelReply,
  otherUserId,
  otherUserName,
  onTypingStart,
  onTypingStop,
}) => {
  const [draft, setDraft] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState("text"); // "text" | "image" | "video" | "audio" | "document"

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleTextChange = (e) => {
    setDraft(e.target.value);

    if (onTypingStart) onTypingStart();

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (onTypingStop) onTypingStop();
    }, 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const mime = file.type;

    if (mime.startsWith("image/")) {
      setFileType("image");
      setFilePreview(URL.createObjectURL(file));
    } else if (mime.startsWith("video/")) {
      setFileType("video");
      setFilePreview(URL.createObjectURL(file));
    } else if (mime.startsWith("audio/")) {
      setFileType("audio");
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFileType("document");
      setFilePreview(null);
    }
  };

  const handleCancelFile = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setSelectedFile(null);
    setFilePreview(null);
    setFileType("text");
  };

  const handleSendClick = () => {
    const trimmed = draft.trim();
    if (!trimmed && !selectedFile) return;

    if (selectedFile) {
      onSend({
        message: trimmed,
        messageType: fileType,
        mediaFile: selectedFile,
      });
      handleCancelFile();
    } else {
      onSend({
        message: trimmed,
        messageType: "text",
      });
    }

    setDraft("");
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (onTypingStop) onTypingStop();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  return (
    <div className="flex flex-col bg-[#111118] border-t border-[#2A2A3D] z-10 flex-shrink-0">
      {/* Reply Preview */}
      {replyTo && (
        <ReplyPreview
          replyTo={replyTo}
          onCancel={onCancelReply}
          otherUserName={otherUserName}
        />
      )}

      {/* File Preview Bar */}
      {selectedFile && (
        <div className="flex items-center justify-between p-3 bg-[#1A1A26] border-t border-[#2A2A3D]">
          <div className="flex items-center gap-3">
            {fileType === "image" && (
              <img src={filePreview} alt="preview" className="w-12 h-12 object-cover rounded-lg border border-[#2A2A3D]" />
            )}
            {fileType === "video" && (
              <div className="w-12 h-12 flex items-center justify-center bg-black rounded-lg border border-[#2A2A3D]">
                <Video size={18} className="text-[#00D4FF]" />
              </div>
            )}
            {fileType === "audio" && (
              <div className="w-12 h-12 flex items-center justify-center bg-[#2A2A3D] rounded-lg">
                <span className="text-xl">🎵</span>
              </div>
            )}
            {fileType === "document" && (
              <div className="w-12 h-12 flex items-center justify-center bg-[#2A2A3D] rounded-lg">
                <File size={20} className="text-[#6C63FF]" />
              </div>
            )}
            <div className="text-left">
              <p className="text-xs font-semibold text-[#F0F0FF] truncate max-w-[200px]">
                {selectedFile.name}
              </p>
              <p className="text-[10px] text-[#9090B0]">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={handleCancelFile}
            className="p-1 hover:bg-[#2A2A3D] rounded-full text-[#9090B0] hover:text-[#FF3D71]"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Input Row */}
      <div className="flex items-center gap-3 p-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-[#1A1A26] rounded-full text-[#9090B0] hover:text-[#6C63FF] transition-colors"
          title="Attach File"
        >
          <Paperclip size={20} />
        </button>

        <button
          className="p-2 hover:bg-[#1A1A26] rounded-full text-[#9090B0] hover:text-[#FF6584] transition-colors"
          title="Emojis"
        >
          <Smile size={20} />
        </button>

        <input
          type="text"
          value={draft}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={selectedFile ? "Add a caption..." : "Type a message..."}
          className="flex-1 px-4 py-2.5 rounded-full bg-[#1A1A26] text-[#F0F0FF] placeholder-[#4A4A6A] border border-[#2A2A3D] focus:outline-none focus:border-[#6C63FF] text-sm transition-colors"
        />

        <button
          onClick={handleSendClick}
          disabled={!draft.trim() && !selectedFile}
          className="p-2.5 bg-[#6C63FF] hover:bg-[#5b52e6] disabled:bg-[#1A1A26] text-white disabled:text-[#4A4A6A] rounded-full transition-colors flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
