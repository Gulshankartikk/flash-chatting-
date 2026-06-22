import React from "react";

const QUICK_REACTIONS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];

const ReactionBar = ({ onReact, onClose }) => {
  return (
    <div className="flex gap-2.5 bg-[#1A1A26] border border-[#2A2A3D] rounded-full py-1 px-3 shadow-xl z-20">
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => {
            if (onReact) onReact(emoji);
            if (onClose) onClose();
          }}
          className="text-lg hover:scale-135 transition-transform duration-100"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default ReactionBar;
