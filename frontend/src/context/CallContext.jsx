import React, { createContext, useState, useEffect, useRef } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import useUserStore from "../store/useUserStore";
import { toast } from "react-toastify";
import VideoCallModal from "../components/video/VideoCallModal";
import IncomingCallModal from "../components/video/IncomingCallModal";

// Sound synthesizer using Web Audio API for ringtone
class RingtoneSynth {
  constructor() {
    this.audioCtx = null;
    this.oscillator = null;
    this.gainNode = null;
    this.intervalId = null;
  }

  start() {
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const playTone = () => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(440, this.audioCtx.currentTime); // Standard ring A4
        osc.frequency.setValueAtTime(480, this.audioCtx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 1.5);
      };

      playTone();
      this.intervalId = setInterval(playTone, 2000);
    } catch (e) {
      console.warn("AudioContext failed to start:", e);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}

export const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const currentUser = useUserStore((state) => state.user);
  const [incomingCallInfo, setIncomingCallInfo] = useState(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const ringtoneRef = useRef(new RingtoneSynth());
  const ringTimeoutRef = useRef(null);

  const onCallEnded = (reason) => {
    if (reason) toast.info(reason);
    setIncomingCallInfo(null);
    setShowCallModal(false);
    ringtoneRef.current.stop();
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
  };

  const onIncomingCall = (callData) => {
    setIncomingCallInfo(callData);
    ringtoneRef.current.start();

    // Auto-decline call after 30s of no answer
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    ringTimeoutRef.current = setTimeout(() => {
      rejectIncomingCall();
      toast.info("Missed call");
    }, 30000);
  };

  const webrtc = useWebRTC(currentUser, onCallEnded, onIncomingCall);

  const startCall = (targetUser, type = "video") => {
    webrtc.startCall(targetUser, type);
    setShowCallModal(true);
  };

  const acceptIncomingCall = () => {
    if (incomingCallInfo) {
      ringtoneRef.current.stop();
      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = null;
      }
      webrtc.acceptCall(incomingCallInfo.offer, incomingCallInfo.from);
      setIncomingCallInfo(null);
      setShowCallModal(true);
    }
  };

  const rejectIncomingCall = () => {
    if (incomingCallInfo) {
      ringtoneRef.current.stop();
      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = null;
      }
      webrtc.rejectCall(incomingCallInfo.from);
      setIncomingCallInfo(null);
    }
  };

  const endActiveCall = () => {
    webrtc.endCall();
  };

  useEffect(() => {
    const ringtone = ringtoneRef.current;
    const ringTimeout = ringTimeoutRef.current;
    return () => {
      ringtone.stop();
      if (ringTimeout) clearTimeout(ringTimeout);
    };
  }, []);

  return (
    <CallContext.Provider
      value={{
        ...webrtc,
        startCall,
        acceptIncomingCall,
        rejectIncomingCall,
        endCall: endActiveCall,
        incomingCallInfo,
        showCallModal,
        setShowCallModal,
      }}
    >
      {children}
      {incomingCallInfo && (
        <IncomingCallModal
          callerName={incomingCallInfo.callerName}
          callerAvatar={incomingCallInfo.callerAvatar}
          callType={incomingCallInfo.callType}
          onAccept={acceptIncomingCall}
          onDecline={rejectIncomingCall}
        />
      )}
      {showCallModal && (
        <VideoCallModal
          localStream={webrtc.localStream}
          remoteStream={webrtc.remoteStream}
          isMuted={webrtc.isMuted}
          isCamOff={webrtc.isCamOff}
          isScreenSharing={webrtc.isScreenSharing}
          remoteUser={webrtc.remoteUser}
          callType={webrtc.callType}
          isInCall={webrtc.isInCall}
          isCalling={webrtc.isCalling}
          onToggleMic={webrtc.toggleMic}
          onToggleCam={webrtc.toggleCam}
          onToggleScreenShare={webrtc.toggleScreenShare}
          onEndCall={endActiveCall}
        />
      )}
    </CallContext.Provider>
  );
};
