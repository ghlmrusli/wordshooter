'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import styles from '@/styles/pause.module.css';
import clsx from 'clsx';

const microcopyLines = [
  'Take a breather...',
  'Recharge your brain!',
  'Stretch those fingers!',
  'Deep breath in...',
  'You got this!',
  'Rest up, champion.',
  'Pause. Reflect. Dominate.',
  'Even pros need breaks.',
  'Loading more awesome...',
  'Brewing focus juice...',
];

export default function PauseOverlay() {
  const isPaused = useGameStore((s) => s.isPaused);
  const togglePause = useGameStore((s) => s.togglePause);

  const microcopy = useMemo(
    () => microcopyLines[Math.floor(Math.random() * microcopyLines.length)],
    [isPaused]
  );

  if (!isPaused) return null;

  return (
    <div className={clsx(styles.pauseOverlay, styles.show)} onClick={togglePause}>
      <div className={styles.pauseContent}>
        <div className={styles.pauseMicrocopy}>{microcopy}</div>
        <div className={styles.pauseIcon}>
          <span className="material-symbols-outlined">play_arrow</span>
          <span className={styles.pauseText}>Continue</span>
        </div>
      </div>
    </div>
  );
}
