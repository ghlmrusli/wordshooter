'use client';

import { handleKeyPress } from '@/engine/InputHandler';
import { useGameStore } from '@/store/gameStore';
import styles from '@/styles/keyboard.module.css';
import clsx from 'clsx';

const rows = [
  ['1', '2', '3', '4', '5'],
  ['6', '7', '8', '9', '0'],
];

export default function NumberKeyboard() {
  const isMathMode = useGameStore((s) => s.isMathMode);

  const handleKey = (key: string) => {
    const state = useGameStore.getState();
    if (state.isPaused || state.isGameOver) return;
    handleKeyPress(key);
  };

  if (!isMathMode) return null;

  return (
    <div className={clsx(styles.numberKeyboard, styles.show)}>
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
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
