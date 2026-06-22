import React, { useRef, useEffect, useState } from "react";
import LocalVideo from "./LocalVideo";
import VideoControls from "./VideoControls";
import useUserStore from "../../store/useUserStore";

const VideoCallModal = ({
  localStream,
  remoteStream,
  isMuted,
  isCamOff,
  isScreenSharing,
  remoteUser,
  callType,
  isInCall,
  isCalling,
  onToggleMic,
  onToggleCam,
  onToggleScreenShare,
  onEndCall,
}) => {
  const remoteVideoRef = useRef(null);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Call timer logic
  useEffect(() => {
    let interval = null;
    if (isInCall) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInCall]);

  const formatDuration = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs > 0 ? hrs.toString().padStart(2, "0") + ":" : ""}${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentUser = useUserStore((state) => state.user);

  const name = remoteUser?.username || remoteUser?.name || "Flash Chat User";
  const avatar = remoteUser?.profilePicture;

  if (callType === "voice") {
    // Compact voice call overlay
    return (
      <div className="fixed inset-x-4 top-4 md:inset-x-auto md:right-4 md:w-96 bg-[#111118] border border-[#2A2A3D] rounded-2xl shadow-2xl p-4 z-50 flex flex-col items-center gap-4 animate-slide-in">
        <div className="flex items-center gap-3 w-full">
          {avatar ? (
            <img src={avatar} alt="" className="w-12 h-12 rounded-full object-cover border border-[#2A2A3D]" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#6C63FF] text-[#F0F0FF] flex items-center justify-center font-bold text-lg">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 text-left min-w-0">
            <h4 className="text-sm font-semibold text-[#F0F0FF] truncate">{name}</h4>
            <p className="text-xs text-[#9090B0]">
              {isCalling ? (
                <span className="animate-pulse">Calling...</span>
              ) : isInCall ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#00E676] rounded-full animate-ping" />
                  Voice Call • {formatDuration(duration)}
                </span>
              ) : (
                "Connecting..."
              )}
            </p>
          </div>
        </div>

        {/* Waves Animation */}
        {isInCall && (
          <div className="flex items-end justify-center gap-1 h-8 w-full py-1">
            {[...Array(6)].map((_, i) => (
              <span
                key={i}
                className="w-1 bg-[#00D4FF] rounded-full animate-wave"
                style={{
                  height: "20%",
                  animationDelay: `${i * 100}ms`,
                  animationDuration: `${0.8 + i * 0.15}s`,
                }}
              />
            ))}
          </div>
        )}

        <VideoControls
          isMuted={isMuted}
          isCamOff={isCamOff}
          isScreenSharing={isScreenSharing}
          callType={callType}
          onToggleMic={onToggleMic}
          onToggleCam={onToggleCam}
          onToggleScreenShare={onToggleScreenShare}
          onEndCall={onEndCall}
        />

        <style>{`
          .animate-wave {
            animation-name: waveMotion;
            animation-iteration-count: infinite;
            animation-timing-function: ease-in-out;
          }
          @keyframes waveMotion {
            0%, 100% { height: 20%; }
            50% { height: 100%; }
          }
        `}</style>
      </div>
    );
  }

  // Full-screen Video Call overlay
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between items-center text-white">
      {/* Remote Video (full screen) */}
      <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0F]">
        {!isCalling && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-4">
            {avatar ? (
              <img
                src={avatar}
                alt=""
                className="w-24 h-24 rounded-full object-cover border-4 border-[#2A2A3D] animate-pulse"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#6C63FF] text-[#F0F0FF] flex items-center justify-center font-bold text-3xl animate-pulse">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <h3 className="text-xl font-bold">{name}</h3>
            <p className="text-xs text-[#9090B0]">
              {isCalling ? "Calling..." : "Connecting stream..."}
            </p>
          </div>
        )}
      </div>

      {/* Local Video PiP */}
      {(isInCall || isCalling) && (
        <LocalVideo
          stream={localStream}
          isCamOff={isCamOff}
          username={currentUser?.username || currentUser?.name}
        />
      )}

      {/* Call info / timer header */}
      <div className="z-10 w-full p-6 bg-gradient-to-b from-black/80 to-transparent flex flex-col items-center">
        <h2 className="text-lg font-bold text-[#F0F0FF]">{name}</h2>
        {isInCall && (
          <p className="text-xs text-[#00D4FF] font-mono tracking-wider">
            {formatDuration(duration)}
          </p>
        )}
      </div>

      {/* Control overlay */}
      <div className="z-10 w-full p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center">
        <VideoControls
          isMuted={isMuted}
          isCamOff={isCamOff}
          isScreenSharing={isScreenSharing}
          callType={callType}
          onToggleMic={onToggleMic}
          onToggleCam={onToggleCam}
          onToggleScreenShare={onToggleScreenShare}
          onEndCall={onEndCall}
        />
      </div>
    </div>
  );
};

export default VideoCallModal;
