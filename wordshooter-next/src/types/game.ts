// ---------------------------------------------------------------------------
// Word Shooter - Core TypeScript types
// ---------------------------------------------------------------------------

/** The four playable game modes. */
export type GameMode = 'words' | 'sentences' | 'math' | 'journey';

/** Top-level screen the app can show. */
export type Screen = 'start' | 'game' | 'celebration';

/** The sub-type that an individual invader represents. */
export type InvaderType = 'word' | 'math' | 'letter';

/** Word category keys available in the word bank. */
export type WordCategory = 'all' | 'animals' | 'plants' | 'science' | 'genz';

// ---------------------------------------------------------------------------
// Invader
// ---------------------------------------------------------------------------

export interface InvaderData {
  id: string;
  /** The word the player must type (for math this is the *answer*, e.g. "8"). */
  word: string;
  /** What is shown on screen (for math this is the *question*, e.g. "5+3"). */
  displayWord: string;
  /** For math invaders the answer string; for words/letters same as `word`. */
  answer: string;
  x: number;
  y: number;
  /** Vertical speed (px per frame). */
  speed: number;
  /** Horizontal drift (px per frame). */
  horizontalDrift: number;
  type: InvaderType;
  isDying: boolean;
  /** Timestamp (ms) when this invader was spawned. */
  spawnTime: number;
  /** Reference to the DOM element, managed outside React for perf. */
  elementRef: HTMLDivElement | null;
  /** Reference to the word sub-element for progress display. */
  wordElementRef: HTMLDivElement | null;
  /** Whether this is a math question invader. */
  isMathQuestion: boolean;
  /** Whether this is a single-letter invader. */
  isLetter: boolean;
  /** Whether this is a sentence invader (placeholder, always false for real invaders). */
  isSentence: boolean;
  /** Emoji displayed on this invader. */
  emoji: string;
}

// ---------------------------------------------------------------------------
// Bullet
// ---------------------------------------------------------------------------

export interface BulletData {
  id: string;
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  distanceTraveled: number;
  maxDistance: number;
  /** Rotation angle in radians. */
  angle: number;
  /** Reference to the DOM element. */
  elementRef: HTMLDivElement | null;
}

// ---------------------------------------------------------------------------
// Math
// ---------------------------------------------------------------------------

export interface MathQuestion {
  /** Display string shown to the player, e.g. "5+3". */
  question: string;
  /** The correct answer as a string, e.g. "8". */
  answer: string;
}

// ---------------------------------------------------------------------------
// Journey mode
// ---------------------------------------------------------------------------

export interface JourneyPhase {
  /** 1-based phase number. */
  phase: number;
  /** Inclusive score range [min, max]. */
  scoreRange: [number, number];
  /** The underlying mode used in this phase. */
  mode: GameMode;
  /** Whether single-letter invaders are active (phases 3 & 7). */
  isLetterMode: boolean;
  /** Invader speed multiplier (1x / 2x / 3x). */
  speedMultiplier: number;
  /** Sentence countdown duration in seconds (only relevant for sentence phases). */
  sentenceDuration: number;
  /** Human-readable name, e.g. "WORDS (2x)". */
  name: string;
  /** Accent colour for the phase banner. */
  color: string;
}

// ---------------------------------------------------------------------------
// Journey stats (per-category tracking)
// ---------------------------------------------------------------------------

export interface JourneyWordStats {
  wordsHit: number;
  wordsMissed: number;
  incorrectKeys: number;
  correctChars: number;
}

export interface JourneySentenceStats {
  completed: number;
  skipped: number;
  incorrectKeys: number;
  correctChars: number;
}

export interface JourneyMathStats {
  solved: number;
  missed: number;
  fastSolves: number;
  /** Cumulative solve time in milliseconds. */
  totalSolveTime: number;
}

export interface JourneyLetterStats {
  hit: number;
  missed: number;
  /** Letters per second (computed value, optional). */
  lps?: number;
}

export interface JourneyStats {
  words: JourneyWordStats;
  sentences: JourneySentenceStats;
  math: JourneyMathStats;
  letters: JourneyLetterStats;
}

