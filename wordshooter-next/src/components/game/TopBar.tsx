'use client';

import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useAudio } from '@/hooks/useAudio';
import styles from '@/styles/topbar.module.css';
import clsx from 'clsx';

export default function TopBar() {
  const score = useGameStore((s) => s.score);
  const mode = useGameStore((s) => s.mode);
  const speedMultiplier = useGameStore((s) => s.speedMultiplier);
  const isPaused = useGameStore((s) => s.isPaused);
  const isMuted = useGameStore((s) => s.isMuted);
  const togglePause = useGameStore((s) => s.togglePause);
  const { toggleMute } = useAudio();

  // Track score changes for animation
  const [scoreAnimClass, setScoreAnimClass] = useState<string | null>(null);
  const prevScoreRef = useRef(score);

  useEffect(() => {
    const prevScore = prevScoreRef.current;
    if (score !== prevScore) {
      if (score > prevScore) {
        setScoreAnimClass('scoreIncrease');
      } else if (score < prevScore) {
        setScoreAnimClass('scoreDecrease');
      }
      prevScoreRef.current = score;

      const timer = setTimeout(() => setScoreAnimClass(null), 500);
      return () => clearTimeout(timer);
    }
  }, [score]);

  const getModeDisplay = () => {
    switch (mode) {
      case 'words': return 'Words';
      case 'sentences': return 'Sentences';
      case 'math': return 'Math';
      case 'journey': return 'Adventure';
      default: return 'Words';
    }
  };

  const cycleSpeed = () => {
    if (mode !== 'sentences') return;
    const current = useGameStore.getState().speedMultiplier;
    const next = current === 1 ? 2 : current === 2 ? 3 : 1;
    useGameStore.setState({ speedMultiplier: next });
  };

  const handleRestart = () => {
    useGameStore.getState().resetGame();
    useGameStore.setState({ screen: 'game' });
  };

  const handleHome = () => {
    useGameStore.getState().resetGame();
    useGameStore.setState({ screen: 'start' });
  };

  return (
    <div className={clsx(styles.topbar, styles.show)}>
      <div className={styles.leftControls}>
        <div className={clsx(styles.topbarPill, styles.score)}>
          Score:{' '}
          <span className={clsx(styles.scoreValue, scoreAnimClass && styles[scoreAnimClass])}>
            {score}
          </span>
        </div>
        <div className={clsx(styles.topbarPill, styles.difficultyDisplay)}>
          {getModeDisplay()}
        </div>
        {mode === 'sentences' && (
          <div
            className={clsx(styles.topbarPill, styles.speedDisplay)}
            onClick={cycleSpeed}
          >
            {speedMultiplier}x
          </div>
        )}
      </div>

      <div className={styles.rightControls}>
        <button className={styles.pauseBtn} onClick={togglePause}>
          <span className="material-symbols-outlined">
            {isPaused ? 'play_arrow' : 'pause'}
          </span>
        </button>
        <button className={styles.restartGameBtn} onClick={handleRestart}>
          <span className="material-symbols-outlined">refresh</span>
        </button>
        <button className={styles.homeBtn} onClick={handleHome}>
          <span className="material-symbols-outlined">home</span>
        </button>
        <button className={styles.muteBtn} onClick={toggleMute}>
          <span className="material-symbols-outlined">
            {isMuted ? 'volume_off' : 'volume_up'}
          </span>
        </button>
      </div>
    </div>
  );
}
