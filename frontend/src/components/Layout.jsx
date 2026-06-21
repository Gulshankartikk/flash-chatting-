import React, { useEffect, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";

import useLayoutStore from "../store/useLayoutStore";
import useThemeStore from "../store/useThemeStore";

/**
 * Layout — app shell
 * --------------------------------------------------------------
 * Visual language matches Login.jsx / ChatWindow.jsx / HomePage.jsx:
 * ink/paper palette, Space Grotesk for dialog headers, Inter for
 * body text, green accent. This file owns the overall page
 * background and the two overlay dialogs (theme settings, status
 * preview) — the chat list / chat window panels keep their own
 * styling from HomePage.jsx and ChatWindow.jsx.
 * --------------------------------------------------------------
 * Note: Sidebar.jsx still uses its previous styling — only this
 * shell and its dialogs were restyled, by request.
 */

const Layout = ({
  children,
  isThemeDialogOpen,
  toggleDialog,
  isStatusPreviewOpen,
  statusPreviewContent,
}) => {
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const setSelectedContact = useLayoutStore((state) => state.setSelectedContact);

  const location = useLocation();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { theme, setTheme } = useThemeStore();
  const dark = theme === "dark";

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // ---- Theme tokens (mirrors Login.jsx / ChatWindow.jsx / HomePage.jsx) ----
  const ink = dark ? "#F2F0E9" : "#16221F";
  const sub = dark ? "#9FB3AC" : "#5C6B66";
  const accent = "#1FAE5C";
  const border = dark ? "rgba(242,240,233,0.10)" : "rgba(22,34,31,0.10)";
  const panelBg = dark ? "#0B1F1C" : "#F2EFE7";
  const dialogBg = dark ? "#13302B" : "#FDFBF6";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        position: "relative",
        background: panelBg,
        color: ink,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        .lo-display { font-family: 'Space Grotesk', sans-serif; }
        .lo-fade-in { animation: loFadeIn 0.2s ease both; }
        @keyframes loFadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .lo-theme-option { transition: background 0.12s ease, border-color 0.12s ease; }
        .lo-theme-option:hover { filter: brightness(1.05); }
        .lo-close-btn:hover { filter: brightness(1.08); }
        @media (prefers-reduced-motion: reduce) {
          .lo-fade-in { animation: none !important; }
        }
      `}</style>

      {!isMobile && <Sidebar />}

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          overflow: "hidden",
        }}
      >
        <AnimatePresence initial={false}>
          {(!selectedContact || !isMobile) && (
            <motion.div
              key="chatlist"
              initial={{ x: isMobile ? "-100%" : 0 }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween" }}
              style={{
                width: isMobile ? "100%" : "40%",
                height: "100%",
                paddingBottom: isMobile ? 64 : 0,
                borderRight: !isMobile ? `1px solid ${border}` : "none",
              }}
            >
              {children}
            </motion.div>
          )}

          {selectedContact && (
            <motion.div
              key="chatwindow"
              initial={{ x: isMobile ? "100%" : 0 }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween" }}
              style={{ width: "100%", height: "100%" }}
            >
              <ChatWindow
                selectedContact={selectedContact}
                setSelectedContact={setSelectedContact}
                isMobile={isMobile}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {isMobile && <Sidebar />}
      </div>

      {/* Theme Dialog */}
      {isThemeDialogOpen && (
        <div
          className="lo-fade-in"
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(11,31,28,0.55)",
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            style={{
              background: dialogBg,
              color: ink,
              borderRadius: 16,
              padding: 28,
              maxWidth: 360,
              width: "100%",
              boxShadow: dark
                ? "0 30px 70px -20px rgba(0,0,0,0.6)"
                : "0 30px 70px -20px rgba(22,34,31,0.25)",
            }}
          >
            <h2 className="lo-display" style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", letterSpacing: -0.3 }}>
              Appearance
            </h2>
            <p style={{ fontSize: 13, color: sub, margin: "0 0 18px" }}>
              Choose how flashchat looks on this device.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => setTheme("light")}
                className="lo-theme-option"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1.5px solid ${theme === "light" ? accent : border}`,
                  background: theme === "light" ? `${accent}14` : "transparent",
                  color: ink,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Light
                {theme === "light" && <Dot color={accent} />}
              </button>

              <button
                onClick={() => setTheme("dark")}
                className="lo-theme-option"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1.5px solid ${theme === "dark" ? accent : border}`,
                  background: theme === "dark" ? `${accent}14` : "transparent",
                  color: ink,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Dark
                {theme === "dark" && <Dot color={accent} />}
              </button>
            </div>

            <button
              onClick={toggleDialog}
              className="lo-close-btn"
              style={{
                marginTop: 20,
                width: "100%",
                padding: "11px 0",
                borderRadius: 10,
                border: "none",
                background: accent,
                color: "#0B1F1C",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Status Preview */}
      {isStatusPreviewOpen && (
        <div
          className="lo-fade-in"
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(11,31,28,0.85)",
            zIndex: 50,
            padding: 16,
          }}
        >
          <div style={{ maxWidth: 480, width: "100%", padding: 16 }}>
            {statusPreviewContent}
          </div>
        </div>
      )}
    </div>
  );
};

// Small filled dot used as a "selected" marker in the theme dialog —
// quieter than a checkmark icon, reads as an inline status indicator.
const Dot = ({ color }) => (
  <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
);

export default Layout;