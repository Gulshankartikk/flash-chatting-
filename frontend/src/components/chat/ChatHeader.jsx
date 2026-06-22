import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Phone, Video, Search, MoreVertical, ShieldAlert } from "lucide-react";
import StatusDot from "../status/StatusDot";

const ChatHeader = ({
  otherUser,
  isMobile,
  onBack,
  isTyping,
  onVoiceCall,
  onVideoCall,
  onSearchToggle,
  onBlockToggle,
  isBlocked,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const name = otherUser?.username || otherUser?.name || "Flash Chat User";
  const avatar = otherUser?.profilePicture || otherUser?.profilePic;
  const isOnline = otherUser?.isOnline;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#111118] border-b border-[#2A2A3D] z-10 flex-shrink-0">
      {isMobile && (
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-[#1A1A26] rounded-full text-[#9090B0] hover:text-[#F0F0FF] transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
      )}

      {/* Profile Pic & Status Ring */}
      <div className="relative">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-10 h-10 rounded-full object-cover border border-[#2A2A3D]"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#6C63FF] text-[#F0F0FF] flex items-center justify-center font-bold text-sm">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        {/* Status indicator dot */}
        <div className="absolute -bottom-0.5 -right-0.5">
          <StatusDot isOnline={isOnline} size={10} />
        </div>
      </div>

      {/* Name and online status status message */}
      <div className="flex-1 text-left min-w-0">
        <h3 className="text-sm font-semibold text-[#F0F0FF] truncate">{name}</h3>
        <p className="text-[11px] text-[#9090B0] truncate font-medium">
          {isTyping ? (
            <span className="text-[#00D4FF] font-semibold">typing...</span>
          ) : isOnline ? (
            "Online"
          ) : (
            "Offline"
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onVoiceCall}
          className="p-2 hover:bg-[#1A1A26] rounded-full text-[#9090B0] hover:text-[#00D4FF] transition-colors"
          title="Voice Call"
        >
          <Phone size={16} />
        </button>
        <button
          onClick={onVideoCall}
          className="p-2 hover:bg-[#1A1A26] rounded-full text-[#9090B0] hover:text-[#00D4FF] transition-colors"
          title="Video Call"
        >
          <Video size={16} />
        </button>
        <button
          onClick={onSearchToggle}
          className="p-2 hover:bg-[#1A1A26] rounded-full text-[#9090B0] hover:text-[#6C63FF] transition-colors"
          title="Search messages"
        >
          <Search size={16} />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 hover:bg-[#1A1A26] rounded-full text-[#9090B0] hover:text-[#F0F0FF] transition-colors"
            title="Options"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 bg-[#1A1A26] border border-[#2A2A3D] rounded-lg shadow-2xl py-1 w-36 z-20 text-left">
              <button
                onClick={() => {
                  if (onBlockToggle) onBlockToggle();
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-[#FF6584] hover:bg-[#2A2A3D] transition-colors w-full"
              >
                <ShieldAlert size={12} />
                {isBlocked ? "Unblock" : "Block User"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
