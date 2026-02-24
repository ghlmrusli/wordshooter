// ---------------------------------------------------------------------------
// Word Shooter - Rank system
// Ported from the original speedometer rendering code.
//
// Rank       | Threshold
// -----------+-----------
// NOOB       |     0
// MEH        |   100
// BLUR       |   200
// POWER      |   300
// WIRA       |   400
// GEMPAK     |   500
// ELITE      |   600
// JAGUH      |   700
// LEGEND     |   800
// OTAI       |   900
// ---------------------------------------------------------------------------

import type { Rank } from '@/types/game';

export const SCORE_MAX = 1000;

export const ranks: Rank[] = [
  { label: 'NOOB',   threshold: 0 },
  { label: 'MEH',    threshold: 100 },
  { label: 'BLUR',   threshold: 200 },
  { label: 'POWER',  threshold: 300 },
  { label: 'WIRA',   threshold: 400 },
  { label: 'GEMPAK', threshold: 500 },
  { label: 'ELITE',  threshold: 600 },
  { label: 'JAGUH',  threshold: 700 },
  { label: 'LEGEND', threshold: 800 },
  { label: 'OTAI',   threshold: 900 },
];

/** All rank labels in order. */
export const RANK_LABELS = ranks.map((r) => r.label);

/**
 * Get the rank for a given score.
 * Iterates from the highest rank downward and returns the first match.
 */
export function getRank(score: number): string {
  return getRankForScore(score).label;
}

export function getRankForScore(score: number): Rank {
  const clamped = Math.min(score, SCORE_MAX);
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (clamped >= ranks[i].threshold) {
      return ranks[i];
    }
  }
  return ranks[0];
}

/**
 * Get the 0-based rank index for a given score.
 */
export function getRankIndex(score: number): number {
  const clamped = Math.min(score, SCORE_MAX);
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (clamped >= ranks[i].threshold) {
      return i;
    }
  }
  return 0;
}

/**
 * Get the needle ratio (0-1) for the speedometer gauge.
 */
export function getNeedleRatio(score: number): number {
  return Math.min(score, SCORE_MAX) / SCORE_MAX;
}
