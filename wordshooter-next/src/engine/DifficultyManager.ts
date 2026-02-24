// ── DifficultyManager ──
// Handles progressive difficulty scaling: invader speed increases,
// speed multiplier system for sentences, and journey-phase speeds.
// Port of the original progressive difficulty logic (~line 4748-4759).

import useGameStore from '@/store/gameStore';

/**
 * Get the effective game mode considering journey phase.
 * Mirrors original getJourneyPhaseMode().
 */
export function getEffectiveMode(): string {
  const state = useGameStore.getState();
  if (state.mode !== 'journey') return state.mode;
  return getJourneyPhaseMode(state.score);
}

/**
 * Determine the mode for a given score in journey mode.
 * Exact port of original getJourneyPhaseMode().
 */
export function getJourneyPhaseMode(score: number): string {
  if (score >= 900) return 'math';       // Phase 8: math 3x   (900-1000)
  if (score >= 800) return 'words';      // Phase 7: letters 3x (800-899, isLetterMode flag)
  if (score >= 500) return 'sentences';  // Phase 6: sentences 12s (500-799)
  if (score >= 400) return 'words';      // Phase 5: words 3x  (400-499)
  if (score >= 300) return 'math';       // Phase 4: math 2x   (300-399)
  if (score >= 200) return 'words';      // Phase 3: letters 2x (200-299, isLetterMode flag)
  if (score >= 100) return 'sentences';  // Phase 2: sentences 18s (100-199)
  return 'words';                        // Phase 1: words 2x  (0-99)
}

/**
 * Get the journey phase number from a given score.
 * Exact port of original getJourneyPhaseNumber().
 */
export function getJourneyPhaseNumber(score: number): number {
  if (score >= 900) return 8;
  if (score >= 800) return 7;
  if (score >= 500) return 6;
  if (score >= 400) return 5;
  if (score >= 300) return 4;
  if (score >= 200) return 3;
  if (score >= 100) return 2;
  return 1;
}

/**
 * Phase speed multipliers for journey mode.
 * Maps journey phase number to speed multiplier.
 */
export const JOURNEY_PHASE_SPEEDS: Record<number, number> = {
  1: 2,  // words 2x
  2: 1,  // sentences 18s
  3: 2,  // letters 2x
  4: 2,  // math 2x
  5: 3,  // words 3x
  6: 1,  // sentences 12s
  7: 3,  // letters 3x
  8: 3,  // math 3x
};

/**
 * Phase names for the transition overlay.
 */
export const JOURNEY_PHASE_NAMES: Record<number, string> = {
  1: 'WORDS (2x)',
  2: 'SENTENCES (18s)',
  3: 'LETTERS (2x)',
  4: 'MATH (2x)',
  5: 'WORDS (3x)',
  6: 'SENTENCES (12s)',
  7: 'LETTERS (3x)',
  8: 'MATH (3x)',
};

/**
 * Phase accent colors for the transition overlay.
 */
export const JOURNEY_PHASE_COLORS: Record<number, string> = {
  1: '#ffffff',
  2: '#4A90E2',
  3: '#00D4FF',
  4: '#E67E22',
  5: '#FF4500',
  6: '#4A90E2',
  7: '#00D4FF',
  8: '#E67E22',
};

/**
 * Apply progressive difficulty increase.
 * Called each frame from the game loop.
 *
 * Every 20 points scored, increase invader speed:
 * - Math mode: +0.05 per step
 * - Words/letters mode: +0.1 per step
 * - Sentences mode: no speed change (duration-based)
 *
 * Exact port of original logic at lines 4748-4759.
 */
export function applyProgressiveDifficulty(): void {
  const state = useGameStore.getState();

  if (state.score <= 0) return;

  const currentMode =
    state.mode === 'journey'
      ? getJourneyPhaseMode(state.score)
      : state.mode;

  const currentThreshold = Math.floor(state.score / 20) * 20;

  if (currentThreshold > state.lastSpeedIncrease) {
    const steps = (currentThreshold - state.lastSpeedIncrease) / 20;

    let newSpeed = state.invaderSpeed;
    if (currentMode === 'math') {
      newSpeed += 0.05 * steps;
    } else if (currentMode !== 'sentences') {
      newSpeed += 0.1 * steps;
    }

    useGameStore.setState({
      invaderSpeed: newSpeed,
      lastSpeedIncrease: currentThreshold,
    });
  }
}

/**
 * Get the sentence duration in seconds based on mode and speed multiplier.
 *
 * Journey mode:
 *   Phase 2 (100-199) = 18s
 *   Phase 6 (500-799) = 12s
 *
 * Standalone sentences mode:
 *   1x = 24s, 2x = 18s, 3x = 12s
 */
export function getSentenceDuration(): number {
  const state = useGameStore.getState();

  if (state.mode === 'journey') {
    // Phase 6 (500-799) = 12s, Phase 2 (100-199) = 18s
    return state.journeyPhase === 6 ? 12 : 18;
  }

  // Standalone sentences mode: lookup by speed multiplier
  const durations: Record<number, number> = { 1: 24, 2: 18, 3: 12 };
  return durations[state.speedMultiplier] || 24;
}

/**
 * Get the spawn interval based on current mode.
 * Letter mode spawns faster (800ms vs normal 2500ms).
 */
export function getSpawnInterval(): number {
  const state = useGameStore.getState();
  return state.isLetterMode ? 800 : state.spawnInterval;
}

/**
 * Get the max invaders for letter mode (10, much higher than normal).
 */
export function getMaxLetterInvaders(): number {
  return 10;
}
