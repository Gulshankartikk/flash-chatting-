import { useEffect } from "react";

// ✅ Two bugs here:
// 1. Missing `useEffect` import — this would throw "useEffect is not
//    defined" the moment the hook ran.
// 2. `document.addEventListener("mouseDown", ...)` used the wrong event
//    name (case-sensitive — the real DOM event is "mousedown", all
//    lowercase). "mouseDown" is not a real event, so the listener never
//    fired at all, and the cleanup's `removeEventListener("mousedown")`
//    couldn't remove it either since the names didn't match — meaning
//    outside-click never actually worked, and every popover/menu using
//    this hook had to be dismissed some other way.
//
// Also added: touch support (so it works on mobile, where there's no
// mousedown) and Escape-to-close, since WhatsApp's menus, emoji picker,
// and dialogs all close on outside-click, tap, or Esc.
const useOutsideClick = (ref, callback) => {
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") callback();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [ref, callback]);
};

export default useOutsideClick;