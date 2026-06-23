import React, { useEffect, useRef } from "react";

const QUICK_REACTIONS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];

const ReactionBar = ({ onReact = () => {}, onClose = () => {} }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const handleSelect = (emoji) => {
    onReact(emoji);
    onClose();
  };

  return (
    <div
      ref={containerRef}
      role="menu"
      aria-label="Quick reactions"
      className="flex gap-2.5 bg-[#1c1c1c] border border-[#222222] rounded-full py-1.5 px-3 shadow-xl z-20 animate-in fade-in zoom-in-95 duration-150"
    >
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          role="menuitem"
          aria-label={`React with ${emoji}`}
          onClick={() => handleSelect(emoji)}
          className="text-lg leading-none p-1 rounded-full transition-transform duration-150 ease-out hover:scale-125 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default ReactionBar;