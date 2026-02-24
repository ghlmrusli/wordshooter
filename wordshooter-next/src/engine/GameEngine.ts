// ── GameEngine ──
// Main game loop using requestAnimationFrame with session IDs.
// Port of the original gameLoop() (~line 4671), startGame() (~line 5235),
// and fullCleanup() (~line 5018).
//
// Uses a class-based approach with start()/stop() methods.
// Reads/writes from the Zustand store via getState()/setState().
// Updates invader and bullet positions through the Zustand store so React
// can re-render them each frame.

import useGameStore from '@/store/gameStore';
import { InvaderData, BulletData } from '@/types/game';
import { spawnInvader, spawnMathInvader } from './SpawnManager';
import { applyProgressiveDifficulty, getEffectiveMode } from './DifficultyManager';
import {
  applyWordMissPenalty,
  applyMathMissPenalty,
} from './ScoreManager';
import { checkJourneyPhaseTransition } from './JourneyManager';

// ── Callback types for side effects that require DOM / React interaction ──

export interface GameEngineCallbacks {
  /** Get the viewport width (window.innerWidth) */
  getViewportWidth: () => number;
  /** Get the viewport height (window.innerHeight) */
  getViewportHeight: () => number;
  /** Called when an invader is spawned and needs a DOM element created */
  onInvaderSpawned: (invader: InvaderData) => void;
  /** Called when an invader reaches the bottom and should be removed from DOM */
  onInvaderMissed: (invader: InvaderData) => void;
  /** Called when score changes (for animation) */
  onScoreChange: (oldScore: number, newScore: number, isDecrease: boolean) => void;
  /** Called when game over is triggered */
  onGameOver: () => void;
  /** Called when a math invader needs to be respawned after miss */
  onMathInvaderMissed: (invader: InvaderData) => void;
  /** Called when journey phase transition is needed */
  onPhaseTransition: (result: NonNullable<ReturnType<typeof checkJourneyPhaseTransition>>) => void;
  /** Called to spawn a sentence (sentence spawning is event-driven) */
  onSentenceNeeded: () => void;
  /** Remove a bullet's DOM element */
  removeBulletElement: (bulletId: string) => void;
  /** Remove an invader's DOM element */
  removeInvaderElement: (invaderId: string) => void;
}

export class GameEngine {
  private _sessionId: number = 0;
  private _lastTime: number = 0;
  private _running: boolean = false;
  private _rafId: number | null = null;
  private _callbacks: GameEngineCallbacks | null = null;
  private _sentenceRequested: boolean = false;

  /**
   * Register callbacks for DOM/React interactions.
   * Must be called before start().
   */
  setCallbacks(callbacks: GameEngineCallbacks): void {
    this._callbacks = callbacks;
  }

  /**
   * Start the game loop for a specific session.
   * The session ID is compared on each frame; if it no longer matches
   * (because stop() was called or a new game started), the loop silently dies.
   */
  start(): void {
    // Bump session to invalidate any previous loop
    this._sessionId++;
    const mySession = this._sessionId;

    this._running = true;
    this._lastTime = performance.now();
    this._sentenceRequested = false;

    const loop = (timestamp: number) => {
      // Ghost callback check: if session changed, bail silently
      if (mySession !== this._sessionId) return;
      if (!this._running) return;

      this._tick(timestamp);

      this._rafId = requestAnimationFrame(loop);
    };

    this._rafId = requestAnimationFrame(loop);
  }

