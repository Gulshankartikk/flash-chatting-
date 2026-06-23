import { useState, useEffect, useRef, useCallback } from "react";
import { getSocket } from "../services/chat.services";
import { toast } from "react-toastify";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export const useWebRTC = (currentUser, onCallEnded, onIncomingCall) => {
  const [localStream, setLocalStream]       = useState(null);
  const [remoteStream, setRemoteStream]     = useState(null);
  const [isMuted, setIsMuted]               = useState(false);
  const [isCamOff, setIsCamOff]             = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isInCall, setIsInCall]             = useState(false);
  const [isCalling, setIsCalling]           = useState(false);
  const [remoteUser, setRemoteUser]         = useState(null);
  const [callType, setCallType]             = useState("video");
  const [roomId, setRoomId]                 = useState(null);
  const [permissionError, setPermissionError] = useState(null);

  const pcRef          = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const socket = getSocket();

  // ── Cleanup ─────────────────────────────────────────────────────────────
  const cleanupCall = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;

    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCamOff(false);
    setIsScreenSharing(false);
    setIsInCall(false);
    setIsCalling(false);
    setRemoteUser(null);
    setRoomId(null);
    setPermissionError(null);
  }, []);

  // ── Get user media with friendly error messages ──────────────────────────
  const getUserMedia = useCallback(async (constraints) => {
    // mediaDevices is only available on HTTPS or localhost
    if (!navigator.mediaDevices?.getUserMedia) {
      const msg = "Camera/microphone requires HTTPS. Please use https:// or localhost.";
      setPermissionError(msg);
      toast.error(msg);
      throw new Error(msg);
    }

    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      let msg;
      switch (err.name) {
        case "NotAllowedError":
        case "PermissionDeniedError":
          msg = "Camera/microphone access denied. Click the 🔒 icon in the address bar and allow access, then try again.";
          break;
        case "NotFoundError":
        case "DevicesNotFoundError":
          msg = "No camera or microphone found. Please connect a device and try again.";
          break;
        case "NotReadableError":
        case "TrackStartError":
          msg = "Camera/microphone is already in use by another app. Close it and try again.";
          break;
        case "OverconstrainedError":
          msg = "Camera does not support the requested settings.";
          break;
        default:
          msg = `Media error: ${err.message}`;
      }
      setPermissionError(msg);
      toast.error(msg, { autoClose: 6000 });
      throw err;
    }
  }, []);

  // ── Peer connection ──────────────────────────────────────────────────────
  const initPeerConnection = useCallback(
    (targetUserId) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("ice_candidate", {
            to: targetUserId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        if (event.streams?.[0]) setRemoteStream(event.streams[0]);
      };

      pc.oniceconnectionstatechange = () => {
        if (["disconnected", "failed", "closed"].includes(pc.iceConnectionState)) {
          endCall();
        }
      };

      pcRef.current = pc;
      return pc;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [socket]
  );

  // ── Start outgoing call ──────────────────────────────────────────────────
  const startCall = useCallback(
    async (targetUser, type = "video") => {
      cleanupCall();
      setRemoteUser(targetUser);
      setCallType(type);
      setIsCalling(true);

      const newRoomId = `call_${Date.now()}`;
      setRoomId(newRoomId);

      try {
        const stream = await getUserMedia({
          video: type === "video",
          audio: true,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);

        const pc = initPeerConnection(targetUser._id);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket?.emit("call_user", {
          to:          targetUser._id,
          from:        currentUser._id,
          roomId:      newRoomId,
          offer,
          callType:    type,
          callerName:  currentUser.username || currentUser.name,
          callerAvatar: currentUser.profilePicture,
        });
      } catch (err) {
        // getUserMedia already showed a toast; just clean up
        cleanupCall();
      }
    },
    [cleanupCall, getUserMedia, initPeerConnection, socket, currentUser]
  );

  // ── Accept incoming call ─────────────────────────────────────────────────
  const acceptCall = useCallback(
    async (incomingOffer, callerId) => {
      setIsCalling(false);
      setIsInCall(true);

      try {
        const stream = await getUserMedia({
          video: callType === "video",
          audio: true,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);

        const pc = initPeerConnection(callerId);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket?.emit("accept_call", { to: callerId, answer });
      } catch (err) {
        rejectCall(callerId);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [callType, getUserMedia, initPeerConnection, socket]
  );

  // ── Reject / End call ────────────────────────────────────────────────────
  const rejectCall = useCallback(
    (callerId) => {
      socket?.emit("reject_call", { to: callerId });
      cleanupCall();
    },
    [socket, cleanupCall]
  );

  const endCall = useCallback(() => {
    if (socket && remoteUser) {
      socket.emit("end_call", { to: remoteUser._id });
    }
    cleanupCall();
    onCallEnded?.();
  }, [socket, remoteUser, cleanupCall, onCallEnded]);

  // ── Toggle mic / cam ─────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    }
  }, []);

  const toggleCam = useCallback(() => {
    if (callType !== "video") return;
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsCamOff(!track.enabled);
    }
  }, [callType]);

  // ── Screen share ─────────────────────────────────────────────────────────
  const toggleScreenShare = useCallback(async () => {
    if (!isInCall || callType !== "video") return;

    if (isScreenSharing) {
      // Restore camera
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;

      try {
        const stream = await getUserMedia({ video: true, audio: false });
        const videoTrack = stream.getVideoTracks()[0];
        const sender = pcRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender && videoTrack) await sender.replaceTrack(videoTrack);

        localStreamRef.current?.getVideoTracks().forEach((t) => {
          t.stop();
          localStreamRef.current.removeTrack(t);
        });
        localStreamRef.current?.addTrack(videoTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        setIsScreenSharing(false);
      } catch (err) {
        console.error("Failed to restore camera:", err);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        const videoTrack = stream.getVideoTracks()[0];

        const sender = pcRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender && videoTrack) await sender.replaceTrack(videoTrack);

        // Auto-revert when user stops sharing from browser UI
        videoTrack.onended = () => toggleScreenShare();

        localStreamRef.current?.getVideoTracks().forEach((t) => {
          t.stop();
          localStreamRef.current.removeTrack(t);
        });
        localStreamRef.current?.addTrack(videoTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Failed to start screen share:", err);
        toast.error("Screen sharing failed or was cancelled.");
      }
    }
  }, [isInCall, callType, isScreenSharing, getUserMedia]);

  // ── Socket event listeners ───────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = ({ from, offer, roomId, callType, callerName, callerAvatar }) => {
      setRoomId(roomId);
      setCallType(callType);
      setRemoteUser({ _id: from, username: callerName, name: callerName, profilePicture: callerAvatar });
      setIsCalling(false);
      onIncomingCall?.({ from, offer, roomId, callType, callerName, callerAvatar });
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
      onCallEnded?.("Call declined");
    };

    const handleIceCandidate = ({ candidate }) => {
      if (pcRef.current && candidate) {
        pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }
    };

    const handleCallEnded = () => {
      cleanupCall();
      onCallEnded?.("Call ended");
    };

    socket.on("incoming_call",  handleIncomingCall);
    socket.on("call_accepted",  handleCallAccepted);
    socket.on("call_rejected",  handleCallRejected);
    socket.on("ice_candidate",  handleIceCandidate);
    socket.on("call_ended",     handleCallEnded);

    return () => {
      socket.off("incoming_call",  handleIncomingCall);
      socket.off("call_accepted",  handleCallAccepted);
      socket.off("call_rejected",  handleCallRejected);
      socket.off("ice_candidate",  handleIceCandidate);
      socket.off("call_ended",     handleCallEnded);
    };
  }, [socket, callType, cleanupCall, onCallEnded, onIncomingCall]);

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
    permissionError,   // ← new: show in UI if needed
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCam,
    toggleScreenShare,
  };
};