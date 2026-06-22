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
    isPinned: false,
    unreadCount: 0,
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
    isPinned: false,
    unreadCount: 0,
  },
];

const useLayoutStore = create((set, get) => ({
  // ─────────────────────────────────────────────
  // CONTACTS  (used by HomePage)
  // ─────────────────────────────────────────────
  contacts: sampleContacts,
  isContactsLoading: false,
  setContacts: (contacts) => set({ contacts }),
  setContactsLoading: (loading) => set({ isContactsLoading: loading }),

  // Pin / unpin a chat to the top — WhatsApp lets you pin up to 3
  togglePinContact: (contactId) =>
    set((state) => {
      const pinnedCount = state.contacts.filter((c) => c.isPinned).length;
      return {
        contacts: state.contacts.map((c) => {
          if (c._id !== contactId) return c;
          if (!c.isPinned && pinnedCount >= 3) return c; // pin limit reached
          return { ...c, isPinned: !c.isPinned };
        }),
      };
    }),

  archiveContact: (contactId) =>
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c._id === contactId ? { ...c, isArchived: !c.isArchived } : c,
      ),
    })),

  muteContact: (contactId) =>
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c._id === contactId ? { ...c, isMuted: !c.isMuted } : c,
      ),
    })),

  // ─────────────────────────────────────────────
  // SELECTED CONTACT  (used by HomePage, Layout, Sidebar, UserDetail)
  // ─────────────────────────────────────────────
  selectedContact: null,
  setSelectedContact: (contact) =>
    set({
      selectedContact: contact,
      // On mobile, opening a chat should slide to the chat-window view —
      // WhatsApp's single-column phone layout.
      mobileView: contact ? "chat" : "list",
    }),
  clearSelectedContact: () =>
    set({ selectedContact: null, mobileView: "list" }),

  // ─────────────────────────────────────────────
  // MOBILE NAVIGATION  ("list" | "chat" | "info")
  // ─────────────────────────────────────────────
  // WhatsApp on mobile shows one column at a time: chat list → chat window
  // → contact info, with a back button moving you left one step. On desktop
  // this is ignored since all columns render side by side.
  mobileView: "list",
  setMobileView: (view) => set({ mobileView: view }),
  goBackMobile: () =>
    set((state) => {
      if (state.mobileView === "info") return { mobileView: "chat" };
      if (state.mobileView === "chat")
        return { mobileView: "list", selectedContact: null };
      return {};
    }),

  // ─────────────────────────────────────────────
  // SIDEBAR open/close (desktop collapse, optional use)
  // ─────────────────────────────────────────────
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // ─────────────────────────────────────────────
  // ACTIVE NAV RAIL VIEW: "chats" | "status" | "calls" | "contacts" | "settings"
  // ─────────────────────────────────────────────
  // Lifted up from Sidebar's local useState so HomePage can react to it
  // (e.g. show the contacts list instead of the chat list when "contacts"
  // is active).
  activeView: "chats",
  setActiveView: (view) => set({ activeView: view }),

  // ─────────────────────────────────────────────
  // CHAT LIST FILTER PILLS: "all" | "unread" | "favourites" | "groups"
  // ─────────────────────────────────────────────
  // WhatsApp shows these as filter chips just under the search bar.
  chatFilter: "all",
  setChatFilter: (filter) => set({ chatFilter: filter }),

  // ─────────────────────────────────────────────
  // SEARCH  (chat list search bar)
  // ─────────────────────────────────────────────
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
  clearSearch: () => set({ searchQuery: "" }),

  // ─────────────────────────────────────────────
  // THEME-ADJACENT UI: emoji picker / attach menu open state
  // ─────────────────────────────────────────────
  // Centralised here so opening one auto-closes the other, matching
  // WhatsApp's "only one popover open at a time" behaviour.
  openPopover: null, // null | "emoji" | "attach" | "more"
  setOpenPopover: (name) => set({ openPopover: name }),
  closePopover: () => set({ openPopover: null }),

  // ─────────────────────────────────────────────
  // DERIVED HELPERS
  // ─────────────────────────────────────────────
  // Visible contacts after applying search + filter + archive/pin sort —
  // the same pipeline WhatsApp's chat list runs on every render.
  getVisibleContacts: () => {
    const { contacts, searchQuery, chatFilter } = get();

    let list = contacts.filter((c) => !c.isArchived);

    if (chatFilter === "unread") {
      list = list.filter((c) => (c.unreadCount || 0) > 0);
    } else if (chatFilter === "favourites") {
      list = list.filter((c) => c.isFavourite);
    } else if (chatFilter === "groups") {
      list = list.filter((c) => c.isGroup);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.lastMessage?.toLowerCase().includes(q),
      );
    }

    // Pinned chats always float to the top, like WhatsApp
    return [...list].sort((a, b) => {
      if (!!b.isPinned !== !!a.isPinned) return b.isPinned ? 1 : -1;
      return 0;
    });
  },

  getArchivedContacts: () => get().contacts.filter((c) => c.isArchived),

  getTotalUnread: () =>
    get().contacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
}));

export default useLayoutStore;