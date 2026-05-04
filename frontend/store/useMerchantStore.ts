import { create } from 'zustand';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
}

interface MerchantUIState {
  notifications: Notification[];
  sidebarCollapsed: boolean;
  addNotification: (notif: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAllRead: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  unreadCount: () => number;
}

export const useMerchantStore = create<MerchantUIState>((set, get) => ({
  notifications: [],
  sidebarCollapsed: false,

  addNotification: (notif) =>
    set((state) => ({
      notifications: [
        {
          ...notif,
          id: Date.now().toString(),
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...state.notifications.slice(0, 19),
      ],
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
