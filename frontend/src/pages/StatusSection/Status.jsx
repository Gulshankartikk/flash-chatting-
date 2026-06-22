import React, { useState, useRef, useEffect, useCallback } from "react";
import useUserStore from "../../store/useUserStore";

// Dummy data for WhatsApp-style Status tray
const initialStatuses = [
  {
    _id: "1",
    name: "Aman",
    avatarText: "A",
    viewed: false,
    updates: [
      { id: "u1", type: "text", content: "Good vibes only ✨", time: "10 minutes ago", bg: "#6C63FF" },
    ],
  },
  {
    _id: "2",
    name: "Priya",
    avatarText: "P",
    viewed: true,
    updates: [
      { id: "u2", type: "text", content: "Weekend mode on ☀️", time: "2 hours ago", bg: "#FF6584" },
      { id: "u3", type: "text", content: "Coffee first ☕", time: "1 hour ago", bg: "#00D4FF" },
    ],
  },
];

const Status = () => {
  const currentUser = useUserStore((state) => state.user);

  const [statuses, setStatuses] = useState(initialStatuses);
  const [myStatusUpdates, setMyStatusUpdates] = useState([]);
  const [viewingContact, setViewingContact] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const markViewed = (contactId) => {
    setStatuses((prev) =>
      prev.map((s) => (s._id === contactId ? { ...s, viewed: true } : s))
    );
  };

  const openViewer = (contact) => {
    markViewed(contact._id);
    setViewingContact(contact);
  };

  const handleAddStatus = (newUpdate) => {
    setMyStatusUpdates((prev) => [...prev, newUpdate]);
    setShowCreateForm(false);
  };

  const recent = statuses.filter((s) => !s.viewed);
  const viewed = statuses.filter((s) => s.viewed);

  const glowAccent = "#00D4FF";

  return (
    <div className="h-full overflow-y-auto bg-[#0A0A0F] text-[#F0F0FF] font-sans">
      {/* Header */}
      <div className="p-4 border-b border-[#2A2A3D] bg-[#111118] sticky top-0 z-10">
        <h2 className="text-xl font-bold">Status</h2>
      </div>

      {/* My status */}
      <div
        onClick={() =>
          myStatusUpdates.length > 0
            ? openViewer({
                _id: "me",
                name: "My status",
                avatarText: currentUser?.username?.charAt(0)?.toUpperCase() || "M",
                updates: myStatusUpdates,
                isMine: true,
              })
            : setShowCreateForm(true)
        }
        className="flex items-center gap-4 p-4 cursor-pointer border-b border-[#2A2A3D] hover:bg-[#1A1A26] transition-colors"
      >
        <div className="relative flex-shrink-0">
          {myStatusUpdates.length > 0 ? (
            <StatusRing
              segments={myStatusUpdates.length}
              viewed={false}
              accent={glowAccent}
              size={48}
            >
              <Avatar text={currentUser?.username?.charAt(0)?.toUpperCase() || "M"} />
            </StatusRing>
          ) : (
            <Avatar text={currentUser?.username?.charAt(0)?.toUpperCase() || "M"} size={48} />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCreateForm(true);
            }}
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full text-white flex items-center justify-center text-xs font-bold border-2 border-[#0A0A0F] bg-[#6C63FF]"
            aria-label="Add status"
          >
            +
          </button>
        </div>
        <div className="text-left">
          <p className="font-semibold text-sm">My status</p>
          <p className="text-xs text-[#9090B0] mt-0.5">
            {myStatusUpdates.length > 0 ? "Tap to view" : "Tap to add status update"}
          </p>
        </div>
      </div>

      {/* Recent updates */}
      {recent.length > 0 && (
        <p className="px-4 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9090B0] text-left">
          Recent updates
        </p>
      )}
      {recent.map((contact) => (
        <StatusRow
          key={contact._id}
          contact={contact}
          accent={glowAccent}
          onClick={() => openViewer(contact)}
        />
      ))}

      {/* Viewed updates */}
      {viewed.length > 0 && (
        <p className="px-4 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9090B0] text-left">
          Viewed updates
        </p>
      )}
      {viewed.map((contact) => (
        <StatusRow
          key={contact._id}
          contact={contact}
          accent="#4A4A6A"
          onClick={() => openViewer(contact)}
        />
      ))}

      {statuses.length === 0 && myStatusUpdates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center text-[#9090B0]">
          <div className="text-5xl mb-3">🔒</div>
          <p className="text-sm font-semibold">No status updates yet.</p>
          <p className="text-xs opacity-75 mt-0.5">Updates from your contacts will show up here.</p>
        </div>
      )}

      {/* Full-screen status viewer */}
      {viewingContact && (
        <StatusViewer contact={viewingContact} onClose={() => setViewingContact(null)} />
      )}

      {/* Create status form */}
      {showCreateForm && (
        <CreateStatusForm
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleAddStatus}
        />
      )}
    </div>
  );
};

const Avatar = ({ text, size = 44 }) => (
  <div
    className="rounded-full flex items-center justify-center font-bold bg-[#1A1A26] border border-[#2A2A3D] text-[#F0F0FF]"
    style={{ width: size, height: size, fontSize: size * 0.36 }}
  >
    {text}
  </div>
);