  /**
   * Stop the game loop.
   * Increments the session ID so any pending RAF callbacks self-abort.
   */
  stop(): void {
    this._running = false;
    this._sessionId++;

    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  /**
   * Get the current session ID (for external session-aware timeouts).
   */
  getSessionId(): number {
    return this._sessionId;
  }

  /**
   * Check if a session ID is still current.
   */
  isSessionCurrent(sessionId: number): boolean {
    return sessionId === this._sessionId && this._running;
  }

  /**
   * Reset the sentence-requested flag so the engine can request a new sentence.
   * Called after a sentence completes or times out.
   */
  resetSentenceRequest(): void {
    this._sentenceRequested = false;
  }

  // ── Private: single frame update ──

  private _tick(timestamp: number): void {
    const state = useGameStore.getState();

    if (state.isGameOver) {
      this.stop();
      return;
    }

    if (state.isPaused) {
      this._lastTime = timestamp;
      return;
    }

    const viewportWidth = this._callbacks?.getViewportWidth() ?? 1024;
    const viewportHeight = this._callbacks?.getViewportHeight() ?? 768;

    // ── Spawn invaders ──
    this._handleSpawning(timestamp, viewportWidth);

    // ── Update invader positions (through Zustand store for React rendering) ──
    this._updateInvaders(viewportWidth, viewportHeight);

    // ── Update bullets (through Zustand store for React rendering) ──
    this._updateBullets();

    // ── Sample performance history every 2 seconds ──
    this._samplePerformanceHistory();

    // ── Progressive difficulty ──
    applyProgressiveDifficulty();

    // ── Check journey phase transitions ──
    const phaseResult = checkJourneyPhaseTransition();
    if (phaseResult?.changed && phaseResult.showTransition) {
      this._callbacks?.onPhaseTransition(phaseResult);
    }

    this._lastTime = timestamp;
  }

  // ── Spawning ──

  private _handleSpawning(timestamp: number, viewportWidth: number): void {
    const state = useGameStore.getState();
    const currentMode = getEffectiveMode();

    // Sentences mode: spawn is event-driven, not time-based
    if (currentMode === 'sentences') {
      // Only request a sentence once, to avoid per-frame spam
      if (!state.isSentenceActive && !this._sentenceRequested) {
        this._sentenceRequested = true;
        this._callbacks?.onSentenceNeeded();
      }
      return;
    }

    // Math mode: only spawn if no active invaders
    if (state.isMathMode) {
      const active = state.invaders.filter((z) => !z.isDying).length;
      if (active === 0) {
        const invader = spawnMathInvader(viewportWidth);
        if (invader) {
          this._callbacks?.onInvaderSpawned(invader);
        }
      }
      return;
    }

    // Words/letters mode: time-based spawning
    const spawnInterval = state.isLetterMode ? 800 : state.spawnInterval;

    if (timestamp - state.lastSpawn > spawnInterval) {
      const invader = spawnInvader(viewportWidth);
      if (invader) {
        this._callbacks?.onInvaderSpawned(invader);
      }
      useGameStore.getState().setLastSpawn(timestamp);
    }
  }

  // ── Invader position updates (store-based, React renders) ──

  private _updateInvaders(viewportWidth: number, viewportHeight: number): void {
    const state = useGameStore.getState();
    if (state.invaders.length === 0) return;

    const survivingInvaders: InvaderData[] = [];
    const missedInvaders: InvaderData[] = [];

    // Fade boundaries: start fading at 65%, remove at 70%
    const fadeEnd = viewportHeight * 0.70;

    for (const invader of state.invaders) {
      if (invader.isDying) {
        // Keep dying invaders in the array — they'll be removed by timeout
        survivingInvaders.push(invader);
        continue;
      }

      // Update position
      let newY = invader.y + invader.speed;
      let newX = invader.x + invader.horizontalDrift;
      let newDrift = invader.horizontalDrift;

      // Estimate element width for boundary checking
      const estimatedWidth = invader.isLetter ? 60 : (invader.displayWord?.length ?? invader.word.length) * 15 + 40;

      // Bounce off left and right edges
      if (newX < 0) {
        newX = 0;
        newDrift *= -1;
      } else if (newX + estimatedWidth > viewportWidth) {
        newX = viewportWidth - estimatedWidth;
        newDrift *= -1;
      }

      // Check if reached the boundary (70% down)
      if (newY >= fadeEnd) {
        missedInvaders.push(invader);
        continue; // Don't add to surviving list
      }

      // Create updated invader with new position
      survivingInvaders.push({
        ...invader,
        y: newY,
        x: newX,
        horizontalDrift: newDrift,
      });
    }

    // Update store with new positions (triggers React re-render)
    if (missedInvaders.length > 0 || survivingInvaders.length !== state.invaders.length) {
      useGameStore.setState({ invaders: survivingInvaders });
    } else {
      // Even if no invaders were removed, positions changed
      useGameStore.setState({ invaders: survivingInvaders });
    }

    // Handle missed invaders
    for (const invader of missedInvaders) {
      this._handleInvaderReachedBottom(invader);
      this._callbacks?.onInvaderMissed(invader);
    }
  }

  // ── Handle invader reaching the bottom (missed) ──

  private _handleInvaderReachedBottom(invader: InvaderData): void {
    const state = useGameStore.getState();

    if (state.isMathMode && invader.isMathQuestion) {
      const result = applyMathMissPenalty(invader);

      this._callbacks?.onScoreChange(result.oldScore, result.newScore, true);

      if (result.isGameOver) {
        this._callbacks?.onGameOver();
        return;
      }

      // Schedule next math invader spawn
      this._callbacks?.onMathInvaderMissed(invader);
    } else {
      const result = applyWordMissPenalty(invader);

      this._callbacks?.onScoreChange(result.oldScore, result.newScore, true);

      if (result.isGameOver) {
        this._callbacks?.onGameOver();
        return;
      }
    }

    // Clean up invader from store
    this._callbacks?.removeInvaderElement(invader.id);
  }

  // ── Bullet updates (store-based, React renders) ──

  private _updateBullets(): void {
    const state = useGameStore.getState();
    if (state.bullets.length === 0) return;

    const survivingBullets: BulletData[] = [];
    const removedBulletIds: string[] = [];

    for (const bullet of state.bullets) {
      // Update position
      const newX = bullet.x + bullet.speedX;
      const newY = bullet.y + bullet.speedY;
      const frameDist = Math.sqrt(
        bullet.speedX * bullet.speedX +
        bullet.speedY * bullet.speedY
      );
      const newDist = bullet.distanceTraveled + frameDist;

      // Check if bullet has traveled beyond target + buffer
      if (newDist >= bullet.maxDistance + 50) {
        removedBulletIds.push(bullet.id);
        continue;
      }

      survivingBullets.push({
        ...bullet,
        x: newX,
        y: newY,
        distanceTraveled: newDist,
      });
    }

    if (removedBulletIds.length > 0 || survivingBullets.length !== state.bullets.length) {
      useGameStore.setState({ bullets: survivingBullets });
    } else {
      // Positions changed
      useGameStore.setState({ bullets: survivingBullets });
    }
  }

  // ── Performance history sampling ──

  private _samplePerformanceHistory(): void {
    const state = useGameStore.getState();
    if (!state.startTime || !state.lastPerformanceCheck) return;

    const now = Date.now();
    const intervalMs = 2000; // sample every 2 seconds

    if (now - state.lastPerformanceCheck < intervalMs) return;

    const totalTimeMinutes = (now - state.startTime) / 60000;
    const currentMode = getEffectiveMode();

    if (currentMode === 'math') {
      const totalTimeSeconds = (now - state.startTime) / 1000;
      const currentSps =
        totalTimeSeconds > 0
          ? state.mathQuestionsAnswered / totalTimeSeconds
          : 0;
      const currentAvgSolve =
        state.mathQuestionsAnswered > 0
          ? state.totalMathSolveTime / state.mathQuestionsAnswered / 1000
          : 0;

      useGameStore.getState().pushSpmHistory(currentSps);
      useGameStore.getState().pushSolveTimeHistory(currentAvgSolve);
    } else {
      const totalAttempts =
        state.correctCharacters + state.incorrectAttempts;
      const currentWpm =
        totalTimeMinutes > 0
          ? Math.round((state.correctCharacters / 5) / totalTimeMinutes)
          : 0;
      const currentAccuracy =
        totalAttempts > 0
          ? Math.round((state.correctCharacters / totalAttempts) * 100)
          : 0;

      useGameStore.getState().pushWpmHistory(currentWpm);
      useGameStore.getState().pushAccuracyHistory(currentAccuracy);
    }

    useGameStore.getState().setLastPerformanceCheck(now);
  }
}

// ── Singleton instance ──
export const gameEngine = new GameEngine();
