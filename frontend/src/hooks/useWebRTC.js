import { useState, useEffect, useRef } from "react";
import { getSocket } from "../services/chat.services";

export const useWebRTC = (currentUser, onCallEnded, onIncomingCall) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [remoteUser, setRemoteUser] = useState(null);
  const [callType, setCallType] = useState("video"); // "video" | "voice"
  const [roomId, setRoomId] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const socket = getSocket();

  const cleanupCall = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCamOff(false);
    setIsScreenSharing(false);
    setIsInCall(false);
    setIsCalling(false);
    setRemoteUser(null);
    setRoomId(null);
  };

  const initPeerConnection = (targetUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("ice_candidate", { to: targetUserId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        endCall();
      }
    };

    pcRef.current = pc;
    return pc;
  };

  const startCall = async (targetUser, type = "video") => {
    cleanupCall();
    setRemoteUser(targetUser);
    setCallType(type);
    setIsCalling(true);
    const newRoomId = `call_${Date.now()}`;
    setRoomId(newRoomId);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = initPeerConnection(targetUser._id);
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (socket) {
        socket.emit("call_user", {
          to: targetUser._id,
          from: currentUser._id,
          roomId: newRoomId,
          offer,
          callType: type,
          callerName: currentUser.username || currentUser.name,
          callerAvatar: currentUser.profilePicture,
        });
      }
    } catch (error) {
      console.error("Error starting WebRTC call:", error);
      cleanupCall();
    }
  };

  const acceptCall = async (incomingOffer, callerId) => {
    setIsCalling(false);
    setIsInCall(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = initPeerConnection(callerId);
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (socket) {
        socket.emit("accept_call", { to: callerId, answer });
      }
    } catch (error) {
      console.error("Error accepting WebRTC call:", error);
      rejectCall(callerId);
    }
  };

  const rejectCall = (callerId) => {
    if (socket) {
      socket.emit("reject_call", { to: callerId });
    }
    cleanupCall();
  };

  const endCall = () => {
    if (socket && remoteUser) {
      socket.emit("end_call", { to: remoteUser._id });
    }
    cleanupCall();
    if (onCallEnded) onCallEnded();
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCam = () => {
    if (localStreamRef.current && callType === "video") {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCamOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isInCall || callType !== "video") return;

    if (isScreenSharing) {
      // Stop screen sharing and switch back to camera
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const videoTrack = stream.getVideoTracks()[0];
        const sender = pcRef.current.getSenders().find((s) => s.track.kind === "video");
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
        // update local stream
        const currentTracks = localStreamRef.current.getVideoTracks();
        currentTracks.forEach((t) => t.stop());
        localStreamRef.current.removeTrack(currentTracks[0]);
        localStreamRef.current.addTrack(videoTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        setIsScreenSharing(false);
      } catch (err) {
        console.error("Failed to restore camera stream:", err);
      }
    } else {
      // Start screen sharing
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        const videoTrack = stream.getVideoTracks()[0];
        const sender = pcRef.current.getSenders().find((s) => s.track.kind === "video");
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
        videoTrack.onended = () => {
          toggleScreenShare(); // automatically revert when sharing stops from browser ui
        };
        const currentTracks = localStreamRef.current.getVideoTracks();
        currentTracks.forEach((t) => t.stop());
        localStreamRef.current.removeTrack(currentTracks[0]);
        localStreamRef.current.addTrack(videoTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Failed to start screen share:", err);
      }
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = ({ from, offer, roomId, callType, callerName, callerAvatar }) => {
      setRoomId(roomId);
      setCallType(callType);
      setRemoteUser({ _id: from, username: callerName, name: callerName, profilePicture: callerAvatar });
      setIsCalling(false);
      if (onIncomingCall) {
        onIncomingCall({ from, offer, roomId, callType, callerName, callerAvatar });
      }
    };

    const handleCallAccepted = ({ answer }) => {
      setIsCalling(false);
      setIsInCall(true);
      if (pcRef.current) {
        pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleCallRejected = () => {
      cleanupCall();
      if (onCallEnded) onCallEnded("Call declined");
    };

    const handleIceCandidate = ({ candidate }) => {
      if (pcRef.current && candidate) {
        pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const handleCallEnded = () => {
      cleanupCall();
      if (onCallEnded) onCallEnded("Call ended");
    };

    socket.on("incoming_call", handleIncomingCall);
    socket.on("call_accepted", handleCallAccepted);
    socket.on("call_rejected", handleCallRejected);
    socket.on("ice_candidate", handleIceCandidate);
    socket.on("call_ended", handleCallEnded);

    return () => {
      socket.off("incoming_call", handleIncomingCall);
      socket.off("call_accepted", handleCallAccepted);
      socket.off("call_rejected", handleCallRejected);
      socket.off("ice_candidate", handleIceCandidate);
      socket.off("call_ended", handleCallEnded);
    };
  }, [socket, onCallEnded, onIncomingCall, callType]);

  return {
    localStream,
    remoteStream,
    isMuted,
    isCamOff,
    isScreenSharing,
    isInCall,
    isCalling,
    remoteUser,
    callType,
    roomId,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCam,
    toggleScreenShare,
  };
};
