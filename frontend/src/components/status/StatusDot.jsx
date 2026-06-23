import React from "react";

const STATUS_CONFIG = {
  online: { color: "#FFD166", glow: "0 0 8px #FFD166", label: "Online" },
  away: { color: "#FFB300", glow: "0 0 6px #FFB300", label: "Away" },
  busy: { color: "#FF3D71", glow: "0 0 6px #FF3D71", label: "Busy" },
  offline: { color: "#555555", glow: "none", label: "Offline" },
};

const StatusDot = ({ isOnline, status = "online", size = 8, ringColor = "#FFFFFF" }) => {
  const currentStatus = isOnline ? status : "offline";
  const { color, glow, label } = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.offline;

  return (
    <span
      role="status"
      aria-label={label}
      className="inline-block rounded-full transition-all duration-300"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: `0 0 0 2px ${ringColor}, ${glow}`,
      }}
    />
  );
};

export default StatusDot;