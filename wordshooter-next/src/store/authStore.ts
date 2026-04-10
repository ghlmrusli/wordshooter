import { create } from 'zustand';
import { nanoid } from 'nanoid';

interface UserInfo {
  id: string;
  username: string | null;
  displayName: string | null;
}

interface AuthState {
  guestId: string;
  user: UserInfo | null;
  loading: boolean;
  setUser: (user: UserInfo | null) => void;
  initGuest: () => string;
  logout: () => Promise<void>;
}

function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('ws_guest_id');
  if (!id) {
    id = nanoid(12);
    localStorage.setItem('ws_guest_id', id);
  }
  return id;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  guestId: '',
  user: null,
  loading: true,

  setUser: (user) => set({ user, loading: false }),

  initGuest: () => {
    const guestId = getOrCreateGuestId();
    set({ guestId });
    return guestId;
  },

  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    set({ user: null });
  },
}));
