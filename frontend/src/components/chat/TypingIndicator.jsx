import React from "react";

const TypingIndicator = ({ name }) => {
  return (
    <div className="flex justify-start px-6 py-2" role="status" aria-live="polite">
      <span className="sr-only">
        {name ? `${name} is typing` : "Typing"}
      </span>
      <div className="flex gap-1.5 bg-slate-100 dark:bg-[#1c1c1c] rounded-2xl rounded-bl-none px-4 py-3 shadow-md border border-slate-200 dark:border-[#222222]">
        <span
          className="w-1.5 h-1.5 bg-slate-400 dark:bg-[#A0A0A0] rounded-full"
          style={{ animation: "typing-dot 1.2s ease-in-out infinite", animationDelay: "0ms" }}
        />
        <span
          className="w-1.5 h-1.5 bg-slate-400 dark:bg-[#A0A0A0] rounded-full"
          style={{ animation: "typing-dot 1.2s ease-in-out infinite", animationDelay: "150ms" }}
        />
        <span
          className="w-1.5 h-1.5 bg-slate-400 dark:bg-[#A0A0A0] rounded-full"
          style={{ animation: "typing-dot 1.2s ease-in-out infinite", animationDelay: "300ms" }}
        />
      </div>
      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          span[style*="typing-dot"] {
            animation: none !important;
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator;