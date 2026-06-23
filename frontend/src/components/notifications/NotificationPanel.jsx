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
    <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-white dark:bg-[#111111] border-l border-slate-200 dark:border-[#222222] shadow-2xl z-45 flex flex-col animate-slide-in-left">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-[#222222]">
        <div className="flex items-center gap-2 text-slate-800 dark:text-[#FFFFFF]">
          <Bell size={18} className="text-[#FF6B00]" />
          <h3 className="font-bold text-sm">Notifications</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 dark:hover:bg-[#1c1c1c] rounded-full text-slate-400 dark:text-[#A0A0A0] hover:text-slate-800 dark:hover:text-[#FFFFFF] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Actions */}
      {notifications.length > 0 && (
        <div className="flex justify-between items-center px-4 py-2 bg-slate-50 dark:bg-[#000000] border-b border-slate-200 dark:border-[#222222]">
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1 text-[11px] text-[#FF6B00] hover:text-[#E05E00] font-semibold"
          >
            <CheckCircle2 size={12} /> Mark all as read
          </button>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-[#222222]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 dark:text-[#A0A0A0]">
            <span className="text-4xl mb-2">🔔</span>
            <p className="text-xs">All caught up!</p>
            <p className="text-[10px] opacity-70 mt-0.5">No new notifications.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 flex gap-3 transition-colors ${
                notif.read ? "bg-slate-50 dark:bg-[#111111]" : "bg-white dark:bg-[#1c1c1c]"
              }`}
            >
              {notif.avatar ? (
                <img
                  src={notif.avatar}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-[#222222]"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#FF6B00] text-[#FFFFFF] flex items-center justify-center font-bold text-sm">
                  {notif.title?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 text-left min-w-0">
                <h4 className="text-xs font-bold text-slate-800 dark:text-[#FFFFFF] truncate">
                  {notif.title}
                </h4>
                <p className="text-[11px] text-slate-400 dark:text-[#A0A0A0] mt-0.5 break-words">
                  {notif.preview || notif.content}
                </p>
                <span className="text-[9px] text-[#555555] mt-1 block">
                  {new Date(notif.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <button
                onClick={() => onClearNotification(notif.id)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-[#222222] rounded text-slate-400 dark:text-[#A0A0A0] hover:text-[#FF9E00] transition-colors self-start"
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
