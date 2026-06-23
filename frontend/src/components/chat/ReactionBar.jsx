import React from "react";

const QUICK_REACTIONS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];

const ReactionBar = ({ onReact, onClose }) => {
  return (
    <div className="flex gap-2.5 bg-[#1c1c1c] border border-[#222222] rounded-full py-1 px-3 shadow-xl z-20">
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
