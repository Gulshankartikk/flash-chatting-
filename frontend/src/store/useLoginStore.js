import { create } from "zustand";
import { persist } from "zustand/middleware";

const OTP_RESEND_COOLDOWN_S = 30; // WhatsApp disables "Resend" for ~30s
const OTP_EXPIRY_MS = 5 * 60 * 1000; // codes go stale after 5 minutes
const MAX_VERIFY_ATTEMPTS = 5; // lock out after too many wrong codes

const useLoginStore = create(
  persist(
    (set, get) => ({
      // 1 = phone/email entry, 2 = OTP verification, 3 = profile setup
      step: 1,
      userPhoneData: null, // { phone, countryCode, method: "phone" | "email" }

      // ✅ When the current OTP was sent, so the screen can show "expires in
      // 4:32" and silently invalidate stale codes — WhatsApp's OTP screen
      // always carries this countdown.
      otpSentAt: null,

      // ✅ Wrong-code tracking, so the UI can show "3 attempts left" and the
      // backend isn't the only thing rate-limiting brute-force guesses.
      verifyAttempts: 0,

      // ✅ Loading + error are common to every step (sending OTP, verifying,
      // saving profile) — centralised here instead of being re-invented as
      // local useState in each step's component.
      isLoading: false,
      error: null,

      setStep: (step) => set({ step, error: null }),

      setUserPhoneData: (data) => set({ userPhoneData: data }),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),
      clearError: () => set({ error: null }),

      // Call right after the OTP request succeeds.
      markOtpSent: () =>
        set({
          otpSentAt: Date.now(),
          verifyAttempts: 0,
          error: null,
          isLoading: false,
        }),

      // Seconds remaining before "Resend code" becomes clickable again.
      getResendCooldownRemaining: () => {
        const { otpSentAt } = get();
        if (!otpSentAt) return 0;
        const elapsed = (Date.now() - otpSentAt) / 1000;
        return Math.max(0, Math.ceil(OTP_RESEND_COOLDOWN_S - elapsed));
      },

      canResendOtp: () => get().getResendCooldownRemaining() === 0,

      isOtpExpired: () => {
        const { otpSentAt } = get();
        if (!otpSentAt) return true;
        return Date.now() - otpSentAt > OTP_EXPIRY_MS;
      },

      // Call when the entered code doesn't match. Returns whether the user
      // has been locked out, so the component knows to force a resend.
      registerFailedAttempt: () => {
        const attempts = get().verifyAttempts + 1;
        set({ verifyAttempts: attempts });
        return attempts >= MAX_VERIFY_ATTEMPTS;
      },

      isLockedOut: () => get().verifyAttempts >= MAX_VERIFY_ATTEMPTS,

      resetLoginState: () =>
        set({
          step: 1,
          userPhoneData: null,
          otpSentAt: null,
          verifyAttempts: 0,
          isLoading: false,
          error: null,
        }),
    }),
    {
      name: "login-storage",
      // Only persist what's needed to survive a refresh mid-flow (e.g. the
      // user reloads while an OTP is in flight). `step` is intentionally
      // excluded so every fresh load always starts at step 1 (the
      // phone/email tabs) instead of resuming wherever the user left off,
      // which was skipping the tab screen entirely. `isLoading`/`error`
      // are also excluded — they're transient UI state, not flow state.
      partialize: (state) => ({
        userPhoneData: state.userPhoneData,
        otpSentAt: state.otpSentAt,
      }),
    },
  ),
);

export default useLoginStore;