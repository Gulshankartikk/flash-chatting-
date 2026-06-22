import { useEffect, useState, useCallback } from "react";
import useSocket from "./useSocket";
import { toast } from "react-toastify";

export const useNotifications = () => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Request browser notification permissions
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const addNotification = useCallback((notif) => {
    const id = notif.id || `notif_${Date.now()}`;
    const newNotif = { ...notif, id, timestamp: new Date(), read: false };
    setNotifications((prev) => [newNotif, ...prev]);
    setUnreadCount((c) => c + 1);

    // Show HTML5 native push notification if document is hidden
    if (document.hidden && Notification.permission === "granted") {
      new Notification(notif.title || "New Notification", {
        body: notif.preview || notif.content,
        icon: notif.avatar || "/logo.png",
      });
    }

    // Play a gentle notification sound using Web Audio API
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 tone
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5 tone
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.warn("AudioContext notification tone failed:", e);
    }
  }, []);

  // Listen to new messages/calls/mentions/reactions via Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data) => {
      // data: { type, from, preview, title, avatar }
      addNotification(data);

      // Trigger standard in-app Toast
      toast.info(
        <div className="flex items-center gap-3">
          {data.avatar && (
            <img
              src={data.avatar}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          <div>
            <p className="font-semibold text-sm">{data.title || "New Alert"}</p>
            <p className="text-xs opacity-80">{data.preview || data.content}</p>
          </div>
        </div>,
        {
          autoClose: 4000,
          onClick: () => {
            // Can add navigation callback here
          },
        }
      );
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, addNotification]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setNotifications((prev) => {
      const unread = prev.filter((n) => !n.read).length;
      setUnreadCount(unread);
      return prev;
    });
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAllAsRead,
    clearNotification,
  };
};

export default useNotifications;
