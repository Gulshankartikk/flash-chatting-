import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

/**
 * FlashChat — Login
 * --------------------------------------------------------------
 * Design notes (see accompanying message for full rationale):
 * - Ink/paper palette instead of generic green-blue gradient
 * - Space Grotesk (display) + Inter (body) pairing
 * - Left "story rail" replaces decorative step dots — it's a real
 *   sequence (phone -> verify -> profile) so structure = information
 * - One orchestrated entrance per step, OTP pop-in, success draw-on
 * --------------------------------------------------------------
 * Wiring notes for your real app:
 * - Swap MOCK_MODE to false and point API_BASE at your server
 * - axios calls are written inline (commented) where MOCK_MODE branches
 * - Replace useUserStore / useLoginStore / useThemeStore mocks below
 *   with your actual Zustand stores — same method names are used so
 *   this drops back into your codebase with minimal changes
 */

// ---------------------------------------------------------------
// Mock stores (replace with your real Zustand stores in production)
// ---------------------------------------------------------------
function useLoginStoreMock() {
  const [step, setStep] = useState(1);
  const [userPhoneData, setUserPhoneData] = useState(null);
  const resetLoginState = () => {
    setStep(1);
    setUserPhoneData(null);
  };
  return { step, setStep, userPhoneData, setUserPhoneData, resetLoginState };
}

function useThemeStoreMock() {
  const [theme, setTheme] = useState("dark");
  return { theme, setTheme };
}

function useUserStoreMock() {
  const [user, setUserState] = useState(null);
  const [token, setTokenState] = useState(null);
  const setUser = (u) => setUserState(u);
  const setToken = (t) => setTokenState(t);
  return { user, token, setUser, setToken };
}

const MOCK_MODE = false;
// eslint-disable-next-line no-unused-vars -- kept for clarity even though API_BASE is used directly below
const API_BASE = "http://localhost:8000/api/auth";

