import React from "react";
import { Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff } from "lucide-react";

const VideoControls = ({
  isMuted,
  isCamOff,
  isScreenSharing,
  callType,
  onToggleMic,
  onToggleCam,
  onToggleScreenShare,
  onEndCall,
}) => {
  return (
    <div className="flex items-center justify-center gap-4 bg-[#111111]/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-[#222222]">
      {/* Mute Mic */}
      <button
        onClick={onToggleMic}
        className={`p-3.5 rounded-full transition-all duration-200 ${
          isMuted
            ? "bg-[#FF9E00] text-white hover:bg-[#E08B00]"
            : "bg-[#222222] text-[#FFFFFF] hover:bg-[#3D3D56]"
        }`}
        title={isMuted ? "Unmute Mic" : "Mute Mic"}
      >
        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
      </button>

      {/* Cam On/Off */}
      {callType === "video" && (
        <button
          onClick={onToggleCam}
          className={`p-3.5 rounded-full transition-all duration-200 ${
            isCamOff
              ? "bg-[#FF3D71] text-white hover:bg-[#ff2a61]"
              : "bg-[#222222] text-[#FFFFFF] hover:bg-[#3D3D56]"
          }`}
          title={isCamOff ? "Turn Camera On" : "Turn Camera Off"}
        >
          {isCamOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>
      )}

      {/* Screen Share */}
      {callType === "video" && (
        <button
          onClick={onToggleScreenShare}
          className={`p-3.5 rounded-full transition-all duration-200 ${
            isScreenSharing
              ? "bg-[#FFD166] text-black hover:bg-[#E6BC5C]"
              : "bg-[#222222] text-[#FFFFFF] hover:bg-[#3D3D56]"
          }`}
          title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
        >
          <ScreenShare size={20} />
        </button>
      )}

      {/* End Call */}
      <button
        onClick={onEndCall}
        className="p-3.5 bg-[#FF3D71] hover:bg-[#ff2259] text-white rounded-full transition-all duration-200 hover:scale-105"
        title="End Call"
      >
        <PhoneOff size={20} />
      </button>
    </div>
  );
};

export default VideoControls;
