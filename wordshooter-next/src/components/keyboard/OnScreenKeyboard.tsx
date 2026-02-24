'use client';

import { useGameStore } from '@/store/gameStore';
import { handleKeyPress } from '@/engine/InputHandler';
import styles from '@/styles/keyboard.module.css';
import clsx from 'clsx';

const rows = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['.', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ','],
];

export default function OnScreenKeyboard() {
  const isSentenceActive = useGameStore((s) => s.isSentenceActive);
  const showSpacebar = useGameStore((s) => s.mode === 'sentences' || s.isSentenceActive);

  const handleKey = (key: string) => {
    const state = useGameStore.getState();
    if (state.isPaused || state.isGameOver) return;
    handleKeyPress(key);
  };

  return (
    <div
      className={clsx(
        styles.onScreenKeyboard,
        isSentenceActive && styles.hideForChallenge
      )}
    >
      {rows.map((row, ri) => (
        <div key={ri} className={styles.keyboardRow}>
          {row.map((key) => (
            <button
              key={key}
              className={styles.key}
              data-key={key}
              onMouseDown={(e) => {
                e.preventDefault();
                handleKey(key);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                handleKey(key);
              }}
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>
      ))}
      {showSpacebar && (
        <div className={styles.spacebarRow}>
          <button
            className={clsx(styles.key, styles.keySpace)}
            data-key=" "
            onMouseDown={(e) => {
              e.preventDefault();
              handleKey(' ');
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              handleKey(' ');
            }}
          >
            SPACE
          </button>
        </div>
      )}
    </div>
  );
}