// ---------------------------------------------------------------------------
// Rank system
// ---------------------------------------------------------------------------

export interface Rank {
  label: string;
  /** Minimum score to achieve this rank. */
  threshold: number;
}

// ---------------------------------------------------------------------------
// Mode settings
// ---------------------------------------------------------------------------

export interface ModeSettings {
  spawnInterval: number;
  invaderSpeed: number;
  maxInvaders: number;
}

// ---------------------------------------------------------------------------
// Full game state (used by the Zustand store)
// ---------------------------------------------------------------------------

export interface GameState {
  // Core state
  score: number;
  highestScore: number;
  currentInput: string;
  invaders: InvaderData[];
  bullets: BulletData[];
  targetInvaderId: string | null;
  isGameOver: boolean;
  isPaused: boolean;
  mode: GameMode;
  screen: Screen;
  sessionId: number;

  // Journey mode
  journeyPhase: number;
  phaseTransitioning: boolean;
  journeyStats: JourneyStats;

  // Spawning
  lastSpawn: number;
  spawnInterval: number;
  invaderSpeed: number;
  maxInvaders: number;

  // Mode flags
  isMathMode: boolean;
  isLetterMode: boolean;

  // Combo system
  consecutiveHits: number;
  comboMultiplier: number;

  // Stats tracking
  startTime: number | null;
  totalCharactersTyped: number;
  correctCharacters: number;
  incorrectAttempts: number;
  missedWords: number;
  consecutiveMisses: number;
  fastestWordTime: number | null;
  wordStartTime: number | null;

  // Performance history
  wpmHistory: number[];
  accuracyHistory: number[];
  lastPerformanceCheck: number | null;
  lastSpeedIncrease: number;

  // Math mode tracking
  mathQuestionsAnswered: number;
  totalMathSolveTime: number;
  mathQuestionStartTime: number | null;
  spmHistory: number[];
  solveTimeHistory: number[];
  currentMathQuestion: MathQuestion | null;

  // Sentences mode
  isSentenceActive: boolean;
  sentenceTimerId: ReturnType<typeof setInterval> | null;
  sentenceTimeLeft: number;
  currentSentenceText: string;
  usedSentences: number[];
  consecutiveSentenceFailures: number;

  // Speed multiplier
  speedMultiplier: number;

  // Celebration
  celebrationShown: boolean;

  // Audio
  isMuted: boolean;

  // UI state (transient, for animations/display)
  scoreAnimClass: string | null;
  inputError: boolean;
  isShooting: boolean;
  rocketRotation: number;
  sentenceCharIndex: number;
  sentenceDuration: number;
  sentenceAnimating: 'in' | 'out' | null;
  phaseTransition: { phase: number; name: string; color: string } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a fresh default JourneyStats object. */
export function createDefaultJourneyStats(): JourneyStats {
  return {
    words: { wordsHit: 0, wordsMissed: 0, incorrectKeys: 0, correctChars: 0 },
    sentences: { completed: 0, skipped: 0, incorrectKeys: 0, correctChars: 0 },
    math: { solved: 0, missed: 0, fastSolves: 0, totalSolveTime: 0 },
    letters: { hit: 0, missed: 0 },
  };
}

/** Mode settings map (matches original startGame()). */
export const MODE_SETTINGS: Record<GameMode, ModeSettings> = {
  words: { spawnInterval: 2500, invaderSpeed: 0.3, maxInvaders: 6 },
  sentences: { spawnInterval: 3000, invaderSpeed: 0.4, maxInvaders: 3 },
  math: { spawnInterval: 2500, invaderSpeed: 0.35, maxInvaders: 4 },
  journey: { spawnInterval: 2500, invaderSpeed: 0.3, maxInvaders: 5 },
};

/** Sentence speed durations: 1x = 24s, 2x = 18s, 3x = 12s. */
export const SENTENCE_SPEED_DURATIONS: Record<number, number> = {
  1: 24,
  2: 18,
  3: 12,
};
