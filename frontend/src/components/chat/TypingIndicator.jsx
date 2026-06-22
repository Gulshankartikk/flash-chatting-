import React from "react";

const TypingIndicator = () => {
  return (
    <div className="flex justify-start px-6 py-2">
      <div className="flex gap-1.5 bg-[#1A1A26] rounded-2xl rounded-bl-none px-4 py-3 shadow-md border border-[#2A2A3D]">
        <span className="w-1.5 h-1.5 bg-[#9090B0] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 bg-[#9090B0] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 bg-[#9090B0] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
};

export default TypingIndicator;
