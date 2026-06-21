import { create } from "zustand";
import { persist } from "zustand/middleware";

const useLayoutStore = create(
  persist(
    (set) => ({
      activeTab: "chats",
      selectedContact: null,

      setSelectedContact: (contact) => set({ selectedContact: contact }),

      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: "layout-storage",

      partialize: (state) => ({
        activeTab: state.activeTab,
        selectedContact: state.selectedContact,
      }),
    },
  ),
);

export default useLayoutStore;
