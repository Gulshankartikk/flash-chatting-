import React from "react";
import { MessageCircle, Users, Settings, Moon, Sun, ArrowLeft, LogOut } from "lucide-react";
import useThemeStore from "../store/useThemeStore";
import useLayoutStore from "../store/useLayoutStore";
import useUserStore from "../store/useUserStore";

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

  const activeView = useLayoutStore((state) => state.activeView);
  const setActiveView = useLayoutStore((state) => state.setActiveView);

  const currentUser = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);

  const isMobileWidth = window.innerWidth < 768;

  const initials = (currentUser?.username || currentUser?.name || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <div
      className={`flex z-40 flex-shrink-0 font-sans ${
        isMobileWidth
          ? "flex-row w-full justify-between items-center px-6 py-2.5 fixed bottom-0 left-0 border-t border-slate-200 dark:border-[#2A2A3D] bg-white dark:bg-[#111118]"
          : "flex-col w-20 h-full items-center py-6 border-r border-slate-200 dark:border-[#2A2A3D] bg-white dark:bg-[#111118] gap-6"
      }`}
    >
      {/* Profile avatar (desktop only) — tap to open Settings */}
      {!isMobileWidth && (
        <button
          onClick={() => setActiveView("settings")}
          className="relative group transition-transform duration-150 hover:scale-105"
          title={currentUser?.username || currentUser?.name || "Your profile"}
        >
          {currentUser?.profilePicture ? (
            <img
              src={currentUser.profilePicture}
              alt=""
              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-[#2A2A3D]"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#6C63FF] text-white flex items-center justify-center font-bold text-base border border-slate-200 dark:border-[#2A2A3D]">
              {initials}
            </div>
          )}
          {/* Pulsing cyan dot for online users */}
          {currentUser?.isOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00D4FF] border-2 border-white dark:border-[#111118] animate-pulse" />
          )}
        </button>
      )}

      {/* Navigation Icons */}
      <div
        className={`flex items-center gap-1 ${
          isMobileWidth ? "flex-row w-full justify-around" : "flex-col w-full flex-1 gap-3"
        }`}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`relative p-3 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ${
                isActive
                  ? "text-[#6C63FF] bg-[#6C63FF]/10 scale-105"
                  : "text-slate-400 dark:text-[#9090B0] hover:text-slate-700 dark:hover:text-[#F0F0FF] hover:bg-slate-100 dark:hover:bg-[#1A1A26]"
              }`}
              title={item.label}
            >
              <Icon size={20} />
              {/* Active bar (desktop: left edge indicator, mobile: small bottom dot) */}
              {isActive && !isMobileWidth && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#6C63FF] rounded-r-full shadow-[0_0_8px_#6C63FF]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div
        className={`flex items-center gap-2 ${
          isMobileWidth ? "flex-row" : "flex-col"
        }`}
      >
        {selectedContact && !isMobileWidth && (
          <button
            onClick={() => setSelectedContact(null)}
            className="p-2.5 bg-[#6C63FF] hover:bg-[#5b52e6] text-white rounded-xl shadow-lg transition-transform duration-150 active:scale-95"
            title="Back to list"
          >
            <ArrowLeft size={16} />
          </button>
        )}

        <button
          onClick={() => setTheme(dark ? "light" : "dark")}
          className="p-2.5 hover:bg-slate-100 dark:hover:bg-[#1A1A26] rounded-xl text-slate-400 dark:text-[#9090B0] hover:text-slate-700 dark:hover:text-[#F0F0FF] transition-colors"
          title={dark ? "Switch to light" : "Switch to dark"}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {!isMobileWidth && (
          <button
            onClick={() => logout && logout()}
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-[#1A1A26] rounded-xl text-[#FF6584] hover:text-[#ff5475] transition-colors mt-2"
            title="Log out"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;