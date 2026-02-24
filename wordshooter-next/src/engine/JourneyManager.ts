// ── JourneyManager ──
// Port of the 8-phase journey state machine from the original index.html:
//   checkJourneyPhaseTransition() (~line 2815),
//   triggerPhaseTransition() (~line 2878),
//   getJourneyPhaseNumber() (~line 2802),
//   getJourneyPhaseMode() (~line 2788).
//
// Journey phases and their score thresholds:
//   Phase 1:    0-99   words 2x
//   Phase 2:  100-199  sentences 18s
//   Phase 3:  200-299  letters 2x
//   Phase 4:  300-399  math 2x
//   Phase 5:  400-499  words 3x
//   Phase 6:  500-799  sentences 12s
//   Phase 7:  800-899  letters 3x
//   Phase 8:  900-1000 math 3x

import useGameStore from '@/store/gameStore';
import {
  getJourneyPhaseNumber,
  getJourneyPhaseMode,
  JOURNEY_PHASE_SPEEDS,
  JOURNEY_PHASE_NAMES,
  JOURNEY_PHASE_COLORS,
} from './DifficultyManager';
import { resetCombo } from './ScoreManager';

/**
 * Result of a phase transition check.
 */
export interface PhaseTransitionResult {
  /** Whether a phase change occurred */
  changed: boolean;
  /** The new phase number (1-8) */
  newPhase: number;
  /** The old phase number (1-8) */
  oldPhase: number;
  /** The new effective mode for this phase */
  newMode: string;
  /** Whether this is a regression (score dropped to lower phase) */
  isRegression: boolean;
  /** Whether a forward transition overlay should be shown */
  showTransition: boolean;
  /** Phase display name (e.g. "WORDS (2x)") */
  phaseName: string;
  /** Phase accent color */
  phaseColor: string;
  /** Speed multiplier for this phase */
  speedMultiplier: number;
  /** Whether letter mode is active in this phase */
  isLetterMode: boolean;
  /** Whether math mode is active in this phase */
  isMathMode: boolean;
}

/**
 * Check if the player's score has crossed a journey phase boundary
 * and determine what transition is needed.
 *
 * Exact port of original checkJourneyPhaseTransition().
 *
 * @returns A PhaseTransitionResult describing what happened, or null if no change
 */
export function checkJourneyPhaseTransition(): PhaseTransitionResult | null {
  const state = useGameStore.getState();

  // Only applies to journey mode
  if (state.mode !== 'journey') return null;

  // Don't transition while already transitioning
  if (state.phaseTransitioning) return null;

  const newPhase = getJourneyPhaseNumber(state.score);
  const oldPhase = state.journeyPhase;

  if (newPhase === oldPhase) return null;

  // Phase has changed
  const newMode = getJourneyPhaseMode(state.score);
  const speedMultiplier = JOURNEY_PHASE_SPEEDS[newPhase] || 1;
  const isLetterMode = newPhase === 3 || newPhase === 7;
  const isMathMode = newMode === 'math';
  const isRegression = newPhase < oldPhase;

  // Update store with new phase
  useGameStore.setState({
    journeyPhase: newPhase,
  });

  // Apply speed multiplier
  useGameStore.setState({
    speedMultiplier,
  });

  if (isRegression) {
    // Score regression (dropped to lower phase) - switch mode silently, no overlay
    useGameStore.setState({
      isSentenceActive: false,
      invaders: [], // invaders will be cleaned up by the caller
      isMathMode,
      isLetterMode,
    });

    return {
      changed: true,
      newPhase,
      oldPhase,
      newMode,
      isRegression: true,
      showTransition: false,
      phaseName: JOURNEY_PHASE_NAMES[newPhase] || '',
      phaseColor: JOURNEY_PHASE_COLORS[newPhase] || '#fff',
      speedMultiplier,
      isLetterMode,
      isMathMode,
    };
  }

  // Forward transition - show overlay
  return {
    changed: true,
    newPhase,
    oldPhase,
    newMode,
    isRegression: false,
    showTransition: true,
    phaseName: JOURNEY_PHASE_NAMES[newPhase] || '',
    phaseColor: JOURNEY_PHASE_COLORS[newPhase] || '#fff',
    speedMultiplier,
    isLetterMode,
    isMathMode,
  };
}

/**
 * Begin a forward phase transition.
 * Port of triggerPhaseTransition() (~line 2878).
 *
 * This sets up the store state for the transition. The actual visual overlay
 * and resume timer are handled by the React component or the GameEngine.
 *
 * Sets phaseTransitioning=true, isPaused=true, clears invaders and input.
 * After 2 seconds (handled by caller), call completePhaseTransition().
 *
 * @param result  The PhaseTransitionResult from checkJourneyPhaseTransition()
 */
export function beginPhaseTransition(result: PhaseTransitionResult): void {
  if (useGameStore.getState().phaseTransitioning) return;

  resetCombo();

  useGameStore.setState({
    phaseTransitioning: true,
    isPaused: true,
    isSentenceActive: false,
    invaders: [], // invaders will be cleaned up externally
    currentInput: '',
    targetInvaderId: null,
    wordStartTime: null,
    isMathMode: result.isMathMode,
    isLetterMode: result.isLetterMode,
    // Reset invader speed for the new phase (all phases start at base 0.3)
    invaderSpeed: 0.3,
  });
}

/**
 * Complete the phase transition after the 2-second overlay.
 * Unpauses the game and kicks off the correct spawner for the new phase.
 *
 * @param result  The PhaseTransitionResult that started this transition
 * @returns The new mode string, so the caller knows whether to start
 *          sentence spawning, math spawning, or let the game loop handle words
 */
export function completePhaseTransition(
  result: PhaseTransitionResult
): string {
  useGameStore.setState({
    isPaused: false,
    phaseTransitioning: false,
  });

  return result.newMode;
}

/**
 * Get the current journey phase info without triggering any transitions.
 * Useful for UI display.
 */
export function getCurrentPhaseInfo(): {
  phase: number;
  mode: string;
  name: string;
  color: string;
  speedMultiplier: number;
  isLetterMode: boolean;
  isMathMode: boolean;
} {
  const state = useGameStore.getState();
  const phase = state.journeyPhase;
  const mode = getJourneyPhaseMode(state.score);

  return {
    phase,
    mode,
    name: JOURNEY_PHASE_NAMES[phase] || '',
    color: JOURNEY_PHASE_COLORS[phase] || '#fff',
    speedMultiplier: JOURNEY_PHASE_SPEEDS[phase] || 1,
    isLetterMode: phase === 3 || phase === 7,
    isMathMode: mode === 'math',
  };
}

/**
 * Get the per-phase stats accumulated during a journey run.
 * Returns the stats object from the store.
 */
export function getJourneyStats() {
  return useGameStore.getState().journeyStats;
}

/**
 * Reset journey stats back to defaults.
 */
export function resetJourneyStats(): void {
  useGameStore.getState().setJourneyStats({
    words: { wordsHit: 0, wordsMissed: 0, incorrectKeys: 0, correctChars: 0 },
    sentences: { completed: 0, skipped: 0, incorrectKeys: 0, correctChars: 0 },
    math: { solved: 0, missed: 0, fastSolves: 0, totalSolveTime: 0 },
    letters: { hit: 0, missed: 0 },
  });
}
