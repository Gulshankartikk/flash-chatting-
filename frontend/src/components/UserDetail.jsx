import React from "react";
import { ArrowLeft, Phone, Mail, MapPin, MessageCircle } from "lucide-react";

import useLayoutStore from "../store/useLayoutStore";
import useThemeStore from "../store/useThemeStore";

/**
 * UserDetail — contact profile panel
 * --------------------------------------------------------------
 * Visual language matches Login.jsx / ChatWindow.jsx / HomePage.jsx
 * / Layout.jsx / Sidebar.jsx: ink/paper palette, Space Grotesk for
 * the name, Inter for body text, green accent. Signature touch:
 * the bio reads as a quoted line under the name (like a caption
 * under a portrait), and contact details sit in quiet info rows
 * with a left icon chip instead of plain inline icons.
 */

const UserDetail = () => {
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const setSelectedContact = useLayoutStore((state) => state.setSelectedContact);
  const { theme } = useThemeStore();
  const dark = theme === "dark";

  // ---- Theme tokens (mirrors the rest of the app) ----
  const ink = dark ? "#F2F0E9" : "#16221F";
  const sub = dark ? "#9FB3AC" : "#5C6B66";
  const accent = "#1FAE5C";
  const border = dark ? "rgba(242,240,233,0.10)" : "rgba(22,34,31,0.10)";
  const panelBg = dark ? "#0B1F1C" : "#F2EFE7";
  const headerBg = dark ? "#13302B" : "#FDFBF6";
  const rowBg = dark ? "#13302B" : "#FFFFFF";

  if (!selectedContact) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          background: panelBg,
          color: sub,
          fontFamily: "Inter, sans-serif",
        }}
      >
        <ChatGlyph color={sub} />
        <p style={{ fontSize: 14, margin: 0 }}>Select a contact to view their details</p>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: panelBg,
        color: ink,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        .ud-display { font-family: 'Space Grotesk', sans-serif; }
        .ud-icon-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 10px; padding: 8px; transition: background 0.12s ease; color: inherit; }
        .ud-icon-btn:hover { background: ${dark ? "rgba(242,240,233,0.08)" : "rgba(22,34,31,0.06)"}; }
        .ud-action-btn:hover { filter: brightness(1.06); }
        .ud-action-secondary:hover { background: ${dark ? "rgba(242,240,233,0.06)" : "rgba(22,34,31,0.05)"}; }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          background: headerBg,
          borderBottom: `1px solid ${border}`,
        }}
      >
        <button
          className="ud-icon-btn"
          onClick={() => setSelectedContact(null)}
          aria-label="Close contact details"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="ud-display" style={{ fontSize: 17, fontWeight: 600, margin: 0, letterSpacing: -0.2 }}>
          Contact info
        </h2>
      </div>

      {/* Profile */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "36px 24px 28px",
          textAlign: "center",
        }}
      >
        <div style={{ position: "relative" }}>
          <img
            src={
              selectedContact.profilePic ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedContact.name)}&background=1FAE5C&color=fff`
            }
            alt={selectedContact.name}
            style={{
              width: 116,
              height: 116,
              borderRadius: "50%",
              objectFit: "cover",
              border: `3px solid ${accent}`,
            }}
          />
          {selectedContact.isOnline && (
            <span
              style={{
                position: "absolute",
                bottom: 4,
                right: 4,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: accent,
                border: `3px solid ${panelBg}`,
              }}
            />
          )}
        </div>

        <h3 className="ud-display" style={{ fontSize: 24, fontWeight: 700, margin: "16px 0 0", letterSpacing: -0.3 }}>
          {selectedContact.name}
        </h3>

        <p style={{ fontSize: 13.5, color: sub, margin: "4px 0 0" }}>
          {selectedContact.isOnline ? (
            <span style={{ color: accent, fontWeight: 600 }}>Online</span>
          ) : (
            "Offline"
          )}
        </p>

        {selectedContact.bio && (
          <p
            style={{
              fontSize: 14,
              color: sub,
              margin: "16px 0 0",
              maxWidth: 280,
              lineHeight: 1.5,
              fontStyle: "italic",
            }}
          >
            "{selectedContact.bio}"
          </p>
        )}
      </div>

      {/* Details */}
      <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        <p
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: sub,
            margin: "0 4px 2px",
          }}
        >
          Contact details
        </p>

        <InfoRow icon={Phone} label="Phone" value={selectedContact.phone} rowBg={rowBg} ink={ink} sub={sub} accent={accent} />
        <InfoRow icon={Mail} label="Email" value={selectedContact.email} rowBg={rowBg} ink={ink} sub={sub} accent={accent} />
        <InfoRow icon={MapPin} label="Location" value={selectedContact.location} rowBg={rowBg} ink={ink} sub={sub} accent={accent} />
      </div>

      {/* Actions */}
      <div style={{ padding: "24px 18px 28px", display: "flex", gap: 10 }}>
        <button
          className="ud-action-btn"
          onClick={() => setSelectedContact(selectedContact)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "12px 0",
            borderRadius: 12,
            border: "none",
            background: accent,
            color: "#0B1F1C",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <MessageCircle size={17} />
          Message
        </button>

        <button
          className="ud-action-secondary"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "12px 0",
            borderRadius: 12,
            border: `1.5px solid ${border}`,
            background: "transparent",
            color: ink,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <Phone size={16} />
          Call
        </button>
      </div>
    </div>
  );
};

// One contact-detail row: icon chip on the left, label + value stacked
// on the right. Falls back to a quiet "Not added" instead of the
// slightly alarming "Not Available" when a field is missing.
const InfoRow = ({ icon: Icon, label, value, rowBg, ink, sub, accent }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 14px",
      borderRadius: 12,
      background: rowBg,
    }}
  >
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: `${accent}1a`,
        color: accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={17} />
    </div>
    <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: 11, color: sub, margin: 0, fontWeight: 600, letterSpacing: 0.3 }}>{label}</p>
      <p
        style={{
          fontSize: 14,
          color: value ? ink : sub,
          margin: "1px 0 0",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value || "Not added"}
      </p>
    </div>
  </div>
);

// Inline glyph reused from ChatWindow's empty state for visual consistency.
const ChatGlyph = ({ color }) => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 5h16v10H9l-4 4v-4H4V5Z"
      stroke={color}
      strokeWidth="1.6"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

export default UserDetail;