const countries = [
  { alpha2: "US", dialCode: "+1", flag: "🇺🇸", name: "United States" },
  { alpha2: "IN", dialCode: "+91", flag: "🇮🇳", name: "India" },
  { alpha2: "GB", dialCode: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { alpha2: "AE", dialCode: "+971", flag: "🇦🇪", name: "UAE" },
  { alpha2: "AU", dialCode: "+61", flag: "🇦🇺", name: "Australia" },
  { alpha2: "DE", dialCode: "+49", flag: "🇩🇪", name: "Germany" },
  { alpha2: "FR", dialCode: "+33", flag: "🇫🇷", name: "France" },
  { alpha2: "BR", dialCode: "+55", flag: "🇧🇷", name: "Brazil" },
  { alpha2: "JP", dialCode: "+81", flag: "🇯🇵", name: "Japan" },
  { alpha2: "NG", dialCode: "+234", flag: "🇳🇬", name: "Nigeria" },
];

const avatars = [
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Mimi",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Jasper",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Luna",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Zoe",
];

const STEPS = [
  { id: 1, label: "Phone or email", icon: "phone" },
  { id: 2, label: "Verify code", icon: "shield" },
  { id: 3, label: "Set up profile", icon: "user" },
];

// ---------------------------------------------------------------
// Tiny inline icon set (no external icon lib needed in artifact)
// ---------------------------------------------------------------
const Icon = ({ name, className = "w-5 h-5" }) => {
  const paths = {
    phone: "M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11 11 0 0 0 3.4.55 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11 11 0 0 0 .55 3.4 1 1 0 0 1-.25 1z",
    shield: "M12 2 4 5v6c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V5z",
    user: "M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5Z",
    arrowLeft: "M19 12H5m6-7-7 7 7 7",
    sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 2v2m0 16v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M2 12h2m16 0h2M4.2 19.8l1.4-1.4m12.8-12.8 1.4-1.4",
    moon: "M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z",
    upload: "M12 16V4m0 0-4 4m4-4 4 4M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3",
    check: "M5 12.5 10 17l9-10",
    refresh: "M4 4v5h5M20 20v-5h-5M4.5 9a8 8 0 0 1 14.6-3M19.5 15a8 8 0 0 1-14.6 3",
    alert: "M12 9v4m0 4h.01M10.3 3.9 2 18a1 1 0 0 0 .9 1.5h18.2A1 1 0 0 0 22 18L13.7 3.9a1 1 0 0 0-1.7 0Z",
    spinner: "M12 2a10 10 0 1 0 10 10",
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d={paths[name]}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// ---------------------------------------------------------------
// Main component
// ---------------------------------------------------------------
export default function Login() {
  const { step, setStep, userPhoneData, setUserPhoneData, resetLoginState } =
    useLoginStoreMock();
  const { theme, setTheme } = useThemeStoreMock();
  const { setUser, setToken } = useUserStoreMock();

  const dark = theme === "dark";
  const toggleTheme = () => setTheme(dark ? "light" : "dark");

  // ---- Step 1 state ----
  const [loginMethod, setLoginMethod] = useState("phone"); // 'phone' | 'email'
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});

  const switchLoginMethod = (method) => {
    setFieldErrors({});
    setError("");
    if (method === "phone") {
      setEmail(""); // clear the unused field
    } else {
      setPhoneNumber("");
    }
    setLoginMethod(method);
  };

  // ---- Step 2 state ----
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef([]);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [resending, setResending] = useState(false);

  // ---- Step 3 state ----
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [agreed, setAgreed] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ---- shared ----
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Resend cooldown ticker
  useEffect(() => {
    if (step !== 2 || resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [step, resendCooldown]);

  // Debounced username availability check
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameStatus(null);
      return;
    }
    setUsernameStatus("checking");
    const t = setTimeout(() => {
      // MOCK: a few names are "taken" so the UI has something to show
      const taken = ["admin", "test", "flashchat", "support"];
      setUsernameStatus(
        taken.includes(username.toLowerCase()) ? "taken" : "available"
      );
    }, 600);
    return () => clearTimeout(t);
  }, [username]);

  const filteredCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dialCode.includes(countrySearch)
  );

  // ---------------- Step 1 submit ----------------
  const validateStepOne = () => {
    const errs = {};
    if (loginMethod === "phone") {
      if (!phoneNumber) {
        errs.phoneNumber = "Enter your phone number.";
      } else if (!/^\d{6,14}$/.test(phoneNumber)) {
        errs.phoneNumber = "Enter a valid phone number.";
      }
    } else {
      if (!email) {
        errs.email = "Enter your email address.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errs.email = "Enter a valid email address.";
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateStepOne()) return;
    setLoading(true);
    try {
      const payload =
        loginMethod === "phone"
          ? { phoneNumber, phoneSuffix: selectedCountry.dialCode, email: null, rememberDevice }
          : { phoneNumber: null, phoneSuffix: null, email, rememberDevice };

      if (MOCK_MODE) {
        await new Promise((r) => setTimeout(r, 700));
      } else {
        await axios.post(`${API_BASE}/send-otp`, payload, { withCredentials: true });
      }

      setUserPhoneData(payload);
      setResendCooldown(30);
      setStep(2);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Step 2: OTP ----------------
  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = pasted.split("");
    while (next.length < 6) next.push("");
    setOtp(next);
    const lastIndex = Math.min(pasted.length, 6) - 1;
    otpRefs.current[lastIndex >= 0 ? lastIndex : 0]?.focus();
  };

  const onOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Enter all 6 digits.");
      return;
    }
    setLoading(true);
    try {
      if (MOCK_MODE) {
        await new Promise((r) => setTimeout(r, 700));
        if (code === "111111") throw new Error("mock-invalid");
      } else {
        // Backend returns 400 on invalid/expired OTP and 200 on success —
        // axios throws on the 400, so we don't need to also inspect a
        // status string in the body. The catch block below handles it.
        await axios.post(
          `${API_BASE}/verify-otp`,
          { ...userPhoneData, otp: code },
          { withCredentials: true }
        );
      }
      setStep(3);
    } catch (err) {
      setError("That code didn't match. Check it and try again.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    setError("");
    try {
      if (MOCK_MODE) {
        await new Promise((r) => setTimeout(r, 600));
      } else {
        await axios.post(`${API_BASE}/send-otp`, userPhoneData, { withCredentials: true });
      }
      setResendCooldown(30);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setResending(false);
    }
  };

  // ---------------- Step 3: profile ----------------
  const validateAndSetFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Profile picture must be an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }
    setError("");
    setProfilePictureFile(file);
    setProfilePicture(URL.createObjectURL(file));
  };

  const handleFileInput = (e) => validateAndSetFile(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    validateAndSetFile(e.dataTransfer.files?.[0]);
  };

  const onProfileSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim()) {
      setError("Choose a username to continue.");
      return;
    }
    if (usernameStatus === "taken") {
      setError("That username is already taken.");
      return;
    }
    if (!agreed) {
      setError("You need to agree to the Terms and Privacy Policy.");
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append("username", username.trim());
      formData.append("agreed", agreed);
      if (profilePictureFile) {
        // field name must match the multer field name on the backend route
        formData.append("profilePicture", profilePictureFile);
      } else {
        // no file chosen — sending the avatar URL as a plain field,
        // matching `req.body.profilePicture` in updateProfile
        formData.append("profilePicture", selectedAvatar);
      }

      if (MOCK_MODE) {
        // simulate upload progress for the multipart request
        for (let p = 20; p <= 100; p += 20) {
          await new Promise((r) => setTimeout(r, 150));
          setUploadProgress(p);
        }
        setUser({
          username: username.trim(),
          profilePicture: profilePicture || selectedAvatar,
          phoneNumber: userPhoneData?.phoneNumber,
          email: userPhoneData?.email,
        });
        setToken("mock-jwt-token");
      } else {
        // withCredentials is required: updateProfile reads req.user.userId
        // from auth middleware, which depends on the auth_token cookie
        // set during verify-otp. Without this the request has no identity
        // and the backend can't find the user to update.
        const res = await axios.put(`${API_BASE}/update-profile`, formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (evt) =>
            setUploadProgress(Math.round((evt.loaded / evt.total) * 100)),
        });
        // updateProfile returns the updated user in the response body —
        // exact nesting depends on your responseHandler util, so this
        // checks the common shapes defensively instead of assuming one.
        const updatedUser = res.data?.data ?? res.data?.user ?? res.data;
        setUser(updatedUser);
      }

      setSuccess(true);
      setTimeout(() => {
        resetLoginState();
        // navigate("/"); // react-router navigate goes here
      }, 1800);
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't create your profile. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setError("");
    // Leaving the OTP step: restore step 1 with what was actually sent,
    // so the person edits their existing number/email instead of
    // retyping it from scratch.
    if (step === 2 && userPhoneData) {
      if (userPhoneData.phoneNumber) {
        const match = countries.find((c) => c.dialCode === userPhoneData.phoneSuffix);
        if (match) setSelectedCountry(match);
        setPhoneNumber(userPhoneData.phoneNumber);
        setLoginMethod("phone");
      } else {
        setPhoneNumber("");
        setEmail(userPhoneData.email || "");
        setLoginMethod("email");
      }
      setOtp(["", "", "", "", "", ""]);
      setResendCooldown(0);
    }
    setStep(Math.max(1, step - 1));
  };

  // Explicit "change number / email" action from the OTP screen.
  // Same restore behavior as goBack, kept as its own handler so the
  // button label and intent stay clear in the UI.
  const changeContact = () => goBack();

  // ---------------- Theme tokens ----------------
  const bg = dark ? "#0B1F1C" : "#F2EFE7";
  const cardBg = dark ? "#13302B" : "#FDFBF6";
  const ink = dark ? "#F2F0E9" : "#16221F";
  const sub = dark ? "#9FB3AC" : "#5C6B66";
  const railBg = dark ? "#0E2622" : "#16332D";
  const accent = "#1FAE5C";
  const amber = "#F4A623";
  const danger = "#E5604A";
  const border = dark ? "rgba(242,240,233,0.12)" : "rgba(22,34,31,0.12)";
  const inputBg = dark ? "#0E2622" : "#FFFFFF";

  return (
    <div
      style={{
        background: bg,
        minHeight: "100vh",
        fontFamily: "Inter, system-ui, sans-serif",
        color: ink,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        transition: "background 0.4s ease",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .fc-display { font-family: 'Space Grotesk', sans-serif; }
        .fc-fade-in { animation: fcFadeIn 0.45s ease both; }
        @keyframes fcFadeIn { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
        .fc-pop { animation: fcPop 0.25s cubic-bezier(.34,1.56,.64,1) both; }
        @keyframes fcPop { from { transform: scale(0.6); opacity:0.4; } to { transform: scale(1); opacity:1; } }
        .fc-spin { animation: fcSpin 0.9s linear infinite; }
        @keyframes fcSpin { to { transform: rotate(360deg); } }
        .fc-input:focus { outline: none; box-shadow: 0 0 0 3px ${accent}33; border-color: ${accent} !important; }
        .fc-otp:focus { outline: none; box-shadow: 0 0 0 3px ${amber}40; border-color: ${amber} !important; }
        .fc-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
        .fc-btn-primary:not(:disabled):hover { filter: brightness(1.07); }
        .fc-rail-item { transition: opacity 0.3s ease; }
        .fc-check-draw { stroke-dasharray: 40; stroke-dashoffset: 40; animation: fcDraw 0.6s ease forwards 0.2s; }
        @keyframes fcDraw { to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .fc-fade-in, .fc-pop, .fc-spin, .fc-check-draw { animation: none !important; }
        }
        @media (max-width: 720px) {
          .fc-rail { display: none !important; }
        }
        ::placeholder { color: ${sub}; opacity: 0.8; }
      `}</style>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: `1px solid ${border}`,
          background: cardBg,
          color: ink,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <Icon name={dark ? "sun" : "moon"} className="w-4 h-4" />
      </button>

      <div
        className="fc-fade-in"
        style={{
          display: "flex",
          width: "100%",
          maxWidth: 880,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: dark
            ? "0 30px 70px -20px rgba(0,0,0,0.6)"
            : "0 30px 70px -20px rgba(22,34,31,0.25)",
        }}
      >
        {/* ---- Story rail (signature element) ---- */}
        <div
          className="fc-rail"
          style={{
            background: railBg,
            width: 220,
            flexShrink: 0,
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 40,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  background: accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="check" className="w-3.5 h-3.5" />
              </div>
              <span
                className="fc-display"
                style={{ color: "#F2F0E9", fontWeight: 700, fontSize: 16, letterSpacing: -0.3 }}
              >
                flashchat
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {STEPS.map((s) => {
                const stateActive = s.id === step;
                const stateDone = s.id < step;
                return (
                  <div
                    key={s.id}
                    className="fc-rail-item"
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      opacity: stateActive ? 1 : stateDone ? 0.85 : 0.4,
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: stateDone
                          ? accent
                          : stateActive
                          ? "rgba(31,174,92,0.18)"
                          : "transparent",
                        border: stateActive ? `1.5px solid ${accent}` : `1.5px solid rgba(242,240,233,0.25)`,
                        color: stateDone ? "#0B1F1C" : "#F2F0E9",
                      }}
                    >
                      {stateDone ? (
                        <Icon name="check" className="w-3 h-3" />
                      ) : (
                        <Icon name={s.icon} className="w-3 h-3" />
                      )}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10.5,
                          textTransform: "uppercase",
                          letterSpacing: 0.6,
                          color: "#8FA39C",
                          marginBottom: 2,
                        }}
                      >
                        Step {s.id}
                      </div>
                      <div style={{ fontSize: 13.5, color: "#F2F0E9", fontWeight: 500 }}>
                        {s.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p style={{ fontSize: 11.5, color: "#6E837C", lineHeight: 1.5 }}>
            Your number stays private. Only people you message can see it.
          </p>
        </div>

        {/* ---- Form panel ---- */}
        <div
          style={{
            background: cardBg,
            flex: 1,
            padding: "40px 40px",
            position: "relative",
            minWidth: 0,
          }}
        >
          {step > 1 && !success && (
            <button
              onClick={goBack}
              aria-label="Go back"
              style={{
                position: "absolute",
                top: 28,
                left: 28,
                background: "none",
                border: "none",
                color: sub,
                cursor: "pointer",
                display: "flex",
              }}
            >
              <Icon name="arrowLeft" className="w-4.5 h-4.5" />
            </button>
          )}

          {success ? (
            <SuccessView ink={ink} sub={sub} accent={accent} username={username} />
          ) : (
            <div key={step} className="fc-fade-in" style={{ paddingTop: step > 1 ? 28 : 0 }}>
              <h1
                className="fc-display"
                style={{ fontSize: 26, fontWeight: 700, marginBottom: 6, letterSpacing: -0.4 }}
              >
                {step === 1 && "Let's get you in"}
                {step === 2 && "Check your messages"}
                {step === 3 && "Make it yours"}
              </h1>
              <p style={{ color: sub, fontSize: 14, marginBottom: 28 }}>
                {step === 1 && (loginMethod === "phone"
                  ? "Enter your phone number to get a code."
                  : "Enter your email to get a code.")}
                {step === 2 && (
                  <>
                    We sent a 6-digit code to{" "}
                    <strong style={{ color: ink }}>
                      {userPhoneData?.phoneNumber
                        ? `${userPhoneData.phoneSuffix}${userPhoneData.phoneNumber}`
                        : userPhoneData?.email}
                    </strong>
                  </>
                )}
                {step === 3 && "Pick a name and a face for your account."}
              </p>

              {error && (
                <div
                  className="fc-pop"
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                    background: `${danger}14`,
                    border: `1px solid ${danger}40`,
                    color: danger,
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 13,
                    marginBottom: 18,
                  }}
                >
                  <Icon name="alert" className="w-4 h-4" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{error}</span>
                </div>
              )}

              {step === 1 && (
                <StepOne
                  {...{
                    loginMethod,
                    switchLoginMethod,
                    selectedCountry,
                    setSelectedCountry,
                    phoneNumber,
                    setPhoneNumber,
                    email,
                    setEmail,
                    countryOpen,
                    setCountryOpen,
                    countrySearch,
                    setCountrySearch,
                    filteredCountries,
                    rememberDevice,
                    setRememberDevice,
                    fieldErrors,
                    onLoginSubmit,
                    loading,
                    inputBg,
                    border,
                    ink,
                    sub,
                    accent,
                    danger,
                  }}
                />
              )}

              {step === 2 && (
                <StepTwo
                  {...{
                    otp,
                    otpRefs,
                    handleOtpChange,
                    handleOtpKeyDown,
                    handleOtpPaste,
                    onOtpSubmit,
                    loading,
                    resendCooldown,
                    resending,
                    handleResend,
                    inputBg,
                    border,
                    ink,
                    sub,
                    amber,
                    accent,
                    userPhoneData,
                    changeContact,
                  }}
                />
              )}

              {step === 3 && (
                <StepThree
                  {...{
                    username,
                    setUsername,
                    usernameStatus,
                    agreed,
                    setAgreed,
                    profilePicture,
                    selectedAvatar,
                    setSelectedAvatar,
                    setProfilePicture,
                    setProfilePictureFile,
                    dragActive,
                    setDragActive,
                    handleDrop,
                    handleFileInput,
                    onProfileSubmit,
                    loading,
                    uploadProgress,
                    inputBg,
                    border,
                    ink,
                    sub,
                    accent,
                    amber,
                    danger,
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =================================================================
// Step 1 — phone / email
// =================================================================
function StepOne({
  loginMethod,
  switchLoginMethod,
  selectedCountry,
  setSelectedCountry,
  phoneNumber,
  setPhoneNumber,
  email,
  setEmail,
  countryOpen,
  setCountryOpen,
  countrySearch,
  setCountrySearch,
  filteredCountries,
  rememberDevice,
  setRememberDevice,
  fieldErrors,
  onLoginSubmit,
  loading,
  inputBg,
  border,
  ink,
  sub,
  accent,
  danger,
}) {
  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: `1.5px solid ${border}`,
    background: inputBg,
    color: ink,
    fontSize: 14.5,
    fontFamily: "Inter, sans-serif",
  };

  const tabStyle = (active) => ({
    flex: 1,
    padding: "9px 0",
    textAlign: "center",
    fontSize: 13.5,
    fontWeight: 600,
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    background: active ? accent : "transparent",
    color: active ? "#0B1F1C" : sub,
    transition: "background 0.15s ease, color 0.15s ease",
  });

  return (
    <form onSubmit={onLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Login method tabs */}
      <div
        role="tablist"
        aria-label="Choose login method"
        style={{
          display: "flex",
          gap: 4,
          padding: 4,
          borderRadius: 10,
          border: `1.5px solid ${border}`,
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={loginMethod === "phone"}
          onClick={() => switchLoginMethod("phone")}
          style={tabStyle(loginMethod === "phone")}
        >
          Phone number
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={loginMethod === "email"}
          onClick={() => switchLoginMethod("email")}
          style={tabStyle(loginMethod === "email")}
        >
          Email
        </button>
      </div>

      {loginMethod === "phone" ? (
        <div>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: sub, display: "block", marginBottom: 6 }}>
            PHONE NUMBER
          </label>
          <div style={{ display: "flex", gap: 8, position: "relative" }}>
            <button
              type="button"
              onClick={() => setCountryOpen((o) => !o)}
              style={{
                ...inputStyle,
                width: 96,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <span>{selectedCountry.flag}</span>
              <span style={{ fontSize: 13.5 }}>{selectedCountry.dialCode}</span>
            </button>
            <input
              autoFocus
              type="tel"
              inputMode="numeric"
              placeholder="98765 43210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
              className="fc-input"
              style={{ ...inputStyle, flex: 1, borderColor: fieldErrors.phoneNumber ? danger : border }}
            />

            {countryOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  width: 260,
                  maxHeight: 240,
                  overflowY: "auto",
                  background: inputBg,
                  border: `1px solid ${border}`,
                  borderRadius: 10,
                  boxShadow: "0 12px 30px -10px rgba(0,0,0,0.3)",
                  zIndex: 20,
                  padding: 8,
                }}
              >
                <input
                  autoFocus
                  placeholder="Search country…"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  style={{
                    ...inputStyle,
                    padding: "8px 10px",
                    fontSize: 13,
                    marginBottom: 6,
                  }}
                />
                {filteredCountries.map((c) => (
                  <button
                    key={c.alpha2}
                    type="button"
                    onClick={() => {
                      setSelectedCountry(c);
                      setCountryOpen(false);
                      setCountrySearch("");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "8px 10px",
                      background: "transparent",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      color: ink,
                      fontSize: 13.5,
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = `${accent}14`)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span>{c.flag}</span>
                    <span style={{ flex: 1 }}>{c.name}</span>
                    <span style={{ color: sub }}>{c.dialCode}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {fieldErrors.phoneNumber && (
            <p style={{ color: danger, fontSize: 12, marginTop: 5 }}>{fieldErrors.phoneNumber}</p>
          )}
        </div>
      ) : (
        <div>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: sub, display: "block", marginBottom: 6 }}>
            EMAIL
          </label>
          <input
            autoFocus
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="fc-input"
            style={{ ...inputStyle, borderColor: fieldErrors.email ? danger : border }}
          />
          {fieldErrors.email && (
            <p style={{ color: danger, fontSize: 12, marginTop: 5 }}>{fieldErrors.email}</p>
          )}
        </div>
      )}

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: sub, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={rememberDevice}
          onChange={(e) => setRememberDevice(e.target.checked)}
          style={{ width: 15, height: 15, accentColor: accent }}
        />
        Remember this device for 30 days
      </label>

      <button
        type="submit"
        disabled={loading}
        className="fc-btn-primary"
        style={{
          background: accent,
          color: "#0B1F1C",
          fontWeight: 700,
          fontSize: 14.5,
          padding: "13px 0",
          borderRadius: 10,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginTop: 4,
        }}
      >
        {loading && <Icon name="spinner" className="w-4 h-4 fc-spin" />}
        {loading ? "Sending code…" : "Send code"}
      </button>
    </form>
  );
}

// =================================================================
// Step 2 — OTP
// =================================================================
function StepTwo({
  otp,
  otpRefs,
  handleOtpChange,
  handleOtpKeyDown,
  handleOtpPaste,
  onOtpSubmit,
  loading,
  resendCooldown,
  resending,
  handleResend,
  inputBg,
  border,
  ink,
  sub,
  amber,
  accent,
  userPhoneData,
  changeContact,
}) {
  const contactLabel = userPhoneData?.phoneNumber
    ? "phone number"
    : userPhoneData?.email
    ? "email"
    : "phone number or email";
  return (
    <form onSubmit={onOtpSubmit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }} onPaste={handleOtpPaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (otpRefs.current[i] = el)}
            value={digit}
            onChange={(e) => handleOtpChange(e.target.value, i)}
            onKeyDown={(e) => handleOtpKeyDown(e, i)}
            inputMode="numeric"
            maxLength={1}
            className={`fc-otp ${digit ? "fc-pop" : ""}`}
            style={{
              width: 46,
              height: 52,
              textAlign: "center",
              fontSize: 19,
              fontWeight: 700,
              borderRadius: 10,
              border: `1.5px solid ${border}`,
              background: inputBg,
              color: ink,
              fontFamily: "Space Grotesk, sans-serif",
            }}
          />
        ))}
      </div>

      <div style={{ textAlign: "center" }}>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || resending}
          style={{
            background: "none",
            border: "none",
            color: resendCooldown > 0 ? sub : amber,
            fontSize: 13.5,
            fontWeight: 600,
            cursor: resendCooldown > 0 ? "default" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {resending && <Icon name="spinner" className="w-3.5 h-3.5 fc-spin" />}
          {resendCooldown > 0
            ? `Resend code in 0:${String(resendCooldown).padStart(2, "0")}`
            : resending
            ? "Resending…"
            : "Resend code"}
        </button>
      </div>

      <p style={{ textAlign: "center", fontSize: 13, color: sub, margin: 0 }}>
        Wrong {contactLabel}?{" "}
        <button
          type="button"
          onClick={changeContact}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            color: accent,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Change it
        </button>
      </p>

      <button
        type="submit"
        disabled={loading}
        className="fc-btn-primary"
        style={{
          background: accent,
          color: "#0B1F1C",
          fontWeight: 700,
          fontSize: 14.5,
          padding: "13px 0",
          borderRadius: 10,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {loading && <Icon name="spinner" className="w-4 h-4 fc-spin" />}
        {loading ? "Verifying…" : "Verify and continue"}
      </button>

      <p style={{ textAlign: "center", fontSize: 11.5, color: sub }}>
        Mock mode: any 6 digits work, except <code>111111</code> (simulates a wrong code).
      </p>
    </form>
  );
}

// =================================================================
// Step 3 — profile
// =================================================================
function StepThree({
  username,
  setUsername,
  usernameStatus,
  agreed,
  setAgreed,
  profilePicture,
  selectedAvatar,
  setSelectedAvatar,
  setProfilePicture,
  setProfilePictureFile,
  dragActive,
  setDragActive,
  handleDrop,
  handleFileInput,
  onProfileSubmit,
  loading,
  uploadProgress,
  inputBg,
  border,
  ink,
  sub,
  accent,
  amber,
  danger,
}) {
  const statusColor =
    usernameStatus === "available" ? accent : usernameStatus === "taken" ? danger : sub;

  return (
    <form onSubmit={onProfileSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Avatar / upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        style={{
          display: "flex",
          gap: 18,
          alignItems: "center",
          padding: 16,
          borderRadius: 14,
          border: `1.5px dashed ${dragActive ? accent : border}`,
          background: dragActive ? `${accent}0d` : "transparent",
          transition: "all 0.15s ease",
        }}
      >
        <img
          src={profilePicture || selectedAvatar}
          alt="Profile preview"
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            objectFit: "cover",
            border: `3px solid ${accent}`,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: accent,
              cursor: "pointer",
            }}
          >
            <Icon name="upload" className="w-3.5 h-3.5" />
            Upload a photo
            <input type="file" accept="image/*" onChange={handleFileInput} style={{ display: "none" }} />
          </label>
          <p style={{ fontSize: 11.5, color: sub, marginTop: 3 }}>
            Drag & drop, or click — JPG/PNG up to 5MB
          </p>
        </div>
      </div>

      <div>
        <p style={{ fontSize: 12, color: sub, marginBottom: 8, fontWeight: 600 }}>
          OR PICK AN AVATAR
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {avatars.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => {
                setSelectedAvatar(a);
                setProfilePicture(null);
                setProfilePictureFile(null);
              }}
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                padding: 0,
                border: "none",
                cursor: "pointer",
                outline: selectedAvatar === a && !profilePicture ? `2.5px solid ${accent}` : "2.5px solid transparent",
                outlineOffset: 2,
              }}
            >
              <img src={a} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
            </button>
          ))}
        </div>
      </div>

      {loading && uploadProgress > 0 && uploadProgress < 100 && (
        <div>
          <div style={{ height: 5, borderRadius: 4, background: border, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${uploadProgress}%`,
                background: accent,
                transition: "width 0.15s ease",
              }}
            />
          </div>
          <p style={{ fontSize: 11, color: sub, marginTop: 4 }}>Uploading photo… {uploadProgress}%</p>
        </div>
      )}

      <div>
        <label style={{ fontSize: 12.5, fontWeight: 600, color: sub, display: "block", marginBottom: 6 }}>
          USERNAME
        </label>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
            className="fc-input"
            style={{
              width: "100%",
              padding: "12px 14px",
              paddingRight: 36,
              borderRadius: 10,
              border: `1.5px solid ${usernameStatus === "taken" ? danger : border}`,
              background: inputBg,
              color: ink,
              fontSize: 14.5,
            }}
          />
          <span
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
            }}
          >
            {usernameStatus === "checking" && <Icon name="spinner" className="w-4 h-4 fc-spin" style={{ color: sub }} />}
            {usernameStatus === "available" && <Icon name="check" className="w-4 h-4" style={{ color: accent }} />}
            {usernameStatus === "taken" && <Icon name="alert" className="w-4 h-4" style={{ color: danger }} />}
          </span>
        </div>
        {usernameStatus && (
          <p style={{ fontSize: 12, marginTop: 5, color: statusColor }}>
            {usernameStatus === "checking" && "Checking availability…"}
            {usernameStatus === "available" && "That username is available."}
            {usernameStatus === "taken" && "Already taken — try another."}
          </p>
        )}
      </div>

      <label style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13, color: sub, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          style={{ width: 15, height: 15, marginTop: 2, accentColor: accent, flexShrink: 0 }}
        />
        <span>
          I agree to the <strong style={{ color: ink }}>Terms of Service</strong> and{" "}
          <strong style={{ color: ink }}>Privacy Policy</strong>
        </span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="fc-btn-primary"
        style={{
          background: accent,
          color: "#0B1F1C",
          fontWeight: 700,
          fontSize: 14.5,
          padding: "13px 0",
          borderRadius: 10,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {loading && <Icon name="spinner" className="w-4 h-4 fc-spin" />}
        {loading ? "Creating your account…" : "Create account"}
      </button>
    </form>
  );
}

// =================================================================
// Success view
// =================================================================
function SuccessView({ ink, sub, accent, username }) {
  return (
    <div
      className="fc-fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: 320,
        gap: 16,
      }}
    >
      <div
        style={{
          width: 68,
          height: 68,
          borderRadius: "50%",
          background: `${accent}1a`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
          <path
            d="M5 12.5 10 17l9-10"
            stroke={accent}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="fc-check-draw"
          />
        </svg>
      </div>
      <div>
        <h2 className="fc-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
          You're in, {username || "friend"}
        </h2>
        <p style={{ color: sub, fontSize: 13.5 }}>Taking you to your chats…</p>
      </div>
    </div>
  );
}