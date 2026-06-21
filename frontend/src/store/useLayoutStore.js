import { create } from "zustand";

// Temporary sample data so the UI renders before the real API is wired up.
// Replace this with data fetched from your backend (e.g. in a useEffect
// inside HomePage or App, calling useLayoutStore.getState().setContacts(data)).
const sampleContacts = [
  {
    _id: "1",
    name: "Aarav Sharma",
    lastMessage: "Hey, are we still meeting today?",
    profilePic: "",
    isOnline: true,
    phone: "+91 98765 43210",
    email: "aarav@example.com",
    location: "Ludhiana, Punjab",
    bio: "Frontend developer | Coffee lover",
  },
  {
    _id: "2",
    name: "Simran Kaur",
    lastMessage: "Sent the files, check your inbox.",
    profilePic: "",
    isOnline: false,
    phone: "+91 91234 56789",
    email: "simran@example.com",
    location: "Chandigarh, Punjab",
    bio: "Designer at FlashChat",
  },
];

const useLayoutStore = create((set) => ({
  // ----- Contacts (used by HomePage) -----
  contacts: sampleContacts,
  setContacts: (contacts) => set({ contacts }),

  // ----- Selected contact (used by HomePage, Layout, Sidebar, UserDetail) -----
  selectedContact: null,
  setSelectedContact: (contact) => set({ selectedContact: contact }),

  // ----- Sidebar open/close state (handy for mobile toggle, optional use) -----
  sidebarOpen: true,
  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));

export default useLayoutStore;