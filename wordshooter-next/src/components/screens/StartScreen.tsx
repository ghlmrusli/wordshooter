'use client';

import { useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useStarfield } from '@/hooks/useStarfield';
import { useAudio } from '@/hooks/useAudio';
import type { GameMode } from '@/types/game';
import styles from '@/styles/startscreen.module.css';

const modes: { mode: GameMode; name: string; desc: string; emoji: string }[] = [
  { mode: 'words', name: 'Words', desc: 'Quick reflexes', emoji: '👾' },
  { mode: 'sentences', name: 'Sentences', desc: 'Rhythm flow', emoji: '🛸' },
  { mode: 'math', name: 'Math', desc: 'Mental agility', emoji: '👽' },
  { mode: 'journey', name: 'Adventure', desc: 'Full mastery', emoji: '🪐' },
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
        <div className={styles.rocketIcon}>🚀</div>
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
        </div>
      </div>
    </div>
  );
}
