// ── ScoreManager ──
// Handles all scoring logic: point calculation, combo system, penalties,
// and game-over conditions.
// Port of original updateScore(), updateComboMultiplier(), resetCombo(),
// and the scoring parts of reachedBottomSide(), completeSentence(), skipSentence().

import useGameStore from '@/store/gameStore';
import { InvaderData } from '@/types/game';

// ── Combo thresholds (exact match of original updateComboMultiplier) ──
// 3+ hits = 1.5x, 5+ hits = 2x, 10+ hits = 3x

/**
 * Calculate and apply the combo multiplier based on consecutive hits.
 * Exact port of original updateComboMultiplier().
 */
export function updateComboMultiplier(): void {
  const state = useGameStore.getState();
  const hits = state.consecutiveHits;

  let multiplier: number;
  if (hits >= 10) {
    multiplier = 3;
  } else if (hits >= 5) {
    multiplier = 2;
  } else if (hits >= 3) {
    multiplier = 1.5;
  } else {
    multiplier = 1;
  }

  useGameStore.getState().setComboMultiplier(multiplier);
}

/**
 * Reset the combo on miss or error.
 * Exact port of original resetCombo().
 */
export function resetCombo(): void {
  useGameStore.getState().resetCombo();
}

/**
 * Result of a score update, returned so UI can animate accordingly.
 */
export interface ScoreUpdateResult {
  oldScore: number;
  newScore: number;
  earnedPoints: number;
  isCelebration: boolean;
  isGameOver: boolean;
}

/**
 * Update score when an invader is destroyed.
 * Exact port of original updateScore(word, invader).
 *
 * Scoring rules:
 * - Sentences: flat 20 points
 * - Math: 10 points (11 if solved in <1 second)
 * - Letters: word.length points
 * - Words: word.length points
 * - All multiplied by comboMultiplier
 *
 * Also increments combo, resets consecutive misses,
 * and checks journey phase transitions.
 */
export function updateScore(
  word: string,
  invader: InvaderData | null = null
): ScoreUpdateResult {
  const store = useGameStore.getState();
  const inJourney = store.mode === 'journey';

  let basePoints = 0;

  // Mode-based scoring + journey stat tracking
  if (invader && invader.isSentence) {
    basePoints = 20;
  } else if (invader && invader.isMathQuestion) {
    basePoints = 10;
    const fast =
      store.mathQuestionStartTime !== null &&
      Date.now() - store.mathQuestionStartTime < 1000;
    if (fast) basePoints += 1;

    if (inJourney) {
      const stats = { ...store.journeyStats };
      stats.math = { ...stats.math };
      stats.math.solved++;
      if (fast) stats.math.fastSolves++;
      if (store.mathQuestionStartTime) {
        stats.math.totalSolveTime += Date.now() - store.mathQuestionStartTime;
      }
      store.setJourneyStats(stats);
    }
  } else if (invader && invader.isLetter) {
    basePoints = word.length;
    if (inJourney) {
      const stats = { ...store.journeyStats };
      stats.letters = { ...stats.letters };
      stats.letters.hit++;
      store.setJourneyStats(stats);
    }
  } else {
    // Normal word
    basePoints = word.length;
    if (inJourney) {
      const stats = { ...store.journeyStats };
      stats.words = { ...stats.words };
      stats.words.wordsHit++;
      stats.words.correctChars += word.length;
      store.setJourneyStats(stats);
    }
  }

  // Apply combo multiplier
  const earnedPoints = Math.floor(basePoints * store.comboMultiplier);
  const oldScore = store.score;
  store.addScore(earnedPoints);

  // Increment consecutive hits for combo
  store.incrementHits();
  updateComboMultiplier();

  // Reset consecutive misses
  store.resetConsecutiveMisses();

  const newScore = useGameStore.getState().score;

  // Check for celebration at 1000
  let isCelebration = false;
  if (newScore >= 1000 && !store.celebrationShown) {
    store.setCelebrationShown(true);
    isCelebration = true;
  }

  return {
    oldScore,
    newScore,
    earnedPoints,
    isCelebration,
    isGameOver: false,
  };
}

/**
 * Result of a penalty application.
 */
export interface PenaltyResult {
  oldScore: number;
  newScore: number;
  penalty: number;
  isGameOver: boolean;
  gameOverReason: string;
}

/**
 * Apply penalty when an invader reaches the bottom in word/letter mode.
 * Port of original reachedBottomSide() for non-math invaders.
 *
 * Penalty = word.length points deducted
 * Game over if: score reaches 0 OR 3 consecutive misses
 */
