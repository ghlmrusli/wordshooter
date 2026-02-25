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
  isYou?: boolean;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const guestId = useAuthStore.getState().guestId;
    const headers: Record<string, string> = {};
    if (guestId) headers['x-guest-id'] = guestId;

    fetch(`/api/leaderboard?mode=${mode}&limit=10`, { headers })
      .then((r) => r.json())
      .then((data) => setEntries(data.leaderboard || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [mode]);

  const handleBack = () => {
    useGameStore.setState({ screen: 'start' });
  };

  // Find the latest "isYou" entry to highlight
  const latestYouIndex = (() => {
    let latestIdx = -1;
    let latestTime = '';
    entries.forEach((e, i) => {
      if (e.isYou && e.playedAt > latestTime) {
        latestTime = e.playedAt;
        latestIdx = i;
      }
    });
    return latestIdx;
  })();

  const rankClass = (rank: number) => {
    if (rank === 1) return styles.rankGold;
    if (rank === 2) return styles.rankSilver;
    if (rank === 3) return styles.rankBronze;
    return '';
  };

  return (
    <div className={styles.leaderboardContainer}>
      <canvas ref={canvasRef} className={styles.starCanvas} />

      {/* Fixed top bar */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={handleBack}>
          Back
        </button>
        <span className={styles.title}>Leaderboard</span>
        <div style={{ width: 60 }} />
      </div>

      <div className={styles.leaderboardContent}>
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
                {entries.map((entry, i) => (
                  <tr
                    key={`${entry.rank}-${entry.playedAt}`}
                    className={`${styles.tableRow} ${i === latestYouIndex ? styles.highlightRow : ''}`}
                  >
                    <td className={rankClass(entry.rank)}>{entry.rank}</td>
                    <td>{entry.displayName}{i === latestYouIndex ? ' (You)' : ''}</td>
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
