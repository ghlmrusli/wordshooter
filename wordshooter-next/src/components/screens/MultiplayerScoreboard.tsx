'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useMultiplayerStore } from '@/multiplayer/multiplayerStore';
import { useAuthStore } from '@/store/authStore';
import { useStarfield } from '@/hooks/useStarfield';
import { PLAYER_COLORS } from '../../../party/types';
import styles from '@/styles/scoreboard.module.css';

export default function MultiplayerScoreboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const getSpeedScale = useCallback(() => 0.008, []);
  useStarfield(canvasRef, getSpeedScale);

  // Save MP game record on mount
  useEffect(() => {
    const mp = useMultiplayerStore.getState();
    const myId = mp.myId;
    const myEntry = mp.scoreboard.find((e) => e.id === myId);
    if (!myEntry) return;

    const guestId = useAuthStore.getState().guestId;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (guestId) headers['x-guest-id'] = guestId;

    fetch('/api/games', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        mode: mp.mode || 'words',
        score: myEntry.score,
        durationMs: (mp.duration || 60) * 1000,
        totalChars: 0,
        correctChars: 0,
        incorrectAttempts: 0,
        missedWords: 0,
        maxCombo: myEntry.maxCombo,
        mathSolved: 0,
        mathTotalTime: 0,
        journeyStats: null,
        wpm: 0,
        accuracy: myEntry.accuracy,
        isMultiplayer: true,
      }),
    }).catch(console.error);
  }, []);

  const mpStore = useMultiplayerStore();
  const scoreboard = mpStore.scoreboard;

  const handlePlayAgain = () => {
    mpStore.reset();
    useGameStore.setState({ screen: 'lobby', invaders: [], bullets: [] });
  };

  const handleMainMenu = () => {
    mpStore.reset();
    useGameStore.setState({ screen: 'start', invaders: [], bullets: [] });
  };

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className={styles.scoreboardContainer}>
      <canvas ref={canvasRef} className={styles.starCanvas} />

      <div className={styles.scoreboardContent}>
        <div className={styles.scoreboardTitle}>Game Over!</div>

        <div className={styles.podium}>
          {scoreboard.map((entry, i) => (
            <div key={entry.id} className={styles.podiumEntry}>
              <div className={styles.podiumMedal}>{medals[i] ?? `#${i + 1}`}</div>
              <div
                className={styles.podiumDot}
                style={{ background: PLAYER_COLORS[entry.color] }}
              />
              <div className={styles.podiumName}>{entry.name}</div>
              <div className={styles.podiumScore}>{entry.score} pts</div>
              <div className={styles.podiumStats}>
                {entry.wordsKilled} kills | {entry.maxCombo} max combo | {entry.accuracy}% acc
              </div>
            </div>
          ))}
        </div>

        <div className={styles.buttonRow}>
          <button className={styles.scoreboardBtn} onClick={handlePlayAgain}>
            Play Again
          </button>
          <button className={styles.scoreboardBtnSecondary} onClick={handleMainMenu}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
