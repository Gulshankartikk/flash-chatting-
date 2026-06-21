import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MoreVertical, MessageSquarePlus } from "lucide-react";

import useLayoutStore from "../store/useLayoutStore";
import useThemeStore from "../store/useThemeStore";

/**
 * HomePage — chat list
 * --------------------------------------------------------------
 * Visual language matches Login.jsx and ChatWindow.jsx: ink/paper
 * palette, Space Grotesk for headers/names, Inter for body text,
 * green accent. Signature touch: contact rows feel like entries in
 * a paper address book — soft hairline dividers, a quiet "last
 * message" preview, and an unread chip instead of a bare dot.
 * --------------------------------------------------------------
 * Wiring notes:
 * - `contacts` comes from useLayoutStore (sample data for now —
 *   see useLayoutStore.js to swap in real backend data).
 * - Search is local/client-side filtering for now.
 * - `unreadCount` and `lastMessageTime` are optional fields on each
 *   contact; the UI degrades gracefully if they're missing.
 */

const HomePage = () => {
  const contacts = useLayoutStore((state) => state.contacts);
  const setSelectedContact = useLayoutStore((state) => state.setSelectedContact);
  const { theme } = useThemeStore();
  const dark = theme === "dark";

  const [query, setQuery] = useState("");

  // ---- Theme tokens (mirrors Login.jsx / ChatWindow.jsx) ----
  const ink = dark ? "#F2F0E9" : "#16221F";
  const sub = dark ? "#9FB3AC" : "#5C6B66";
  const accent = "#1FAE5C";
  const border = dark ? "rgba(242,240,233,0.08)" : "rgba(22,34,31,0.08)";
  const panelBg = dark ? "#0B1F1C" : "#F2EFE7";
  const headerBg = dark ? "#13302B" : "#FDFBF6";
  const inputBg = dark ? "#0E2622" : "#FFFFFF";
  const rowHoverBg = dark ? "rgba(242,240,233,0.05)" : "rgba(22,34,31,0.035)";

  const filteredContacts = (contacts || []).filter((c) =>
    c.name?.toLowerCase().includes(query.toLowerCase())
  );

  const formatPreviewTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    return isToday
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: panelBg,
        color: ink,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        .hp-display { font-family: 'Space Grotesk', sans-serif; }
        .hp-row { transition: background 0.12s ease; }
        .hp-row:hover { background: ${rowHoverBg}; }
        .hp-icon-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 8px; padding: 7px; transition: background 0.12s ease; color: inherit; }
        .hp-icon-btn:hover { background: ${dark ? "rgba(242,240,233,0.08)" : "rgba(22,34,31,0.06)"}; }
        .hp-search:focus { outline: none; box-shadow: 0 0 0 3px rgba(31,174,92,0.18); }
        .hp-fade-in { animation: hpFadeIn 0.25s ease both; }
        @keyframes hpFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .hp-fade-in { animation: none !important; }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          background: headerBg,
          borderBottom: `1px solid ${border}`,
          padding: "16px 18px 14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h1 className="hp-display" style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.4 }}>
            Chats
          </h1>
          <div style={{ display: "flex", gap: 2 }}>
            <button className="hp-icon-btn" aria-label="Start a new chat">
              <MessageSquarePlus size={20} />
            </button>
            <button className="hp-icon-btn" aria-label="More options">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search
            size={16}
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: sub }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            className="hp-search"
            style={{
              width: "100%",
              padding: "9px 12px 9px 34px",
              borderRadius: 10,
              border: "none",
              background: inputBg,
              color: ink,
              fontSize: 13.5,
              fontFamily: "Inter, sans-serif",
            }}
          />
        </div>
      </div>

      {/* Contact list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {!contacts || contacts.length === 0 ? (
          <EmptyState ink={ink} sub={sub} accent={accent} message="No contacts yet. Start a conversation to see it here." />
        ) : filteredContacts.length === 0 ? (
          <EmptyState ink={ink} sub={sub} accent={accent} message={`No results for "${query}"`} />
        ) : (
          <AnimatePresence initial={false}>
            {filteredContacts.map((contact, index) => (
              <motion.div
                key={contact._id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileHover={{ scale: 1.0 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => setSelectedContact(contact)}
                className="hp-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 18px",
                  cursor: "pointer",
                  borderBottom: index < filteredContacts.length - 1 ? `1px solid ${border}` : "none",
                }}
              >
                {/* Avatar */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img
                    src={
                      contact.profilePic ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=1FAE5C&color=fff`
                    }
                    alt={contact.name}
                    style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }}
                  />
                  {contact.isOnline && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: -1,
                        right: -1,
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: accent,
                        border: `2px solid ${panelBg}`,
                      }}
                    />
                  )}
                </div>

                {/* Name + preview */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                    <h3
                      className="hp-display"
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        margin: 0,
                        letterSpacing: -0.1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {contact.name}
                    </h3>
                    {contact.lastMessageTime && (
                      <span style={{ fontSize: 11, color: sub, flexShrink: 0 }}>
                        {formatPreviewTime(contact.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: sub,
                      margin: "2px 0 0",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {contact.lastMessage || "Start a conversation"}
                  </p>
                </div>

                {/* Unread chip */}
                {contact.unreadCount > 0 && (
                  <span
                    style={{
                      flexShrink: 0,
                      minWidth: 20,
                      height: 20,
                      borderRadius: 10,
                      background: accent,
                      color: "#0B1F1C",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 6px",
                    }}
                  >
                    {contact.unreadCount > 99 ? "99+" : contact.unreadCount}
                  </span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

// Shared empty-state block — used both for "no contacts at all" and
// "search produced no matches", just with a different message.
const EmptyState = ({ ink, sub, accent, message }) => (
  <div
    className="hp-fade-in"
    style={{
      height: "100%",
      minHeight: 280,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      padding: "0 24px",
      textAlign: "center",
    }}
  >
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 5h16v10H9l-4 4v-4H4V5Z"
        stroke={sub}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
    <p style={{ fontSize: 13.5, color: sub, margin: 0, maxWidth: 220 }}>{message}</p>
  </div>
);

export default HomePage;