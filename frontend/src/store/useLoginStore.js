import { create } from "zustand";
import { persist } from "zustand/middleware";

const useLoginStore = create(
  persist(
    (set) => ({
      step: 1,
      userPhoneData: null,
      setStep: (step) => set({ step }),
      setUserPhoneData: (data) => set({ userPhoneData: data }),
      resetLoginState: () => set({ step: 1, userPhoneData: null }),
    }),
    {
      name: "login-storage",
      // Only persist userPhoneData (handy if the page refreshes mid-OTP).
      // `step` is intentionally excluded so every fresh load always starts
      // at step 1 (the phone/email tabs) instead of resuming wherever the
      // user left off, which was skipping the tab screen entirely.
      partialize: (state) => ({
        userPhoneData: state.userPhoneData,
      }),
    }
  )
);

export default useLoginStore;