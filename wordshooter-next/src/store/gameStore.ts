// ---------------------------------------------------------------------------
// Word Shooter - Zustand game store
// Mirrors the original `game` object from index.html with typed state and
// action methods. All game state flows through this single store.
// ---------------------------------------------------------------------------

import { create } from 'zustand';
import type {
  GameMode,
  GameState,
  Screen,
  InvaderData,
  BulletData,
  MathQuestion,
  JourneyStats,
} from '@/types/game';
import { MODE_SETTINGS, createDefaultJourneyStats } from '@/types/game';

// ---------------------------------------------------------------------------
// Actions interface
// ---------------------------------------------------------------------------

export interface GameActions {
  // ── Lifecycle ────────────────────────────────────────────────────────
  /** Start a new game with the given mode. Resets all state. */
  startGame: (mode: GameMode) => void;
  /** Reset the game back to the initial idle state (start screen). */
  resetGame: () => void;
  /** Switch to a different screen. */
  setScreen: (screen: Screen) => void;
  /** Toggle pause on/off. */
  togglePause: () => void;
  /** Toggle audio mute on/off. */
  toggleMute: () => void;

  // ── Session ──────────────────────────────────────────────────────────
  incrementSessionId: () => number;

  // ── Score ────────────────────────────────────────────────────────────
  setScore: (score: number) => void;
  addScore: (points: number) => void;
  deductScore: (penalty: number) => void;

  // ── Core flags ───────────────────────────────────────────────────────
  setGameOver: (value: boolean) => void;
  setPaused: (value: boolean) => void;
  setCurrentInput: (input: string) => void;
  setTargetInvaderId: (id: string | null) => void;

  // ── Invader management ───────────────────────────────────────────────
  addInvader: (invader: InvaderData) => void;
  removeInvader: (id: string) => void;
  setInvaderDying: (id: string) => void;
  updateInvaders: (invaders: InvaderData[]) => void;
  clearInvaders: () => void;

  // ── Bullet management ───────────────────────────────────────────────
  addBullet: (bullet: BulletData) => void;
  removeBullet: (id: string) => void;
  updateBullets: (bullets: BulletData[]) => void;

  // ── Combo ────────────────────────────────────────────────────────────
  incrementHits: () => void;
  resetCombo: () => void;
  setComboMultiplier: (multiplier: number) => void;

  // ── Stats ────────────────────────────────────────────────────────────
  incrementMissedWords: () => void;
  incrementConsecutiveMisses: () => void;
  resetConsecutiveMisses: () => void;
  incrementCorrectCharacters: () => void;
  incrementIncorrectAttempts: () => void;
  incrementTotalCharactersTyped: () => void;
  setWordStartTime: (time: number | null) => void;
  setFastestWordTime: (time: number) => void;

  // ── Performance history ──────────────────────────────────────────────
  pushWpmHistory: (wpm: number) => void;
  pushAccuracyHistory: (accuracy: number) => void;
  pushSpmHistory: (spm: number) => void;
  pushSolveTimeHistory: (time: number) => void;
  setLastPerformanceCheck: (time: number) => void;
  setLastSpeedIncrease: (threshold: number) => void;

  // ── Math mode ────────────────────────────────────────────────────────
  setMathMode: (value: boolean) => void;
  setCurrentMathQuestion: (q: MathQuestion | null) => void;
  setMathQuestionStartTime: (time: number | null) => void;
  incrementMathQuestionsAnswered: () => void;
  addMathSolveTime: (time: number) => void;

  // ── Letter mode ──────────────────────────────────────────────────────
  setLetterMode: (value: boolean) => void;

  // ── Sentences mode ───────────────────────────────────────────────────
  setSentenceActive: (active: boolean) => void;
  setSentenceTimerId: (id: ReturnType<typeof setInterval> | null) => void;
  setSentenceTimeLeft: (time: number) => void;
  decrementSentenceTimeLeft: () => void;
  setCurrentSentenceText: (text: string) => void;
  addUsedSentence: (index: number) => void;
  clearUsedSentences: () => void;
  incrementSentenceFailures: () => void;
  resetSentenceFailures: () => void;

