import React from "react";

const StatusDot = ({ isOnline, status = "online", size = 8 }) => {
  let color = "#555555"; // Offline
  let shadow = "none";

  const currentStatus = isOnline ? status : "offline";

  if (currentStatus === "online") {
    color = "#FFD166"; // cyan glow dot
    shadow = "0 0 8px #FFD166";
  } else if (currentStatus === "away") {
    color = "#FFB300"; // amber
    shadow = "0 0 6px #FFB300";
  } else if (currentStatus === "busy") {
    color = "#FF3D71"; // red
    shadow = "0 0 6px #FF3D71";
  }

  return (
    <span
      className="inline-block rounded-full transition-all duration-300"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: shadow,
      }}
    />
  );
};

export default StatusDot;
