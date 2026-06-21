import React, { useState } from "react";
import {
  MessageCircle,
  Users,
  Settings,
  Moon,
  Sun,
  ArrowLeft,
} from "lucide-react";

import useThemeStore from "../store/useThemeStore";
import useLayoutStore from "../store/useLayoutStore";

/**
 * Sidebar — primary navigation rail
 * --------------------------------------------------------------
 * Visual language matches Login.jsx / ChatWindow.jsx / HomePage.jsx
 * / Layout.jsx: ink/paper palette, green accent. Signature touch:
 * the active nav item gets a left accent bar (echoes the "story
 * rail" step markers from the Login screen) instead of a generic
 * highlight box.
 * --------------------------------------------------------------
 * Wiring notes:
 * - `activeView` is local UI state for now — wire it to your
 *   router (e.g. useLocation) if Chats/Contacts/Settings map to
 *   real routes, or lift it up if another component needs to know
 *   which view is showing.
 */

const NAV_ITEMS = [
  { id: "chats", label: "Chats", icon: MessageCircle },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

const Sidebar = () => {
  const { theme, setTheme } = useThemeStore();
  const dark = theme === "dark";

  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const setSelectedContact = useLayoutStore((state) => state.setSelectedContact);

  const [activeView, setActiveView] = useState("chats");

  // ---- Theme tokens (mirrors Login.jsx / ChatWindow.jsx / HomePage.jsx) ----
  const ink = dark ? "#F2F0E9" : "#16221F";
  const sub = dark ? "#9FB3AC" : "#5C6B66";
  const accent = "#1FAE5C";
  const border = dark ? "rgba(242,240,233,0.10)" : "rgba(22,34,31,0.10)";
  const railBg = dark ? "#13302B" : "#FDFBF6";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: window.innerWidth < 768 ? "row" : "column",
        alignItems: "center",
        justifyContent: window.innerWidth < 768 ? "space-between" : "flex-start",
        gap: window.innerWidth < 768 ? 0 : 22,
        padding: window.innerWidth < 768 ? "10px 18px" : "22px 0",
        width: window.innerWidth < 768 ? "100%" : 76,
        height: window.innerWidth < 768 ? "auto" : "100%",
        background: railBg,
        borderRight: window.innerWidth < 768 ? "none" : `1px solid ${border}`,
        borderTop: window.innerWidth < 768 ? `1px solid ${border}` : "none",
        position: window.innerWidth < 768 ? "fixed" : "relative",
        bottom: window.innerWidth < 768 ? 0 : "auto",
        left: window.innerWidth < 768 ? 0 : "auto",
        zIndex: 40,
        flexShrink: 0,
        fontFamily: "Inter, sans-serif",
        color: ink,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap');
        .sb-display { font-family: 'Space Grotesk', sans-serif; }
        .sb-nav-btn { position: relative; background: none; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 9px 8px; border-radius: 10px; transition: background 0.15s ease, color 0.15s ease; }
        .sb-nav-btn:hover { background: rgba(128,128,128,0.10); }
        .sb-icon-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 10px; padding: 8px; transition: background 0.15s ease; }
        .sb-icon-btn:hover { background: rgba(128,128,128,0.10); }
        .sb-back-btn:hover { filter: brightness(1.08); }
      `}</style>

      {/* Logo (desktop only) */}
      <div style={{ display: window.innerWidth < 768 ? "none" : "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
        <div
          className="sb-display"
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: accent,
            color: "#0B1F1C",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          FC
        </div>
      </div>

      {/* Navigation */}
      <div
        style={{
          display: "flex",
          flexDirection: window.innerWidth < 768 ? "row" : "column",
          alignItems: "center",
          gap: window.innerWidth < 768 ? 28 : 14,
          flex: window.innerWidth < 768 ? "none" : 1,
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className="sb-nav-btn"
              onClick={() => setActiveView(item.id)}
              title={item.label}
              aria-label={item.label}
              aria-pressed={isActive}
              style={{ color: isActive ? accent : sub }}
            >
              {/* Active accent bar — desktop: left edge, mobile: under icon */}
              {isActive && window.innerWidth >= 768 && (
                <span
                  style={{
                    position: "absolute",
                    left: -14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 3,
                    height: 18,
                    borderRadius: 2,
                    background: accent,
                  }}
                />
              )}
              <Icon size={22} />
              {isActive && window.innerWidth < 768 && (
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: accent }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div
        style={{
          display: "flex",
          flexDirection: window.innerWidth < 768 ? "row" : "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        {selectedContact && window.innerWidth >= 768 && (
          <button
            onClick={() => setSelectedContact(null)}
            className="sb-back-btn"
            title="Back to chat list"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: "none",
              background: accent,
              color: "#0B1F1C",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={18} />
          </button>
        )}

        <button
          onClick={() => setTheme(dark ? "light" : "dark")}
          className="sb-icon-btn"
          aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
          title={dark ? "Switch to light theme" : "Switch to dark theme"}
          style={{ color: sub }}
        >
          {dark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;