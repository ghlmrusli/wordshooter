'use client';

import { useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useStarfield } from '@/hooks/useStarfield';
import { useAudio } from '@/hooks/useAudio';
import UserBadge from '@/components/auth/UserBadge';
import type { GameMode } from '@/types/game';
import styles from '@/styles/startscreen.module.css';

const modes: { mode: GameMode; name: string; desc: string; emoji: string }[] = [
  { mode: 'words', name: 'Words', desc: 'Quick reflexes', emoji: '\u{1F47E}' },
  { mode: 'sentences', name: 'Sentences', desc: 'Rhythm flow', emoji: '\u{1F6F8}' },
  { mode: 'math', name: 'Math', desc: 'Mental agility', emoji: '\u{1F47D}' },
  { mode: 'journey', name: 'Adventure', desc: 'Full mastery', emoji: '\u{1FA90}' },
];

export default function StartScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startGame = useGameStore((state) => state.startGame);
  const { startMusic } = useAudio();

  const getSpeedScale = useCallback(() => 0.008, []);
  useStarfield(canvasRef, getSpeedScale);

  const handleModeSelect = (mode: GameMode) => {
    startGame(mode);
    startMusic();
  };

  return (
    <div className={styles.timeSelection}>
      <canvas ref={canvasRef} className={styles.menuStarCanvas} />

      <div className={styles.startScreenContent}>
        <UserBadge />

        <div className={styles.rocketIcon}>{'\u{1F680}'}</div>
        <h1 className={styles.gameTitle}>Word Shooter!</h1>
        <p className={styles.gameSubtitle}>Show your typing skills</p>

        <div className={styles.difficultyOptions}>
          {modes.map(({ mode, name, desc, emoji }) => (
            <div
              key={mode}
              className={styles.difficultyOption}
              onClick={() => handleModeSelect(mode)}
            >
              <div className={styles.difficultyText}>
                <div className={styles.difficultyName}>{name}</div>
                <div className={styles.difficultyDesc}>{desc}</div>
              </div>
              <span className={styles.modeEmoji}>{emoji}</span>
            </div>
          ))}

          <div
            className={styles.difficultyOption}
            onClick={() => useGameStore.setState({ screen: 'lobby' })}
            style={{ borderColor: 'rgba(78, 204, 163, 0.4)' }}
          >
            <div className={styles.difficultyText}>
              <div className={styles.difficultyName}>Multiplayer</div>
              <div className={styles.difficultyDesc}>Race friends!</div>
            </div>
            <span className={styles.modeEmoji}>{'\u{1F310}'}</span>
          </div>

          <div
            className={styles.difficultyOption}
            onClick={() => useGameStore.setState({ screen: 'leaderboard' })}
            style={{ borderColor: 'rgba(255, 215, 0, 0.4)' }}
          >
            <div className={styles.difficultyText}>
              <div className={styles.difficultyName}>Leaderboard</div>
              <div className={styles.difficultyDesc}>Top scores</div>
            </div>
            <span className={styles.modeEmoji}>{'\u{1F3C6}'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