  // ── Journey ──────────────────────────────────────────────────────────
  setJourneyPhase: (phase: number) => void;
  setPhaseTransitioning: (value: boolean) => void;
  setJourneyStats: (stats: JourneyStats) => void;

  // ── Speed / spawning ─────────────────────────────────────────────────
  setSpeedMultiplier: (multiplier: number) => void;
  setInvaderSpeed: (speed: number) => void;
  setLastSpawn: (time: number) => void;

  // ── Celebration ──────────────────────────────────────────────────────
  setCelebrationShown: (value: boolean) => void;

  // ── Full cleanup ─────────────────────────────────────────────────────
  /** Nuclear cleanup of any active game session (mirrors original fullCleanup). */
  fullCleanup: () => void;

  // ── Generic setter ───────────────────────────────────────────────────
  /** Update arbitrary slices of state. */
  patch: (partial: Partial<GameState>) => void;
}

// ---------------------------------------------------------------------------
// Store type
// ---------------------------------------------------------------------------

export type GameStore = GameState & GameActions;

// ---------------------------------------------------------------------------
// Initial state factory
// ---------------------------------------------------------------------------

function createInitialState(): GameState {
  return {
    // Core state
    score: 0,
    highestScore: 0,
    currentInput: '',
    invaders: [],
    bullets: [],
    targetInvaderId: null,
    isGameOver: false,
    isPaused: false,
    mode: 'words',
    screen: 'start',
    sessionId: 0,

    // Journey mode
    journeyPhase: 1,
    phaseTransitioning: false,
    journeyStats: createDefaultJourneyStats(),

    // Spawning
    lastSpawn: 0,
    spawnInterval: 2500,
    invaderSpeed: 0.3,
    maxInvaders: 3,

    // Mode flags
    isMathMode: false,
    isLetterMode: false,

    // Combo system
    consecutiveHits: 0,
    comboMultiplier: 1,

    // Stats tracking
    startTime: null,
    totalCharactersTyped: 0,
    correctCharacters: 0,
    incorrectAttempts: 0,
    missedWords: 0,
    consecutiveMisses: 0,
    fastestWordTime: null,
    wordStartTime: null,

    // Performance history
    wpmHistory: [],
    accuracyHistory: [],
    lastPerformanceCheck: null,
    lastSpeedIncrease: 0,

    // Math mode tracking
    mathQuestionsAnswered: 0,
    totalMathSolveTime: 0,
    mathQuestionStartTime: null,
    spmHistory: [],
    solveTimeHistory: [],
    currentMathQuestion: null,

    // Sentences mode
    isSentenceActive: false,
    sentenceTimerId: null,
    sentenceTimeLeft: 30,
    currentSentenceText: '',
    usedSentences: [],
    consecutiveSentenceFailures: 0,

    // Speed multiplier
    speedMultiplier: 1,

    // Celebration
    celebrationShown: false,

    // Audio
    isMuted: false,

    // UI state
    scoreAnimClass: null,
    inputError: false,
    isShooting: false,
    rocketRotation: 0,
    sentenceCharIndex: 0,
    sentenceDuration: 24,
    sentenceAnimating: null,
    phaseTransition: null,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  // ── Lifecycle ────────────────────────────────────────────────────────

  startGame: (mode: GameMode) => {
    const state = get();
    // Clear any active sentence timer before starting a new game
    if (state.sentenceTimerId) {
      clearInterval(state.sentenceTimerId);
    }

    const settings = MODE_SETTINGS[mode];
    const now = Date.now();

    set({
      ...createInitialState(),
      // Bump session id so stale async callbacks can self-abort
      sessionId: state.sessionId + 1,
      // Preserve highest score and mute preference across games
      highestScore: state.highestScore,
      isMuted: state.isMuted,

      // Set the mode and screen
      mode,
      screen: 'game',

      // Apply mode-specific settings
      spawnInterval: settings.spawnInterval,
      invaderSpeed: settings.invaderSpeed,
      maxInvaders: settings.maxInvaders,

      // Math mode flag for standalone math mode
      isMathMode: mode === 'math',

      // Speed: journey starts at 2x, everything else at 1x
      speedMultiplier: mode === 'journey' ? 2 : 1,

      // Timestamps
      startTime: now,
      lastPerformanceCheck: now,
    });
  },

  resetGame: () => {
    const state = get();
    // Clear any running sentence timer before resetting
    if (state.sentenceTimerId) {
      clearInterval(state.sentenceTimerId);
    }

    set({
      ...createInitialState(),
      // Preserve highest score and mute preference across resets
      highestScore: state.highestScore,
      isMuted: state.isMuted,
      // Bump session id
      sessionId: state.sessionId + 1,
    });
  },

  setScreen: (screen: Screen) => set({ screen }),

  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),

  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

  // ── Session ──────────────────────────────────────────────────────────

  incrementSessionId: () => {
    const newId = get().sessionId + 1;
    set({ sessionId: newId });
    return newId;
  },

  // ── Score ────────────────────────────────────────────────────────────

  setScore: (score) => set({ score }),
  addScore: (points) =>
    set((s) => {
      const newScore = s.score + points;
      return {
        score: newScore,
        highestScore: Math.max(newScore, s.highestScore),
      };
    }),
  deductScore: (penalty) =>
    set((s) => ({ score: Math.max(0, s.score - penalty) })),

  // ── Core flags ───────────────────────────────────────────────────────

  setGameOver: (value) => set({ isGameOver: value }),
  setPaused: (value) => set({ isPaused: value }),
  setCurrentInput: (input) => set({ currentInput: input }),
  setTargetInvaderId: (id) => set({ targetInvaderId: id }),

  // ── Invaders ─────────────────────────────────────────────────────────

  addInvader: (invader) =>
    set((s) => ({ invaders: [...s.invaders, invader] })),
  removeInvader: (id) =>
    set((s) => ({ invaders: s.invaders.filter((inv) => inv.id !== id) })),
  setInvaderDying: (id) =>
    set((s) => ({
      invaders: s.invaders.map((inv) =>
        inv.id === id ? { ...inv, isDying: true } : inv
      ),
    })),
  updateInvaders: (invaders) => set({ invaders }),
  clearInvaders: () => set({ invaders: [] }),

  // ── Bullets ──────────────────────────────────────────────────────────

  addBullet: (bullet) => set((s) => ({ bullets: [...s.bullets, bullet] })),
  removeBullet: (id) =>
    set((s) => ({ bullets: s.bullets.filter((b) => b.id !== id) })),
  updateBullets: (bullets) => set({ bullets }),

  // ── Combo ────────────────────────────────────────────────────────────

  incrementHits: () =>
    set((s) => ({ consecutiveHits: s.consecutiveHits + 1 })),
  resetCombo: () =>
    set({ consecutiveHits: 0, comboMultiplier: 1 }),
  setComboMultiplier: (multiplier) => set({ comboMultiplier: multiplier }),

  // ── Stats ────────────────────────────────────────────────────────────

  incrementMissedWords: () =>
    set((s) => ({ missedWords: s.missedWords + 1 })),
  incrementConsecutiveMisses: () =>
    set((s) => ({ consecutiveMisses: s.consecutiveMisses + 1 })),
  resetConsecutiveMisses: () => set({ consecutiveMisses: 0 }),
  incrementCorrectCharacters: () =>
    set((s) => ({ correctCharacters: s.correctCharacters + 1 })),
  incrementIncorrectAttempts: () =>
    set((s) => ({ incorrectAttempts: s.incorrectAttempts + 1 })),
  incrementTotalCharactersTyped: () =>
    set((s) => ({ totalCharactersTyped: s.totalCharactersTyped + 1 })),
  setWordStartTime: (time) => set({ wordStartTime: time }),
  setFastestWordTime: (time) =>
    set((s) => ({
      fastestWordTime:
        s.fastestWordTime === null || time < s.fastestWordTime
          ? time
          : s.fastestWordTime,
    })),

  // ── Performance history ──────────────────────────────────────────────

  pushWpmHistory: (wpm) =>
    set((s) => ({ wpmHistory: [...s.wpmHistory, wpm] })),
  pushAccuracyHistory: (accuracy) =>
    set((s) => ({ accuracyHistory: [...s.accuracyHistory, accuracy] })),
  pushSpmHistory: (spm) =>
    set((s) => ({ spmHistory: [...s.spmHistory, spm] })),
  pushSolveTimeHistory: (time) =>
    set((s) => ({ solveTimeHistory: [...s.solveTimeHistory, time] })),
  setLastPerformanceCheck: (time) => set({ lastPerformanceCheck: time }),
  setLastSpeedIncrease: (threshold) => set({ lastSpeedIncrease: threshold }),

  // ── Math mode ────────────────────────────────────────────────────────

  setMathMode: (value) => set({ isMathMode: value }),
  setCurrentMathQuestion: (q) => set({ currentMathQuestion: q }),
  setMathQuestionStartTime: (time) => set({ mathQuestionStartTime: time }),
  incrementMathQuestionsAnswered: () =>
    set((s) => ({
      mathQuestionsAnswered: s.mathQuestionsAnswered + 1,
    })),
  addMathSolveTime: (time) =>
    set((s) => ({ totalMathSolveTime: s.totalMathSolveTime + time })),

  // ── Letter mode ──────────────────────────────────────────────────────

  setLetterMode: (value) => set({ isLetterMode: value }),

  // ── Sentences mode ───────────────────────────────────────────────────

  setSentenceActive: (active) => set({ isSentenceActive: active }),
  setSentenceTimerId: (id) => set({ sentenceTimerId: id }),
  setSentenceTimeLeft: (time) => set({ sentenceTimeLeft: time }),
  decrementSentenceTimeLeft: () =>
    set((s) => ({ sentenceTimeLeft: s.sentenceTimeLeft - 1 })),
  setCurrentSentenceText: (text) => set({ currentSentenceText: text }),
  addUsedSentence: (index) =>
    set((s) => ({ usedSentences: [...s.usedSentences, index] })),
  clearUsedSentences: () => set({ usedSentences: [] }),
  incrementSentenceFailures: () =>
    set((s) => ({
      consecutiveSentenceFailures: s.consecutiveSentenceFailures + 1,
    })),
  resetSentenceFailures: () => set({ consecutiveSentenceFailures: 0 }),

  // ── Journey ──────────────────────────────────────────────────────────

  setJourneyPhase: (phase) => set({ journeyPhase: phase }),
  setPhaseTransitioning: (value) => set({ phaseTransitioning: value }),
  setJourneyStats: (stats) => set({ journeyStats: stats }),

  // ── Speed / spawning ─────────────────────────────────────────────────

  setSpeedMultiplier: (multiplier) => set({ speedMultiplier: multiplier }),
  setInvaderSpeed: (speed) => set({ invaderSpeed: speed }),
  setLastSpawn: (time) => set({ lastSpawn: time }),

  // ── Celebration ──────────────────────────────────────────────────────

  setCelebrationShown: (value) => set({ celebrationShown: value }),

  // ── Full cleanup ─────────────────────────────────────────────────────

  fullCleanup: () => {
    const state = get();
    if (state.sentenceTimerId) {
      clearInterval(state.sentenceTimerId);
    }
    set((s) => ({
      sessionId: s.sessionId + 1,
      isGameOver: true,
      isPaused: false,
      isSentenceActive: false,
      currentSentenceText: '',
      currentInput: '',
      invaders: [],
      bullets: [],
      isMathMode: false,
      isLetterMode: false,
      phaseTransitioning: false,
      targetInvaderId: null,
      sentenceTimerId: null,
    }));
  },

  // ── Generic setter ───────────────────────────────────────────────────

  patch: (partial) => set(partial),
}));

// ---------------------------------------------------------------------------
// Convenience selectors
// ---------------------------------------------------------------------------

/** Select the current journey stats sub-object. */
export const selectJourneyStats = (s: GameStore): JourneyStats =>
  s.journeyStats;

/** Select whether the game is actively running (not paused, not over). */
export const selectIsPlaying = (s: GameStore): boolean =>
  s.screen === 'game' && !s.isGameOver && !s.isPaused;

export default useGameStore;
export { useGameStore };
