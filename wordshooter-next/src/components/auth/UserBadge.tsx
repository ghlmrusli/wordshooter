'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import AuthModal from './AuthModal';
import styles from '@/styles/auth.module.css';

export default function UserBadge() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const logout = useAuthStore((s) => s.logout);
  const [showAuth, setShowAuth] = useState(false);

  if (loading) return null;

  return (
    <>
      <div className={styles.userBadge}>
        {user ? (
          <>
            <span className={styles.badgeIcon}>&#128100;</span>
            <span className={styles.badgeName}>{user.displayName || user.username}</span>
            <button className={styles.badgeLink} onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <button className={styles.badgeLink} onClick={() => setShowAuth(true)}>
            Login / Sign Up
          </button>
        )}
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
