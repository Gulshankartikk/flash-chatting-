import React, { useState } from "react";
import useThemeStore from "../../store/useThemeStore";
import useUserStore from "../../store/useUserStore";
import StatusSelector from "../../components/status/StatusSelector";

const Setting = () => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === "dark";

  const currentUser = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout?.();
    }
  };

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        "This will permanently delete your account. This action cannot be undone. Continue?"
      )
    ) {
      console.log("Account deletion triggered");
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0A0A0F] text-[#F0F0FF] font-sans">
      {/* Header */}
      <div className="p-4 border-b border-[#2A2A3D] bg-[#111118] flex items-center justify-between sticky top-0 z-10">
        <h2 className="text-xl font-bold">Settings</h2>
        <StatusSelector />
      </div>

      {/* Profile card */}
      <div className="flex items-center gap-4 p-4 border-b border-[#2A2A3D] bg-[#111118] hover:bg-[#1A1A26] transition-colors cursor-pointer">
        {currentUser?.profilePicture ? (
          <img
            src={currentUser.profilePicture}
            alt=""
            className="w-14 h-14 rounded-full object-cover border border-[#2A2A3D]"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#6C63FF] text-[#F0F0FF] flex items-center justify-center font-bold text-lg flex-shrink-0">
            {currentUser?.username?.charAt(0)?.toUpperCase() || "U"}
          </div>
        )}
        <div className="flex-1 min-w-0 text-left">
          <p className="font-semibold text-[#F0F0FF] truncate">
            {currentUser?.username || currentUser?.name || "Your name"}
          </p>
          <p className="text-xs text-[#9090B0] truncate mt-1">
            {currentUser?.about || "Hey there! I am using Flash Chat"}
          </p>
        </div>
        <span className="text-[#9090B0] text-lg font-bold">›</span>
      </div>

      {/* Account section */}
      <SectionLabel text="Account" />
      <SettingRow
        label="Phone number"
        value={currentUser?.phoneNumber ? `${currentUser?.phoneSuffix || ""} ${currentUser?.phoneNumber}` : "Not set"}
      />
      <SettingRow
        label="Email"
        value={currentUser?.email || "Not set"}
      />

      {/* Appearance */}
      <SectionLabel text="Appearance" />
      <ToggleRow
        label="Dark theme"
        checked={isDark}
        onChange={toggleTheme}
      />

      {/* Notifications */}
      <SectionLabel text="Notifications" />
      <ToggleRow
        label="Message notifications"
        checked={notificationsEnabled}
        onChange={() => setNotificationsEnabled((prev) => !prev)}
      />

      {/* Privacy */}
      <SectionLabel text="Privacy" />
      <ToggleRow
        label="Read receipts"
        checked={readReceipts}
        onChange={() => setReadReceipts((prev) => !prev)}
      />
      <ToggleRow
        label="Show online status"
        checked={showOnlineStatus}
        onChange={() => setShowOnlineStatus((prev) => !prev)}
      />

      {/* Help */}
      <SectionLabel text="Help" />
      <SettingRow label="App version" value="1.0.0" arrow={false} />

      {/* Danger zone */}
      <div className="mt-6 border-t border-[#2A2A3D] bg-[#111118]">
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-3.5 border-b border-[#2A2A3D] text-[#FF6584] hover:bg-[#1A1A26] font-semibold text-sm transition-colors"
        >
          Logout
        </button>
        <button
          onClick={handleDeleteAccount}
          className="w-full text-left px-4 py-3.5 text-[#FF3D71] hover:bg-[#1A1A26] font-semibold text-sm transition-colors"
        >
          Delete account
        </button>
      </div>
    </div>
  );
};

const SectionLabel = ({ text }) => (
  <p className="px-4 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9090B0] text-left">
    {text}
  </p>
);

const SettingRow = ({ label, value, arrow = true }) => (
  <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#2A2A3D] bg-[#111118]">
    <span className="text-sm text-[#F0F0FF]">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#9090B0]">{value}</span>
      {arrow && <span className="text-[#9090B0] text-sm">›</span>}
    </div>
  </div>
);

const ToggleRow = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#2A2A3D] bg-[#111118]">
    <span className="text-sm text-[#F0F0FF]">{label}</span>
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      className={`w-10 h-6 rounded-full relative transition-colors ${
        checked ? "bg-[#00E676]" : "bg-[#2A2A3D]"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

export default Setting;