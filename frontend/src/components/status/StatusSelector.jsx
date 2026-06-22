import React, { useState } from "react";
import useSocket from "../../hooks/useSocket";
import useUserStore from "../../store/useUserStore";
import axios from "axios";
import { toast } from "react-toastify";

const StatusSelector = () => {
  const { socket } = useSocket();
  const user = useUserStore((state) => state.user);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const [isOpen, setIsOpen] = useState(false);
  const [customText, setCustomText] = useState(user?.about || "");

  const handleStatusChange = async (status) => {
    if (socket && user?._id) {
      socket.emit("set_status", { userId: user._id, status });
    }

    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/users/${user._id}/status`,
        { status },
        { withCredentials: true }
      );
      toast.success(`Status set to ${status}`);
    } catch (e) {
      console.error("Failed to update status in DB:", e);
    }
    setIsOpen(false);
  };

  const handleCustomTextSubmit = async (e) => {
    e.preventDefault();
    if (!customText.trim()) return;

    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/users/${user._id}/status`,
        { customStatusText: customText.trim() },
        { withCredentials: true }
      );
      updateProfile({ about: customText.trim() });
      toast.success("Status message updated");
    } catch (e) {
      console.error("Failed to update custom status text:", e);
    }
  };

  return (
    <div className="relative text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1A26] border border-[#2A2A3D] hover:border-[#6C63FF] rounded-lg text-xs font-semibold text-[#F0F0FF] transition-all"
      >
        Set Status 🟢
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#1A1A26] border border-[#2A2A3D] rounded-xl shadow-2xl p-3 z-30 space-y-3">
          <p className="text-[10px] uppercase font-bold text-[#9090B0] tracking-wider">
            Presence
          </p>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => handleStatusChange("online")}
              className="flex items-center gap-2 px-2 py-1 hover:bg-[#2A2A3D] rounded text-xs text-[#F0F0FF] text-left"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#00D4FF]" /> Online
            </button>
            <button
              onClick={() => handleStatusChange("away")}
              className="flex items-center gap-2 px-2 py-1 hover:bg-[#2A2A3D] rounded text-xs text-[#F0F0FF] text-left"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFB300]" /> Away
            </button>
            <button
              onClick={() => handleStatusChange("busy")}
              className="flex items-center gap-2 px-2 py-1 hover:bg-[#2A2A3D] rounded text-xs text-[#F0F0FF] text-left"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF3D71]" /> Busy (DND)
            </button>
            <button
              onClick={() => handleStatusChange("offline")}
              className="flex items-center gap-2 px-2 py-1 hover:bg-[#2A2A3D] rounded text-xs text-[#F0F0FF] text-left"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#4A4A6A]" /> Invisible
            </button>
          </div>

          <div className="border-t border-[#2A2A3D] pt-2">
            <p className="text-[10px] uppercase font-bold text-[#9090B0] tracking-wider mb-2">
              Status Message
            </p>
            <form onSubmit={handleCustomTextSubmit} className="flex gap-1.5">
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="What's happening?"
                className="flex-1 bg-black text-[#F0F0FF] px-2 py-1 text-xs rounded border border-[#2A2A3D] focus:outline-none focus:border-[#6C63FF]"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-[#6C63FF] text-white rounded text-[10px] font-bold"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusSelector;
