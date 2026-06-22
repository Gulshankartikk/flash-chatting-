import React from "react";
import { Bell, X, Trash2, CheckCircle2 } from "lucide-react";

const NotificationPanel = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearNotification,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-[#111118] border-l border-[#2A2A3D] shadow-2xl z-45 flex flex-col animate-slide-in-left">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2A2A3D]">
        <div className="flex items-center gap-2 text-[#F0F0FF]">
          <Bell size={18} className="text-[#6C63FF]" />
          <h3 className="font-bold text-sm">Notifications</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[#1A1A26] rounded-full text-[#9090B0] hover:text-[#F0F0FF] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Actions */}
      {notifications.length > 0 && (
        <div className="flex justify-between items-center px-4 py-2 bg-[#0A0A0F] border-b border-[#2A2A3D]">
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1 text-[11px] text-[#6C63FF] hover:text-[#5b52e6] font-semibold"
          >
            <CheckCircle2 size={12} /> Mark all as read
          </button>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#2A2A3D]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-[#9090B0]">
            <span className="text-4xl mb-2">🔔</span>
            <p className="text-xs">All caught up!</p>
            <p className="text-[10px] opacity-70 mt-0.5">No new notifications.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 flex gap-3 transition-colors ${
                notif.read ? "bg-[#111118]" : "bg-[#1A1A26]"
              }`}
            >
              {notif.avatar ? (
                <img
                  src={notif.avatar}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover border border-[#2A2A3D]"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#6C63FF] text-[#F0F0FF] flex items-center justify-center font-bold text-sm">
                  {notif.title?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 text-left min-w-0">
                <h4 className="text-xs font-bold text-[#F0F0FF] truncate">
                  {notif.title}
                </h4>
                <p className="text-[11px] text-[#9090B0] mt-0.5 break-words">
                  {notif.preview || notif.content}
                </p>
                <span className="text-[9px] text-[#4A4A6A] mt-1 block">
                  {new Date(notif.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <button
                onClick={() => onClearNotification(notif.id)}
                className="p-1 hover:bg-[#2A2A3D] rounded text-[#9090B0] hover:text-[#FF6584] transition-colors self-start"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
