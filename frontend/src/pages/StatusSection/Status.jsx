import React, { useState, useRef, useEffect, useCallback } from "react";
import useUserStore from "../../store/useUserStore";
import useChatStore from "../../store/chatStore";
import useSocket from "../../hooks/useSocket";
import axiosInstance from "../../services/url.services";
import { toast } from "react-toastify";
import { Eye, Trash2, Send, Image } from "lucide-react";

const Status = () => {
  const currentUser = useUserStore((state) => state.user);
  const { socket } = useSocket();

  const [statuses, setStatuses] = useState([]);
  const [myStatusUpdates, setMyStatusUpdates] = useState([]);
  const [viewingContact, setViewingContact] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchStatuses = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/status");
      const list = res.data?.data || [];

      // Find my own updates
      const myItem = list.find((item) => String(item.user?._id) === String(currentUser?._id));
      if (myItem) {
        setMyStatusUpdates(myItem.updates.map(up => ({
          id: up._id,
          type: up.contentType,
          content: up.content,
          time: formatStatusTime(up.createdAt),
          viewers: up.viewers || [],
        })));
      } else {
        setMyStatusUpdates([]);
      }

      // Filter and map contacts updates
      const contactItems = list.filter((item) => String(item.user?._id) !== String(currentUser?._id));
      const mapped = contactItems.map((item) => ({
        _id: item.user?._id,
        name: item.user?.username || "Unknown",
        avatarText: item.user?.username?.charAt(0).toUpperCase() || "U",
        profilePic: item.user?.profilePicture,
        viewed: item.allViewed,
        updates: item.updates.map((up) => ({
          id: up._id,
          type: up.contentType,
          content: up.content,
          time: formatStatusTime(up.createdAt),
          viewers: up.viewers || [],
        })),
      }));
      setStatuses(mapped);
    } catch (e) {
      console.error("Failed to fetch statuses", e);
    }
  }, [currentUser?._id]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  // Real-time socket updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchStatuses();
    };

    socket.on("new_status", handleUpdate);
    socket.on("status_deleted", handleUpdate);
    socket.on("status_viewed", handleUpdate);

    return () => {
      socket.off("new_status", handleUpdate);
      socket.off("status_deleted", handleUpdate);
      socket.off("status_viewed", handleUpdate);
    };
  }, [socket, fetchStatuses]);

  const markViewed = async (statusId) => {
    try {
      await axiosInstance.put(`/status/${statusId}/view`);
    } catch (e) {
      console.error("Failed to view status", e);
    }
  };

  const openViewer = (contact) => {
    // If it's first update, mark viewed
    if (contact.updates && contact.updates.length > 0 && !contact.isMine) {
      markViewed(contact.updates[0].id);
    }
    setViewingContact(contact);
  };

  const handleAddStatus = async (data) => {
    try {
      let res;
      if (data.file) {
        const formData = new FormData();
        formData.append("file", data.file);
        if (data.text) {
          formData.append("content", data.text);
        }
        res = await axiosInstance.post("/status", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await axiosInstance.post("/status", { content: data.text });
      }

      if (res.data) {
        toast.success("Status posted successfully!");
        fetchStatuses();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload status update");
    }
    setShowCreateForm(false);
  };

  const handleDeleteStatus = async (statusId) => {
    if (!window.confirm("Are you sure you want to delete this status update?")) return;
    try {
      await axiosInstance.delete(`/status/${statusId}`);
      toast.success("Status deleted");
      fetchStatuses();
      setViewingContact(null);
    } catch (e) {
      toast.error("Failed to delete status");
    }
  };

  const formatStatusTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const recent = statuses.filter((s) => !s.viewed);
  const viewed = statuses.filter((s) => s.viewed);
  const glowAccent = "#FFD166";

  return (
    <div className="h-full overflow-y-auto bg-[#000000] text-[#FFFFFF] font-sans">
      {/* Header */}
      <div className="p-4 border-b border-[#222222] bg-[#111111] sticky top-0 z-10">
        <h2 className="text-xl font-bold text-left">Status</h2>
      </div>

      {/* My status */}
      <div
        onClick={() =>
          myStatusUpdates.length > 0
            ? openViewer({
                _id: "me",
                name: "My status",
                avatarText: currentUser?.username?.charAt(0)?.toUpperCase() || "M",
                profilePic: currentUser?.profilePicture,
                updates: myStatusUpdates,
                isMine: true,
              })
            : setShowCreateForm(true)
        }
        className="flex items-center gap-4 p-4 cursor-pointer border-b border-[#222222] hover:bg-[#1c1c1c] transition-colors"
      >
        <div className="relative flex-shrink-0">
          {myStatusUpdates.length > 0 ? (
            <StatusRing
              segments={myStatusUpdates.length}
              viewed={false}
              accent={glowAccent}
              size={48}
            >
              <Avatar text={currentUser?.username?.charAt(0)?.toUpperCase() || "M"} src={currentUser?.profilePicture} />
            </StatusRing>
          ) : (
            <Avatar text={currentUser?.username?.charAt(0)?.toUpperCase() || "M"} src={currentUser?.profilePicture} size={48} />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCreateForm(true);
            }}
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full text-white flex items-center justify-center text-xs font-bold border-2 border-[#000000] bg-[#FF6B00]"
            aria-label="Add status"
          >
            +
          </button>
        </div>
        <div className="text-left">
          <p className="font-semibold text-sm">My status</p>
          <p className="text-xs text-[#A0A0A0] mt-0.5">
            {myStatusUpdates.length > 0 ? "Tap to view" : "Tap to add status update"}
          </p>
        </div>
      </div>

      {/* Recent updates */}
      {recent.length > 0 && (
        <p className="px-4 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#A0A0A0] text-left">
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
        <p className="px-4 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#A0A0A0] text-left">
          Viewed updates
        </p>
      )}
      {viewed.map((contact) => (
        <StatusRow
          key={contact._id}
          contact={contact}
          accent="#555555"
          onClick={() => openViewer(contact)}
        />
      ))}

      {statuses.length === 0 && myStatusUpdates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center text-[#A0A0A0]">
          <div className="text-5xl mb-3">🔒</div>
          <p className="text-sm font-semibold">No status updates yet.</p>
          <p className="text-xs opacity-75 mt-0.5">Updates from your contacts will show up here.</p>
        </div>
      )}

      {/* Full-screen status viewer */}
      {viewingContact && (
        <StatusViewer
          contact={viewingContact}
          onClose={() => setViewingContact(null)}
          onDelete={handleDeleteStatus}
          onView={markViewed}
        />
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

const Avatar = ({ text, src, size = 44 }) => (
  src ? (
    <img
      src={src}
      alt=""
      className="rounded-full object-cover border border-[#222222]"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="rounded-full flex items-center justify-center font-bold bg-[#1c1c1c] border border-[#222222] text-[#FFFFFF]"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {text}
    </div>
  )
);

const StatusRing = ({ segments, viewed, accent, size = 48, children }) => {
  const gapDeg = 8;
  const segCount = Math.max(segments, 1);
  const segAngle = 360 / segCount;
  const strokeColor = viewed ? "#555555" : accent;

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
    className="flex items-center gap-4 p-4 cursor-pointer border-b border-[#222222] hover:bg-[#1c1c1c] transition-colors"
  >
    <StatusRing segments={contact.updates.length} viewed={contact.viewed} accent={accent} size={48}>
      <Avatar text={contact.avatarText} src={contact.profilePic} size={44} />
    </StatusRing>
    <div className="text-left">
      <p className="font-semibold text-sm">{contact.name}</p>
      <p className="text-xs text-[#A0A0A0] mt-0.5">
        {contact.updates[contact.updates.length - 1]?.time}
      </p>
    </div>
  </div>
);

const STORY_DURATION = 5000;

const StatusViewer = ({ contact, onClose, onDelete, onView }) => {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showViewerList, setShowViewerList] = useState(false);

  const timerRef = useRef(null);
  const startRef = useRef(null);
  const elapsedRef = useRef(0);

  const sendMessage = useChatStore((s) => s.sendMessage);

  const current = contact.updates[index];

  const goNext = useCallback(() => {
    if (index < contact.updates.length - 1) {
      setIndex((i) => i + 1);
      // Mark next index viewed
      if (!contact.isMine) {
        onView(contact.updates[index + 1].id);
      }
    } else {
      onClose();
    }
  }, [index, contact.updates, contact.isMine, onView, onClose]);

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
      if (!contact.isMine) {
        onView(contact.updates[index - 1].id);
      }
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      const formattedQuote = `Replied to status (${current.type}): "${current.type === "text" ? current.content : "Media"}"\n\n${replyText.trim()}`;
      await sendMessage({
        receiverId: contact._id,
        message: formattedQuote,
        messageType: "text",
      });
      toast.success("Reply sent!");
      setReplyText("");
      onClose();
    } catch (err) {
      toast.error("Failed to send reply");
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
      <div className="relative w-full h-full max-w-md mx-auto flex flex-col justify-between">
        {/* Top Header Section */}
        <div className="w-full z-20 bg-gradient-to-b from-black/80 to-transparent">
          {/* Progress bars */}
          <div className="flex gap-1 px-2 pt-3">
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
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <Avatar text={contact.avatarText} src={contact.profilePic} size={36} />
              <div className="text-left">
                <p className="text-sm font-semibold">{contact.name}</p>
                <p className="text-xs opacity-75">{current.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {contact.isMine && (
                <button
                  onClick={() => onDelete(current.id)}
                  className="p-1 hover:bg-white/10 rounded text-[#FF3D71] transition-colors"
                  title="Delete Update"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button onClick={onClose} className="text-2xl px-2 leading-none" aria-label="Close">
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 flex items-center justify-center bg-black overflow-hidden relative">
          {current.type === "image" ? (
            <img
              src={current.content}
              alt="status"
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          ) : current.type === "video" ? (
            <video
              src={current.content}
              autoPlay
              playsInline
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white text-2xl font-semibold px-8 text-center"
              style={{ backgroundColor: "#FF6B00" }}
            >
              {current.content}
            </div>
          )}

          {/* Pause indicator */}
          {paused && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 px-4 py-2 rounded-xl text-white/80 text-xs uppercase tracking-widest pointer-events-none">
              Paused
            </div>
          )}

          {/* Tap zones for navigation */}
          <div className="absolute inset-0 flex top-0 z-10 h-[85%]">
            <div className="w-1/3 h-full cursor-w-resize" onClick={goPrev} />
            <div className="w-2/3 h-full cursor-e-resize" onClick={goNext} />
          </div>
        </div>

        {/* Footer Reply / Seen Count Section */}
        <div className="w-full p-4 z-20 bg-gradient-to-t from-black/90 to-transparent">
          {contact.isMine ? (
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => setShowViewerList(true)}
                className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm"
              >
                <Eye size={16} />
                <span>{current.viewers?.length || 0} views</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleReplySubmit} className="flex items-center gap-3">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={handlePauseStart}
                onBlur={handlePauseEnd}
                placeholder="Reply to status..."
                className="flex-1 px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/55 text-sm focus:outline-none focus:border-white/50 backdrop-blur-sm"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="p-2.5 bg-[#FF6B00] hover:bg-[#E05E00] disabled:opacity-50 text-white rounded-full transition-colors flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Viewer List Modal */}
      {showViewerList && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111111] rounded-t-3xl p-6 border-t border-[#222222] shadow-2xl max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3 mb-4">
              <h3 className="font-bold text-base text-white">Viewed by ({current.viewers?.length || 0})</h3>
              <button
                onClick={() => setShowViewerList(false)}
                className="text-white hover:text-[#FF6B00] text-xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 divide-y divide-[#222222]">
              {current.viewers && current.viewers.length > 0 ? (
                current.viewers.map((viewer) => (
                  <div key={viewer._id} className="flex items-center gap-3.5 py-3">
                    <Avatar text={viewer.username?.charAt(0).toUpperCase()} src={viewer.profilePicture} size={36} />
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{viewer.username}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-slate-500 text-sm">
                  No views yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CreateStatusForm = ({ onClose, onSubmit }) => {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState(null); // 'image' | 'video'
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const mime = file.type;
    if (mime.startsWith("image/")) {
      setFileType("image");
    } else if (mime.startsWith("video/")) {
      setFileType("video");
    } else {
      toast.error("Only images and videos are supported for status updates.");
      setSelectedFile(null);
      setFileType(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setFilePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleCancelFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileType(null);
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onSubmit({
        file: selectedFile,
        text: text.trim(),
      });
    } else if (text.trim()) {
      onSubmit({
        text: text.trim(),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl p-5 shadow-2xl bg-[#1c1c1c] border border-[#222222] text-[#FFFFFF]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Add Status Update</h3>
          <button onClick={onClose} className="text-xl leading-none text-[#A0A0A0] hover:text-[#FF9E00]" aria-label="Close">
            ×
          </button>
        </div>

        {filePreview ? (
          <div className="mb-4 relative">
            {fileType === "image" ? (
              <img src={filePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg border border-[#222222]" />
            ) : (
              <video src={filePreview} controls className="w-full h-48 object-cover rounded-lg border border-[#222222]" />
            )}
            <button
              onClick={handleCancelFile}
              className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-[#FF3D71] hover:text-white"
            >
              ×
            </button>
          </div>
        ) : null}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={selectedFile ? "Add a caption..." : "Write status message..."}
          rows={3}
          className="w-full p-3 rounded-xl outline-none resize-none mb-4 bg-black text-[#FFFFFF] placeholder-[#555555] border border-[#222222] focus:border-[#FF6B00] text-sm"
        />

        <input
          type="file"
          accept="image/*,video/*"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2.5 rounded-xl border border-[#222222] text-xs hover:bg-[#222222] transition-colors flex items-center justify-center gap-1.5"
          >
            <Image size={14} className="text-[#00E676]" /> Photo / Video
          </button>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() && !selectedFile}
            className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-[#FF6B00] hover:bg-[#E05E00]"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default Status;