export function applyWordMissPenalty(invader: InvaderData): PenaltyResult {
  const store = useGameStore.getState();

  store.incrementMissedWords();
  store.incrementConsecutiveMisses();
  resetCombo();

  // Journey stat tracking
  if (store.mode === 'journey') {
    const stats = { ...store.journeyStats };
    if (invader.isMathQuestion) {
      stats.math = { ...stats.math };
      stats.math.missed++;
    } else if (store.isLetterMode) {
      stats.letters = { ...stats.letters };
      stats.letters.missed++;
    } else {
      stats.words = { ...stats.words };
      stats.words.wordsMissed++;
    }
    store.setJourneyStats(stats);
  }

  const penalty = invader.word.length;
  const oldScore = store.score;
  store.deductScore(penalty);
  const newScore = useGameStore.getState().score;

  // Check game over conditions
  const currentConsecutiveMisses = useGameStore.getState().consecutiveMisses;
  let isGameOver = false;
  let gameOverReason = '';

  if (newScore === 0) {
    isGameOver = true;
    gameOverReason = 'score_zero';
  } else if (currentConsecutiveMisses >= 3) {
    isGameOver = true;
    gameOverReason = 'consecutive_misses';
  }

  return { oldScore, newScore, penalty, isGameOver, gameOverReason };
}

/**
 * Apply penalty when a math invader reaches the bottom.
 * Port of original reachedBottomSide() for math invaders.
 *
 * Penalty = 4 points deducted
 * Game over if: score reaches 0 OR 5 consecutive misses
 */
export function applyMathMissPenalty(invader: InvaderData): PenaltyResult {
  const store = useGameStore.getState();

  store.incrementMissedWords();
  store.incrementConsecutiveMisses();
  resetCombo();

  // Journey stat tracking
  if (store.mode === 'journey') {
    const stats = { ...store.journeyStats };
    stats.math = { ...stats.math };
    stats.math.missed++;
    store.setJourneyStats(stats);
  }

  const penalty = 4;
  const oldScore = store.score;
  store.deductScore(penalty);
  const newScore = useGameStore.getState().score;

  const currentConsecutiveMisses = useGameStore.getState().consecutiveMisses;
  let isGameOver = false;
  let gameOverReason = '';

  if (newScore === 0) {
    isGameOver = true;
    gameOverReason = 'score_zero';
  } else if (currentConsecutiveMisses >= 5) {
    isGameOver = true;
    gameOverReason = 'consecutive_math_misses';
  }

  return { oldScore, newScore, penalty, isGameOver, gameOverReason };
}

/**
 * Apply scoring for a successfully completed sentence.
 * Port of original completeSentence().
 *
 * Award: flat 20 points
 * Resets consecutive misses and sentence failures.
 */
export function applySentenceCompleteScore(): ScoreUpdateResult {
  const store = useGameStore.getState();

  if (store.mode === 'journey') {
    const stats = { ...store.journeyStats };
    stats.sentences = { ...stats.sentences };
    stats.sentences.completed++;
    store.setJourneyStats(stats);
  }

  const earnedPoints = 20;
  const oldScore = store.score;
  store.addScore(earnedPoints);

  // Combo update
  store.incrementHits();
  updateComboMultiplier();
  store.resetConsecutiveMisses();
  store.resetSentenceFailures();

  const newScore = useGameStore.getState().score;

  let isCelebration = false;
  if (newScore >= 1000 && !store.celebrationShown) {
    store.setCelebrationShown(true);
    isCelebration = true;
  }

  return {
    oldScore,
    newScore,
    earnedPoints,
    isCelebration,
    isGameOver: false,
  };
}

/**
 * Apply penalty for a skipped/timed-out sentence.
 * Port of original skipSentence().
 *
 * Penalty: 15 points deducted
 * Game over if: score reaches 0 OR 2 consecutive sentence failures
 */
export function applySentenceSkipPenalty(): PenaltyResult {
  const store = useGameStore.getState();

  store.incrementMissedWords();
  resetCombo();

  if (store.mode === 'journey') {
    const stats = { ...store.journeyStats };
    stats.sentences = { ...stats.sentences };
    stats.sentences.skipped++;
    store.setJourneyStats(stats);
  }

  store.incrementSentenceFailures();

  const penalty = 15;
  const oldScore = store.score;
  store.deductScore(penalty);
  const newScore = useGameStore.getState().score;

  const failures = useGameStore.getState().consecutiveSentenceFailures;
  let isGameOver = false;
  let gameOverReason = '';

  if (newScore === 0) {
    isGameOver = true;
    gameOverReason = 'score_zero';
  } else if (failures >= 2) {
    isGameOver = true;
    gameOverReason = 'consecutive_sentence_failures';
  }

  return { oldScore, newScore, penalty, isGameOver, gameOverReason };
}
