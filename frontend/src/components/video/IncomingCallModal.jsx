import React from "react";
import { Phone, PhoneOff } from "lucide-react";

const IncomingCallModal = ({
  callerName,
  callerAvatar,
  callType,
  onAccept,
  onDecline,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-[#111111] border border-[#222222] rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-6 animate-zoom-in">
        <h3 className="text-[#FFFFFF] text-sm font-semibold tracking-wider uppercase">
          Incoming {callType === "video" ? "Video" : "Voice"} Call
        </h3>

        {/* Pulsing Avatar */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#FF6B00]/20 animate-ping" />
          {callerAvatar ? (
            <img
              src={callerAvatar}
              alt=""
              className="w-20 h-20 rounded-full object-cover border-4 border-[#222222]"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#FF6B00] text-white flex items-center justify-center font-bold text-3xl border-4 border-[#222222]">
              {callerName?.charAt(0).toUpperCase() || "C"}
            </div>
          )}
        </div>

        <div className="text-center">
          <h4 className="text-[#FFFFFF] text-lg font-bold">{callerName}</h4>
          <p className="text-xs text-[#A0A0A0] mt-1">is calling you...</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-6 w-full mt-2">
          {/* Decline */}
          <button
            onClick={onDecline}
            className="flex-1 py-3 bg-[#FF3D71] hover:bg-[#ff255d] text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <PhoneOff size={16} /> Decline
          </button>

          {/* Accept */}
          <button
            onClick={onAccept}
            className="flex-1 py-3 bg-[#00E676] hover:bg-[#00d26c] text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Phone size={16} /> Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
