'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import { useStarfield } from '@/hooks/useStarfield';
import type { GameMode } from '@/types/game';
import styles from '@/styles/leaderboard.module.css';

interface LeaderboardEntry {
  rank: number;
  score: number;
  wpm: number;
  accuracy: number;
  maxCombo: number;
  displayName: string;
  playedAt: string;
}

interface PersonalBest {
  mode: string;
  bestScore: number;
  bestWpm: number;
  gamesPlayed: number;
}

const MODES: { key: GameMode; label: string }[] = [
  { key: 'words', label: 'Words' },
  { key: 'sentences', label: 'Sentences' },
  { key: 'math', label: 'Math' },
  { key: 'journey', label: 'Adventure' },
];

export default function LeaderboardScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const getSpeedScale = useCallback(() => 0.008, []);
  useStarfield(canvasRef, getSpeedScale);

  const [mode, setMode] = useState<GameMode>('words');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [personalBest, setPersonalBest] = useState<PersonalBest | null>(null);
  const [loading, setLoading] = useState(true);

  const guestId = useAuthStore((s) => s.guestId);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?mode=${mode}&limit=50`)
      .then((r) => r.json())
      .then((data) => setEntries(data.leaderboard || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [mode]);

  useEffect(() => {
    const headers: Record<string, string> = {};
    if (guestId) headers['x-guest-id'] = guestId;

    fetch('/api/games/personal-bests', { headers })
      .then((r) => r.json())
      .then((data) => {
        const bests: PersonalBest[] = data.personalBests || [];
        const current = bests.find((b) => b.mode === mode);
        setPersonalBest(current || null);
      })
      .catch(() => setPersonalBest(null));
  }, [mode, guestId]);

  const handleBack = () => {
    useGameStore.setState({ screen: 'start' });
  };

  const rankClass = (rank: number) => {
    if (rank === 1) return styles.rankGold;
    if (rank === 2) return styles.rankSilver;
    if (rank === 3) return styles.rankBronze;
    return '';
  };

  return (
    <div className={styles.leaderboardContainer}>
      <canvas ref={canvasRef} className={styles.starCanvas} />

      <div className={styles.leaderboardContent}>
        <div className={styles.topBar}>
          <span className={styles.title}>Leaderboard</span>
          <button className={styles.backBtn} onClick={handleBack}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </div>

        <div className={styles.modeTabs}>
          {MODES.map(({ key, label }) => (
            <button
              key={key}
              className={`${styles.modeTab} ${mode === key ? styles.modeTabActive : ''}`}
              onClick={() => setMode(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {personalBest && (
          <div className={styles.personalBests}>
            <div className={styles.pbTitle}>Your Best</div>
            <div className={styles.pbRow}>
              <span className={styles.pbLabel}>
                {personalBest.gamesPlayed} game{personalBest.gamesPlayed !== 1 ? 's' : ''}
              </span>
              <span className={styles.pbValue}>{personalBest.bestScore} pts</span>
            </div>
          </div>
        )}

        <div className={styles.tableWrapper}>
          {loading ? (
            <div className={styles.emptyState}>Loading...</div>
          ) : entries.length === 0 ? (
            <div className={styles.emptyState}>
              No scores yet.<br />Be the first to play!
            </div>
          ) : (
            <table className={styles.table}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Score</th>
                  <th>WPM</th>
                  <th>Acc</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={`${entry.rank}-${entry.playedAt}`} className={styles.tableRow}>
                    <td className={rankClass(entry.rank)}>{entry.rank}</td>
                    <td>{entry.displayName}</td>
                    <td className={styles.scoreCell}>{entry.score}</td>
                    <td>{Math.round(entry.wpm)}</td>
                    <td>{Math.round(entry.accuracy)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
