import React from "react";
import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import StatusDot from "../status/StatusDot";

const ConversationItem = ({
  item,
  isActive,
  onClick,
  currentUser,
}) => {
  const name = item.name || "Flash Chat User";
  const avatar = item.profilePic;
  const isOnline = item.isOnline;

  const lastMsg = item.lastMessage || "";
  const unreadCount = item.unread || 0;

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3.5 cursor-pointer border-b border-[#2A2A3D] transition-all relative ${
        isActive
          ? "bg-[#1A1A26] border-l-4 border-[#6C63FF]"
          : "hover:bg-[#111118]/60 bg-transparent"
      }`}
    >
      {/* Avatar Container with live status */}
      <div className="relative flex-shrink-0">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-11 h-11 rounded-full object-cover border border-[#2A2A3D]"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-[#2A2A3D] text-[#F0F0FF] flex items-center justify-center font-bold text-sm">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="absolute bottom-0 right-0">
          <StatusDot isOnline={isOnline} size={10} />
        </div>
      </div>

      {/* Detail Block */}
      <div className="flex-1 text-left min-w-0">
        <div className="flex justify-between items-baseline gap-1">
          <h4 className="text-sm font-semibold text-[#F0F0FF] truncate">
            {name}
          </h4>
          {item.lastMessageTime && (
            <span className="text-[10px] text-[#9090B0]">
              {new Date(item.lastMessageTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {item.lastMessageMine && (
            <StatusTick status={item.lastMessageStatus} />
          )}
          <p className="text-xs text-[#9090B0] truncate flex-1">
            {lastMsg}
          </p>
        </div>
      </div>

      {/* Unread count badge */}
      {unreadCount > 0 && (
        <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-[#FF6584] text-white text-[9px] font-bold flex items-center justify-center px-1 shadow-lg shadow-[#FF6584]/20 animate-pulse">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
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

export default ConversationItem;
