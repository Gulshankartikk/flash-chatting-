import React from "react";

const NotificationToast = ({ notif, onClose }) => {
  return (
    <div className="flex items-center gap-3 bg-[#1A1A26] border border-[#2A2A3D] p-3 rounded-xl shadow-2xl max-w-sm w-full animate-slide-in-right">
      {notif.avatar ? (
        <img src={notif.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-[#2A2A3D]" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-[#6C63FF] text-[#F0F0FF] flex items-center justify-center font-bold text-sm">
          {notif.title?.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 text-left min-w-0">
        <h4 className="text-xs font-bold text-[#F0F0FF] truncate">{notif.title}</h4>
        <p className="text-[11px] text-[#9090B0] truncate mt-0.5">{notif.preview || notif.content}</p>
      </div>
      <button onClick={onClose} className="text-xs text-[#9090B0] hover:text-[#FF6584] ml-2">
        ✕
      </button>
    </div>
  );
};

export default NotificationToast;