const StatusRing = ({ segments, viewed, accent, size = 48, children }) => {
  const gapDeg = 8;
  const segCount = Math.max(segments, 1);
  const segAngle = 360 / segCount;
  const strokeColor = viewed ? "#4A4A6A" : accent;

  const radius = size / 2 - 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const arcs = [];
  for (let i = 0; i < segCount; i++) {
    const dashLen = ((segAngle - gapDeg) / 360) * circumference;
    const gapLen = circumference - dashLen;
    const rotation = i * segAngle - 90;
    arcs.push(
      <circle
        key={i}
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2}
        strokeDasharray={`${dashLen} ${gapLen}`}
        transform={`rotate(${rotation} ${center} ${center})`}
      />
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0">
        {arcs}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center p-[3px]">
        {children}
      </div>
    </div>
  );
};

const StatusRow = ({ contact, accent, onClick }) => (
  <div
    onClick={onClick}
    className="flex items-center gap-4 p-4 cursor-pointer border-b border-[#2A2A3D] hover:bg-[#1A1A26] transition-colors"
  >
    <StatusRing segments={contact.updates.length} viewed={contact.viewed} accent={accent} size={48}>
      <Avatar text={contact.avatarText} size={44} />
    </StatusRing>
    <div className="text-left">
      <p className="font-semibold text-sm">{contact.name}</p>
      <p className="text-xs text-[#9090B0] mt-0.5">
        {contact.updates[contact.updates.length - 1]?.time}
      </p>
    </div>
  </div>
);

const STORY_DURATION = 5000;

const StatusViewer = ({ contact, onClose }) => {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const elapsedRef = useRef(0);

  const current = contact.updates[index];

  const goNext = useCallback(() => {
    if (index < contact.updates.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onClose();
    }
  }, [index, contact.updates.length, onClose]);

  useEffect(() => {
    setProgress(0);
    elapsedRef.current = 0;
    startRef.current = Date.now();

    timerRef.current = setInterval(() => {
      if (paused) return;
      const elapsed = elapsedRef.current + (Date.now() - startRef.current);
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        goNext();
      }
    }, 50);

    return () => clearInterval(timerRef.current);
  }, [index, paused, goNext]);

  const handlePauseStart = () => {
    elapsedRef.current += Date.now() - startRef.current;
    setPaused(true);
  };
  const handlePauseEnd = () => {
    startRef.current = Date.now();
    setPaused(false);
  };

  const goPrev = () => {
    if (index > 0) {
      setIndex((i) => i - 1);
    }
  };

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none"
      onMouseDown={handlePauseStart}
      onMouseUp={handlePauseEnd}
      onTouchStart={handlePauseStart}
      onTouchEnd={handlePauseEnd}
    >
      <div className="relative w-full h-full max-w-md mx-auto flex flex-col">
        {/* Progress bars */}
        <div className="flex gap-1 px-2 pt-3 z-20">
          {contact.updates.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] bg-white/30 rounded overflow-hidden">
              <div
                className="h-full bg-white"
                style={{
                  width: i < index ? "100%" : i === index ? `${progress}%` : "0%",
                  transition: i === index && !paused ? "none" : "width 0.1s",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 text-white z-20 bg-gradient-to-b from-black/40 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center font-medium text-sm">
              {contact.avatarText}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">{contact.isMine ? "My status" : contact.name}</p>
              <p className="text-xs opacity-70">{current.time}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-2xl px-2 leading-none" aria-label="Close">
            ×
          </button>
        </div>

        {/* Content */}
        {current.type === "image" ? (
          <div className="flex-1 flex items-center justify-center bg-black overflow-hidden">
            <img
              src={current.content}
              alt="status"
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          </div>
        ) : (
          <div
            className="flex-1 flex items-center justify-center text-white text-2xl font-medium px-8 text-center"
            style={{ backgroundColor: current.bg || "#222" }}
          >
            {current.content}
          </div>
        )}

        {/* Pause indicator */}
        {paused && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/70 text-xs uppercase tracking-widest pointer-events-none">
            Paused
          </div>
        )}

        {/* Tap zones for navigation */}
        <div className="absolute inset-0 flex top-0 z-10">
          <div className="w-1/2 h-full" onClick={goPrev} />
          <div className="w-1/2 h-full" onClick={goNext} />
        </div>
      </div>
    </div>
  );
};

const CreateStatusForm = ({ onClose, onSubmit }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (imagePreview) {
      onSubmit({
        id: Date.now().toString(),
        type: "image",
        content: imagePreview,
        time: "Just now",
      });
    } else if (text.trim()) {
      onSubmit({
        id: Date.now().toString(),
        type: "text",
        content: text.trim(),
        time: "Just now",
        bg: "#6C63FF",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl p-5 shadow-2xl bg-[#1A1A26] border border-[#2A2A3D] text-[#F0F0FF]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Add status update</h3>
          <button onClick={onClose} className="text-xl leading-none text-[#9090B0] hover:text-[#FF6584]" aria-label="Close">
            ×
          </button>
        </div>

        {imagePreview ? (
          <div className="mb-4">
            <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg border border-[#2A2A3D]" />
            <button onClick={() => setImagePreview(null)} className="text-xs text-[#FF3D71] mt-2">
              Remove image
            </button>
          </div>
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            className="w-full p-3 rounded-xl outline-none resize-none mb-4 bg-black text-[#F0F0FF] placeholder-[#4A4A6A] border border-[#2A2A3D] focus:border-[#6C63FF] text-sm"
          />
        )}

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageSelect}
          className="hidden"
        />

        <div className="flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2.5 rounded-xl border border-[#2A2A3D] text-xs hover:bg-[#2A2A3D] transition-colors"
          >
            Photo
          </button>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() && !imagePreview}
            className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-[#6C63FF] hover:bg-[#5b52e6]"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default Status;