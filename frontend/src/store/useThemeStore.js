import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Applies the resolved theme to <html> so Tailwind's `dark:` variant
// and any plain-CSS variables work app-wide, not just inside components
// that manually read the store.
const applyThemeToDom = (resolved) => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
};

const getSystemTheme = () => {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const useThemeStore = create(
  persist(
    (set, get) => ({
      // "light" | "dark" | "system" — WhatsApp lets you follow the OS theme
      // in addition to forcing one or the other.
      theme: "light",

      // The theme actually painted on screen right now (never "system").
      resolvedTheme: "light",

      setTheme: (theme) => {
        const resolved = theme === "system" ? getSystemTheme() : theme;
        applyThemeToDom(resolved);
        set({ theme, resolvedTheme: resolved });
      },

      // Quick toggle for a sun/moon button — flips between light and dark,
      // dropping out of "system" mode the moment the user picks one manually.
      toggleTheme: () => {
        const next = get().resolvedTheme === "dark" ? "light" : "dark";
        get().setTheme(next);
      },

      // Call once on app start so the persisted theme (or OS preference,
      // first run) is reflected on the <html> tag before paint.
      initTheme: () => {
        const { theme } = get();
        const resolved = theme === "system" ? getSystemTheme() : theme;
        applyThemeToDom(resolved);
        set({ resolvedTheme: resolved });

        if (typeof window !== "undefined" && window.matchMedia) {
          const mq = window.matchMedia("(prefers-color-scheme: dark)");
          const onChange = () => {
            if (get().theme !== "system") return; // only react in system mode
            const next = mq.matches ? "dark" : "light";
            applyThemeToDom(next);
            set({ resolvedTheme: next });
          };
          mq.addEventListener
            ? mq.addEventListener("change", onChange)
            : mq.addListener(onChange);
        }
      },
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => localStorage),
      // Don't persist resolvedTheme — it's derived and should be
      // recomputed fresh on every load via initTheme().
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);

export default useThemeStore;