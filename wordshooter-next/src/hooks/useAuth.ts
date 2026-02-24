'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const initGuest = useAuthStore((s) => s.initGuest);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    initGuest();

    // Check if logged in via JWT cookie
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user || null);
      })
      .catch(() => {
        setUser(null);
      });
  }, [initGuest, setUser]);
}
