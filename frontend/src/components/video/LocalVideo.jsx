import React, { useRef, useState, useEffect } from "react";

const LocalVideo = ({ stream, isCamOff, username }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [position, setPosition] = useState({ x: 20, y: 20 }); // offset from bottom-right
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX + position.x,
      y: e.clientY + position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setPosition({
        x: dragStart.x - e.clientX,
        y: dragStart.y - e.clientY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className="absolute w-36 h-48 rounded-xl overflow-hidden shadow-2xl border-2 border-[#00D4FF] bg-[#1A1A26] z-40 cursor-move select-none"
      style={{
        bottom: `${Math.max(10, position.y)}px`,
        right: `${Math.max(10, position.x)}px`,
      }}
    >
      {!isCamOff && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-xs text-[#9090B0] bg-black/60">
          <div className="w-12 h-12 rounded-full bg-[#6C63FF] text-[#F0F0FF] flex items-center justify-center font-bold text-lg">
            {username?.charAt(0).toUpperCase() || "Y"}
          </div>
          <span>Camera Off</span>
        </div>
      )}
    </div>
  );
};

export default LocalVideo;
