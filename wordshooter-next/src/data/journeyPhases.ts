// ---------------------------------------------------------------------------
// Word Shooter - Journey mode phase definitions
// Ported from the original getJourneyPhaseMode(), getJourneyPhaseNumber(),
// and checkJourneyPhaseTransition() functions.
//
// Phase | Score     | Mode      | Letter? | Speed | Sentence dur | Color
// ------+-----------+-----------+---------+-------+--------------+---------
//   1   |   0 -  99 | words     |   no    |  2x   |      -       | (default)
//   2   | 100 - 199 | sentences |   no    |  1x   |     18s      | #4A90E2
//   3   | 200 - 299 | words*    |  yes    |  2x   |      -       | #00D4FF
//   4   | 300 - 399 | math      |   no    |  2x   |      -       | #E67E22
//   5   | 400 - 499 | words     |   no    |  3x   |      -       | #FF4500
//   6   | 500 - 799 | sentences |   no    |  1x   |     12s      | #4A90E2
//   7   | 800 - 899 | words*    |  yes    |  3x   |      -       | #00D4FF
//   8   | 900 - 999 | math      |   no    |  3x   |      -       | #E67E22
//
// * Phases 3 & 7 use the "words" mode engine but with isLetterMode = true,
//   spawning single a-z letters instead of full words.
// ---------------------------------------------------------------------------

import type { JourneyPhase } from '@/types/game';

export const journeyPhases: JourneyPhase[] = [
  {
    phase: 1,
    scoreRange: [0, 99],
    mode: 'words',
    isLetterMode: false,
    speedMultiplier: 2,
    sentenceDuration: 0,
    name: 'WORDS (2x)',
    color: '#FFFFFF',
  },
  {
    phase: 2,
    scoreRange: [100, 199],
    mode: 'sentences',
    isLetterMode: false,
    speedMultiplier: 1,
    sentenceDuration: 18,
    name: 'SENTENCES (18s)',
    color: '#4A90E2',
  },
  {
    phase: 3,
    scoreRange: [200, 299],
    mode: 'words',
    isLetterMode: true,
    speedMultiplier: 2,
    sentenceDuration: 0,
    name: 'LETTERS (2x)',
    color: '#00D4FF',
  },
  {
    phase: 4,
    scoreRange: [300, 399],
    mode: 'math',
    isLetterMode: false,
    speedMultiplier: 2,
    sentenceDuration: 0,
    name: 'MATH (2x)',
    color: '#E67E22',
  },
  {
    phase: 5,
    scoreRange: [400, 499],
    mode: 'words',
    isLetterMode: false,
    speedMultiplier: 3,
    sentenceDuration: 0,
    name: 'WORDS (3x)',
    color: '#FF4500',
  },
  {
    phase: 6,
    scoreRange: [500, 799],
    mode: 'sentences',
    isLetterMode: false,
    speedMultiplier: 1,
    sentenceDuration: 12,
    name: 'SENTENCES (12s)',
    color: '#4A90E2',
  },
  {
    phase: 7,
    scoreRange: [800, 899],
    mode: 'words',
    isLetterMode: true,
    speedMultiplier: 3,
    sentenceDuration: 0,
    name: 'LETTERS (3x)',
    color: '#00D4FF',
  },
  {
    phase: 8,
    scoreRange: [900, 999],
    mode: 'math',
    isLetterMode: false,
    speedMultiplier: 3,
    sentenceDuration: 0,
    name: 'MATH (3x)',
    color: '#E67E22',
  },
];

/**
 * Look up the journey phase config for a given score.
 * Iterates from the highest phase downward and returns the first match.
 */
export function getJourneyPhaseForScore(score: number): JourneyPhase {
  for (let i = journeyPhases.length - 1; i >= 0; i--) {
    if (score >= journeyPhases[i].scoreRange[0]) {
      return journeyPhases[i];
    }
  }
  return journeyPhases[0];
}

/**
 * Return the 1-based phase number for a given score.
 */
export function getJourneyPhaseNumber(score: number): number {
  return getJourneyPhaseForScore(score).phase;
}

/**
 * Return the effective game mode for a given score in journey mode.
 */
export function getJourneyPhaseMode(score: number): 'words' | 'sentences' | 'math' {
  const phase = getJourneyPhaseForScore(score);
  // The mode in the phase config is always 'words', 'sentences', or 'math'
  return phase.mode as 'words' | 'sentences' | 'math';
}
