import { useEffect, useRef } from "react";
import useSocket from "./useSocket";
import useUserStore from "../store/useUserStore";

const IDLE_TIME_MS = 5 * 60 * 1000; // 5 minutes

export const useStatus = () => {
  const { socket } = useSocket();
  const user = useUserStore((state) => state.user);
  const timeoutRef = useRef(null);
  const currentStatusRef = useRef("online");

  useEffect(() => {
    if (!socket || !user?._id) return;

    const updateStatus = (status) => {
      if (currentStatusRef.current === status) return;
      currentStatusRef.current = status;
      socket.emit("set_status", { userId: user._id, status });
    };

    const resetIdleTimer = () => {
      updateStatus("online");

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        updateStatus("away");
      }, IDLE_TIME_MS);
    };

    // Listen to user interaction events to reset the timer
    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    events.forEach((event) => window.addEventListener(event, resetIdleTimer));

    // Initialize idle timer
    resetIdleTimer();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) => window.removeEventListener(event, resetIdleTimer));
    };
  }, [socket, user?._id]);
};

export default useStatus;
