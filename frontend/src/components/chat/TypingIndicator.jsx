import React from "react";

const TypingIndicator = () => {
  return (
    <div className="flex justify-start px-6 py-2">
      <div className="flex gap-1.5 bg-slate-100 dark:bg-[#1c1c1c] rounded-2xl rounded-bl-none px-4 py-3 shadow-md border border-slate-200 dark:border-[#222222]">
        <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-[#A0A0A0] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-[#A0A0A0] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-[#A0A0A0] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
};

export default TypingIndicator;
