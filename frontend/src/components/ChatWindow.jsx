import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Send,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  Smile,
  Paperclip,
} from "lucide-react";

import useThemeStore from "../store/useThemeStore";

/**
 * ChatWindow
 * --------------------------------------------------------------
 * Visual language matches Login.jsx: ink/paper palette, Space
 * Grotesk for names/headers, Inter for body text, green accent.
 * Signature touch: message bubbles read like stamped paper notes
 * (soft shadow + tail), and a three-dot "breathing" typing
 * indicator instead of a generic spinner.
 * --------------------------------------------------------------
 * Wiring notes:
 * - `messages` is local state for now — swap the setMessages calls
 *   for your socket/REST send logic when ready.
 * - `selectedContact.isOnline` drives the status line; wire a
 *   real `isTyping` flag from your socket layer when ready (there's
 *   a dev-only toggle button in the header so you can preview the
 *   indicator before that's wired up).
 */

const ChatWindow = ({ selectedContact, setSelectedContact, isMobile }) => {
  const { theme } = useThemeStore();
  const dark = theme === "dark";

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  const ink = dark ? "#F2F0E9" : "#16221F";
  const sub = dark ? "#9FB3AC" : "#5C6B66";
  const accent = "#1FAE5C";
  const border = dark ? "rgba(242,240,233,0.10)" : "rgba(22,34,31,0.10)";
  const panelBg = dark ? "#0B1F1C" : "#F2EFE7";
  const headerBg = dark ? "#13302B" : "#FDFBF6";
  const bubbleTheirs = dark ? "#13302B" : "#FFFFFF";
  const inputBg = dark ? "#13302B" : "#FFFFFF";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  if (!selectedContact) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          background: panelBg,
          color: sub,
          fontFamily: "Inter, sans-serif",
        }}
      >
        <ChatGlyph color={sub} />
        <p style={{ fontSize: 15, fontWeight: 500, color: ink, margin: 0 }}>
          No conversation open
        </p>
        <p style={{ fontSize: 13, margin: 0, maxWidth: 240, textAlign: "center" }}>
          Pick someone from your chat list to pick up where you left off.
        </p>
      </div>
    );
  }

  const handleSend = () => {
    const text = message.trim();
    if (!text) return;

    const now = new Date();
    const id = now.getTime();
    setMessages((prev) => [
      ...prev,
      { _id: id, text, fromMe: true, time: now, status: "sent" },
    ]);
    setMessage("");

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m._id === id ? { ...m, status: "delivered" } : m))
      );
    }, 600);
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m._id === id ? { ...m, status: "read" } : m))
      );
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDayLabel = (date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    if (isToday) return "Today";
    return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
  };

  const groupedByDay = messages.reduce((groups, msg) => {
    const key = msg.time.toDateString();
    if (!groups.length || groups[groups.length - 1].key !== key) {
      groups.push({ key, label: formatDayLabel(msg.time), items: [msg] });
    } else {
      groups[groups.length - 1].items.push(msg);
    }
    return groups;
  }, []);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: panelBg,
        fontFamily: "Inter, sans-serif",
        color: ink,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        .cw-display { font-family: 'Space Grotesk', sans-serif; }
        .cw-bubble-in { animation: cwBubbleIn 0.22s cubic-bezier(.2,.8,.3,1) both; }
        @keyframes cwBubbleIn { from { opacity: 0; transform: translateY(6px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .cw-dot { animation: cwDot 1.1s ease-in-out infinite; }
        .cw-dot:nth-child(2) { animation-delay: 0.15s; }
        .cw-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes cwDot { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-3px); opacity: 1; } }
        .cw-icon-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 8px; padding: 6px; transition: background 0.12s ease; }
        .cw-icon-btn:hover { background: rgba(128,128,128,0.10); }
        .cw-send-btn:hover { filter: brightness(1.08); }
        .cw-input:focus { outline: none; box-shadow: 0 0 0 3px rgba(31,174,92,0.18); }
        @media (prefers-reduced-motion: reduce) {
          .cw-bubble-in, .cw-dot { animation: none !important; }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          background: headerBg,
          borderBottom: `1px solid ${border}`,
          flexShrink: 0,
        }}
      >
        {isMobile && (
          <button
            className="cw-icon-btn"
            onClick={() => setSelectedContact(null)}
            aria-label="Back to chat list"
            style={{ color: ink }}
          >
            <ArrowLeft size={20} />
          </button>
        )}

        <div style={{ position: "relative", flexShrink: 0 }}>
          <img
            src={
              selectedContact.profilePic ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedContact.name)}&background=1FAE5C&color=fff`
            }
            alt={selectedContact.name}
            style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }}
          />
          {selectedContact.isOnline && (
            <span
              style={{
                position: "absolute",
                bottom: -1,
                right: -1,
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: accent,
                border: `2px solid ${headerBg}`,
              }}
            />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            className="cw-display"
            style={{
              fontSize: 15.5,
              fontWeight: 600,
              margin: 0,
              letterSpacing: -0.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {selectedContact.name}
          </h3>
          <p style={{ fontSize: 12, color: sub, margin: 0 }}>
            {isTyping ? (
              <span style={{ color: accent, fontWeight: 500 }}>typing…</span>
            ) : selectedContact.isOnline ? (
              "Online"
            ) : (
              "Offline"
            )}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <button className="cw-icon-btn" style={{ color: sub }} aria-label="Voice call">
            <Phone size={18} />
          </button>
          <button className="cw-icon-btn" style={{ color: sub }} aria-label="Video call">
            <Video size={18} />
          </button>
          <button className="cw-icon-btn" style={{ color: sub }} aria-label="More options">
            <MoreVertical size={18} />
          </button>
          <button
            className="cw-icon-btn"
            style={{ color: sub, fontSize: 10 }}
            onClick={() => setIsTyping((t) => !t)}
            title="Toggle typing indicator (dev only)"
          >
            ⌁
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {messages.length === 0 && !isTyping ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              color: sub,
            }}
          >
            <ChatGlyph color={sub} />
            <p
              className="cw-display"
              style={{ fontSize: 14.5, fontWeight: 600, color: ink, margin: "8px 0 0" }}
            >
              Say hi to {selectedContact.name.split(" ")[0]}
            </p>
            <p style={{ fontSize: 12.5, margin: 0 }}>Your messages are just between the two of you.</p>
          </div>
        ) : (
          groupedByDay.map((group) => (
            <React.Fragment key={group.key}>
              <div style={{ display: "flex", justifyContent: "center", margin: "4px 0" }}>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: sub,
                    background: dark ? "rgba(242,240,233,0.06)" : "rgba(22,34,31,0.05)",
                    padding: "4px 12px",
                    borderRadius: 20,
                  }}
                >
                  {group.label}
                </span>
              </div>

              {group.items.map((msg) => (
                <div
                  key={msg._id}
                  className="cw-bubble-in"
                  style={{ display: "flex", justifyContent: msg.fromMe ? "flex-end" : "flex-start" }}
                >
                  <div
                    style={{
                      maxWidth: "72%",
                      padding: "8px 12px",
                      borderRadius: 14,
                      borderBottomRightRadius: msg.fromMe ? 4 : 14,
                      borderBottomLeftRadius: msg.fromMe ? 14 : 4,
                      background: msg.fromMe ? accent : bubbleTheirs,
                      color: msg.fromMe ? "#0B1F1C" : ink,
                      boxShadow: dark
                        ? "0 2px 8px -2px rgba(0,0,0,0.4)"
                        : "0 2px 8px -2px rgba(22,34,31,0.12)",
                    }}
                  >
                    <p style={{ fontSize: 14, lineHeight: 1.4, margin: 0, wordBreak: "break-word" }}>
                      {msg.text}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: 4,
                        marginTop: 3,
                      }}
                    >
                      <span style={{ fontSize: 10.5, opacity: 0.75 }}>{formatTime(msg.time)}</span>
                      {msg.fromMe && <ReadTicks status={msg.status} />}
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          ))
        )}

        {isTyping && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                display: "flex",
                gap: 4,
                padding: "11px 14px",
                borderRadius: 14,
                borderBottomLeftRadius: 4,
                background: bubbleTheirs,
                boxShadow: dark ? "0 2px 8px -2px rgba(0,0,0,0.4)" : "0 2px 8px -2px rgba(22,34,31,0.12)",
              }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="cw-dot"
                  style={{ width: 6, height: 6, borderRadius: "50%", background: sub, display: "inline-block" }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          background: headerBg,
          borderTop: `1px solid ${border}`,
          flexShrink: 0,
        }}
      >
        <button className="cw-icon-btn" style={{ color: sub }} aria-label="Attach a file">
          <Paperclip size={20} />
        </button>
        <button className="cw-icon-btn" style={{ color: sub }} aria-label="Add an emoji">
          <Smile size={20} />
        </button>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          className="cw-input"
          style={{
            flex: 1,
            padding: "10px 16px",
            borderRadius: 24,
            border: "none",
            background: inputBg,
            color: ink,
            fontSize: 14,
            fontFamily: "Inter, sans-serif",
          }}
        />

        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="cw-send-btn"
          aria-label="Send message"
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: "none",
            background: message.trim() ? accent : sub,
            color: "#0B1F1C",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: message.trim() ? "pointer" : "not-allowed",
            opacity: message.trim() ? 1 : 0.5,
            flexShrink: 0,
            transition: "background 0.15s ease, opacity 0.15s ease",
          }}
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  );
};

const ReadTicks = ({ status }) => {
  if (status === "sent") return <Check size={13} style={{ opacity: 0.75 }} />;
  if (status === "delivered") return <CheckCheck size={13} style={{ opacity: 0.75 }} />;
  if (status === "read") return <CheckCheck size={13} style={{ color: "#0B1F1C" }} />;
  return null;
};

const ChatGlyph = ({ color }) => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 5h16v10H9l-4 4v-4H4V5Z"
      stroke={color}
      strokeWidth="1.6"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

export default ChatWindow;