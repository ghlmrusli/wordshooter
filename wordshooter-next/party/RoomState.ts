// ── Server room state for a single multiplayer room ──

import type { PlayerInfo, ServerInvader, ScoreboardEntry } from './types';
import { PLAYER_COLORS } from './types';
import { generateWordInvader, generateMathInvader, generateLetterInvader } from './ServerSpawnManager';

export type Phase = 'lobby' | 'countdown' | 'playing' | 'finished';
export type GameMode = 'words' | 'math' | 'adventure';

// ── Journey/Adventure mode phases (mirrors single-player journeyPhases.ts) ──
// Sentences phases are substituted with words at 1x speed in multiplayer.
type AdventureSpawnType = 'words' | 'letters' | 'math';
interface JourneyPhase {
  phase: number;
  scoreThreshold: number; // min score to enter this phase
  spawnType: AdventureSpawnType;
  speedMultiplier: number;
  name: string;
  color: string;
  maxInvaders: number;   // max alive at once
  spawnIntervalMs: number; // ms between spawns
}

const JOURNEY_PHASES: JourneyPhase[] = [
  // Phase 1: words 2x   (score 0-99)
  { phase: 1, scoreThreshold: 0,   spawnType: 'words',   speedMultiplier: 2, name: 'WORDS (2x)',      color: '#FFFFFF', maxInvaders: 5, spawnIntervalMs: 2500 },
  // Phase 2: sentences→words 1x (score 100-199)
  { phase: 2, scoreThreshold: 100, spawnType: 'words',   speedMultiplier: 1, name: 'WORDS (1x)',      color: '#4A90E2', maxInvaders: 5, spawnIntervalMs: 2500 },
  // Phase 3: letters 2x (score 200-299)
  { phase: 3, scoreThreshold: 200, spawnType: 'letters', speedMultiplier: 2, name: 'LETTERS (2x)',    color: '#00D4FF', maxInvaders: 10, spawnIntervalMs: 800 },
  // Phase 4: math 2x    (score 300-399)
  { phase: 4, scoreThreshold: 300, spawnType: 'math',    speedMultiplier: 2, name: 'MATH (2x)',       color: '#E67E22', maxInvaders: 1, spawnIntervalMs: 4000 },
  // Phase 5: words 3x   (score 400-499)
  { phase: 5, scoreThreshold: 400, spawnType: 'words',   speedMultiplier: 3, name: 'WORDS (3x)',      color: '#FF4500', maxInvaders: 5, spawnIntervalMs: 2500 },
  // Phase 6: sentences→words 1x (score 500-799)
  { phase: 6, scoreThreshold: 500, spawnType: 'words',   speedMultiplier: 1, name: 'WORDS (1x)',      color: '#4A90E2', maxInvaders: 5, spawnIntervalMs: 2500 },
  // Phase 7: letters 3x (score 800-899)
  { phase: 7, scoreThreshold: 800, spawnType: 'letters', speedMultiplier: 3, name: 'LETTERS (3x)',    color: '#00D4FF', maxInvaders: 10, spawnIntervalMs: 800 },
  // Phase 8: math 3x    (score 900+)
  { phase: 8, scoreThreshold: 900, spawnType: 'math',    speedMultiplier: 3, name: 'MATH (3x)',       color: '#E67E22', maxInvaders: 1, spawnIntervalMs: 4000 },
];

function getJourneyPhaseForScore(score: number): JourneyPhase {
  for (let i = JOURNEY_PHASES.length - 1; i >= 0; i--) {
    if (score >= JOURNEY_PHASES[i].scoreThreshold) return JOURNEY_PHASES[i];
  }
  return JOURNEY_PHASES[0];
}

// Combo thresholds (same as single-player ScoreManager)
function getComboMultiplier(combo: number): number {
  if (combo >= 10) return 3;
  if (combo >= 5) return 2;
  if (combo >= 3) return 1.5;
  return 1;
}

export class RoomState {
  roomCode: string;
  players: Map<string, PlayerInfo> = new Map();
  phase: Phase = 'lobby';
  mode: GameMode | null = null;
  duration: number | null = null;

  // Game state
  invaders: Map<string, ServerInvader> = new Map();
  timeRemaining = 0;
  hostId: string | null = null;
  private _gameStartTime = 0;

  // Adventure mode state
  private _currentJourneyPhase: JourneyPhase = JOURNEY_PHASES[0];

  // Intervals
  private _spawnInterval: ReturnType<typeof setInterval> | null = null;
  private _tickInterval: ReturnType<typeof setInterval> | null = null;
  private _countdownInterval: ReturnType<typeof setInterval> | null = null;

  // Callbacks for broadcasting
  private _broadcast: ((msg: unknown) => void) | null = null;
  private _sendTo: ((id: string, msg: unknown) => void) | null = null;

  constructor(roomCode: string) {
    this.roomCode = roomCode;
  }

  setBroadcast(broadcast: (msg: unknown) => void, sendTo: (id: string, msg: unknown) => void) {
    this._broadcast = broadcast;
    this._sendTo = sendTo;
  }

  // ── Player management ──

  addPlayer(id: string, name: string, colorIdx: number): PlayerInfo {
    const safeName = name.trim() || 'Player';
    // Assign host to first player
    const isHost = this.players.size === 0;
    if (isHost) this.hostId = id;

    // Clamp color index
    const color = colorIdx >= 0 && colorIdx < PLAYER_COLORS.length ? colorIdx : 0;

    const player: PlayerInfo = {
      id,
      name: safeName,
      color,
      score: 0,
      combo: 0,
      maxCombo: 0,
      wordsKilled: 0,
      totalAttempts: 0,
      correctAttempts: 0,
      isHost,
    };

    this.players.set(id, player);
    return player;
  }

  removePlayer(id: string): boolean {
    const removed = this.players.delete(id);
    if (!removed) return false;

    // If host left, reassign
    if (this.hostId === id) {
      const first = this.players.keys().next().value;
      this.hostId = first ?? null;
      if (first) {
        const p = this.players.get(first)!;
        p.isHost = true;
      }
    }

    // If room empty during play, clean up
    if (this.players.size === 0) {
      this._cleanup();
      this.phase = 'lobby';
    }

    return true;
  }

  getPlayerList(): PlayerInfo[] {
    return Array.from(this.players.values());
  }

  // ── Game lifecycle ──

  startCountdown(mode: GameMode, duration: number) {
    if (this.phase !== 'lobby' && this.phase !== 'finished') return;

    this.mode = mode;
    this.duration = duration;
    this.timeRemaining = duration;
    this.phase = 'countdown';

    // Reset player scores
    for (const p of this.players.values()) {
      p.score = 0;
      p.combo = 0;
      p.maxCombo = 0;
      p.wordsKilled = 0;
      p.totalAttempts = 0;
      p.correctAttempts = 0;
    }

    // 3-2-1 countdown
    let count = 3;
    this._broadcast?.({ type: 'countdown', count });

    this._countdownInterval = setInterval(() => {
      count--;
      this._broadcast?.({ type: 'countdown', count });

      if (count <= 0) {
        if (this._countdownInterval) clearInterval(this._countdownInterval);
        this._countdownInterval = null;
        this._startPlaying();
      }
    }, 1000);
  }

  /** Get current base speed, increasing over elapsed game time. */
  private _getCurrentBaseSpeed(): number {
    const elapsed = (Date.now() - this._gameStartTime) / 1000;
    const steps = Math.floor(elapsed / 20);
    if (this.mode === 'adventure') {
      // Adventure: base speed scaled by journey phase speed multiplier
      const phase = this._currentJourneyPhase;
      const base = phase.spawnType === 'math' ? 0.35 : 0.3;
      const increment = phase.spawnType === 'math' ? 0.05 : 0.1;
      return (base + increment * steps) * (phase.speedMultiplier / 2); // /2 because base already assumes ~2x feel
    }
    if (this.mode === 'math') {
      return 0.35 + 0.05 * steps;
    }
    return 0.3 + 0.1 * steps;
  }

  private _startPlaying() {
    this.phase = 'playing';
    this.invaders.clear();
    this._gameStartTime = Date.now();

    this._broadcastRoomState();

    if (this.mode === 'adventure') {
      this._startAdventureMode();
    } else {
      this._startStandardMode();
    }

    // Time tick every second
    this._tickInterval = setInterval(() => {
      this.timeRemaining--;
      this._broadcast?.({ type: 'timeTick', timeRemaining: this.timeRemaining });

      // Check missed invaders (fallen off screen after ~30s)
      this._checkMissedInvaders();

      if (this.timeRemaining <= 0) {
        this._endGame();
      }
    }, 1000);
  }

  private _startStandardMode() {
    // Spawn initial invaders
    if (this.mode === 'words') {
      this._spawnWordInvaders(3);
    } else {
      this._spawnMathInvader();
    }

    // Spawn loop
    const spawnMs = this.mode === 'words' ? 2500 : 4000;
    this._spawnInterval = setInterval(() => {
      if (this.mode === 'words') {
        const alive = this._aliveInvaderCount();
        if (alive < 6) {
          this._spawnWordInvaders(1);
        }
      } else {
        if (this._aliveInvaderCount() === 0) {
          this._spawnMathInvader();
        }
      }
    }, spawnMs);
  }

  private _startAdventureMode() {
    this._currentJourneyPhase = JOURNEY_PHASES[0];
    this._enterJourneyPhase(this._currentJourneyPhase);
  }

  /** Get the highest individual score among all players. */
  private _getHighestPlayerScore(): number {
    let max = 0;
    for (const p of this.players.values()) {
      if (p.score > max) max = p.score;
    }
    return max;
  }

  /** Check if the journey phase should change based on highest player score. */
  private _checkJourneyPhaseTransition(): void {
    const highScore = this._getHighestPlayerScore();
    const newPhase = getJourneyPhaseForScore(highScore);
    if (newPhase.phase !== this._currentJourneyPhase.phase) {
      this._currentJourneyPhase = newPhase;
      this._enterJourneyPhase(newPhase);
    }
  }

  private _enterJourneyPhase(journeyPhase: JourneyPhase) {
    // Clear existing spawn interval
    if (this._spawnInterval) { clearInterval(this._spawnInterval); this._spawnInterval = null; }

    // Clear current invaders for clean phase transition
    for (const [id] of this.invaders) {
      this._broadcast?.({ type: 'missed', invaderId: id });
    }
    this.invaders.clear();

    // Broadcast phase change to all clients
    this._broadcast?.({
      type: 'adventurePhase',
      phaseNumber: journeyPhase.phase,
      phaseName: journeyPhase.name,
      phaseColor: journeyPhase.color,
      phaseType: journeyPhase.spawnType,
    });

    // Spawn initial invaders for this phase
    const initialCount = journeyPhase.spawnType === 'math' ? 1 : journeyPhase.spawnType === 'letters' ? 5 : 3;
    this._spawnForJourneyPhase(journeyPhase, initialCount);

    // Spawn loop for this phase
    this._spawnInterval = setInterval(() => {
      if (this.phase !== 'playing') return;
      const alive = this._aliveInvaderCount();
      if (journeyPhase.spawnType === 'math') {
        if (alive === 0) this._spawnForJourneyPhase(journeyPhase, 1);
      } else {
        if (alive < journeyPhase.maxInvaders) {
          this._spawnForJourneyPhase(journeyPhase, 1);
        }
      }
    }, journeyPhase.spawnIntervalMs);
  }

  private _spawnForJourneyPhase(journeyPhase: JourneyPhase, count: number) {
    const baseSpeed = this._getCurrentBaseSpeed();
    for (let i = 0; i < count; i++) {
      let inv: import('./types').ServerInvader;
      if (journeyPhase.spawnType === 'letters') {
        const usedLetters = Array.from(this.invaders.values()).map((inv) => inv.word);
        inv = generateLetterInvader(usedLetters, baseSpeed);
      } else if (journeyPhase.spawnType === 'math') {
        inv = generateMathInvader(baseSpeed);
      } else {
        const usedWords = Array.from(this.invaders.values()).map((inv) => inv.word);
        inv = generateWordInvader(usedWords, baseSpeed);
      }
      this.invaders.set(inv.id, inv);
      this._broadcast?.({ type: 'spawn', invader: inv });
    }
  }

  private _endGame() {
    this._cleanup();
    this.phase = 'finished';

    const scoreboard: ScoreboardEntry[] = Array.from(this.players.values())
      .map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        score: p.score,
        wordsKilled: p.wordsKilled,
        maxCombo: p.maxCombo,
        accuracy: p.totalAttempts > 0
          ? Math.round((p.correctAttempts / p.totalAttempts) * 100)
          : 0,
      }))
      .sort((a, b) => b.score - a.score);

    this._broadcast?.({ type: 'gameOver', scoreboard });
  }

  private _cleanup() {
    if (this._spawnInterval) { clearInterval(this._spawnInterval); this._spawnInterval = null; }
    if (this._tickInterval) { clearInterval(this._tickInterval); this._tickInterval = null; }
    if (this._countdownInterval) { clearInterval(this._countdownInterval); this._countdownInterval = null; }
    this.invaders.clear();
  }

  // ── Invader spawning ──

  private _aliveInvaderCount(): number {
    return this.invaders.size;
  }

  private _spawnWordInvaders(count: number) {
    const usedWords = Array.from(this.invaders.values()).map((i) => i.word);
    const baseSpeed = this._getCurrentBaseSpeed();
    for (let i = 0; i < count; i++) {
      const inv = generateWordInvader(usedWords, baseSpeed);
      this.invaders.set(inv.id, inv);
      usedWords.push(inv.word);
      this._broadcast?.({ type: 'spawn', invader: inv });
    }
  }

  private _spawnMathInvader() {
    const baseSpeed = this._getCurrentBaseSpeed();
    const inv = generateMathInvader(baseSpeed);
    this.invaders.set(inv.id, inv);
    this._broadcast?.({ type: 'spawn', invader: inv });
  }

  private _checkMissedInvaders() {
    const now = Date.now();
    const maxAge = 30_000; // 30 seconds max lifetime

    for (const [id, inv] of this.invaders) {
      if (now - inv.spawnTime > maxAge) {
        this.invaders.delete(id);
        this._broadcast?.({ type: 'missed', invaderId: id });
      }
    }
  }

  // ── Kill validation ──

  handleAttempt(playerId: string, invaderId: string, typed: string): void {
    const player = this.players.get(playerId);
    if (!player || this.phase !== 'playing') return;

    player.totalAttempts++;

    const invader = this.invaders.get(invaderId);

    if (!invader) {
      // Already killed by someone else
      this._sendTo?.(playerId, {
        type: 'attemptRejected',
        invaderId,
        reason: 'already_killed',
      });
      // Break combo on failed attempt
      player.combo = 0;
      return;
    }

    // Check answer
    if (typed.toLowerCase() !== invader.answer.toLowerCase()) {
      this._sendTo?.(playerId, {
        type: 'attemptRejected',
        invaderId,
        reason: 'wrong_answer',
      });
      player.combo = 0;
      return;
    }

    // Kill successful!
    this.invaders.delete(invaderId);
    player.correctAttempts++;
    player.combo++;
    player.wordsKilled++;
    if (player.combo > player.maxCombo) player.maxCombo = player.combo;

    const multiplier = getComboMultiplier(player.combo);
    let points: number;

    if (invader.invaderType === 'math') {
      const solveTime = (Date.now() - invader.spawnTime) / 1000;
      points = Math.round((solveTime < 1 ? 11 : 10) * multiplier);
    } else {
      points = Math.round(invader.word.length * multiplier);
    }

    player.score += points;

    this._broadcast?.({
      type: 'kill',
      invaderId,
      killedBy: playerId,
      killerName: player.name,
      killerColor: player.color,
      pointsEarned: points,
      newScore: player.score,
      newCombo: player.combo,
    });

    // Check for adventure phase transition after scoring
    if (this.mode === 'adventure') {
      this._checkJourneyPhaseTransition();
    }

    // In math mode (or adventure math phase), spawn next invader after a short delay
    const isMathPhase = this.mode === 'math' || (this.mode === 'adventure' && this._currentJourneyPhase.spawnType === 'math');
    if (isMathPhase) {
      setTimeout(() => {
        if (this.phase === 'playing' && this._aliveInvaderCount() === 0) {
          if (this.mode === 'adventure') {
            this._spawnForJourneyPhase(this._currentJourneyPhase, 1);
          } else {
            this._spawnMathInvader();
          }
        }
      }, 1000);
    }
  }

  // ── Serialization helpers ──

  getRoomStateMessage(yourId: string) {
    return {
      type: 'roomState' as const,
      roomCode: this.roomCode,
      players: this.getPlayerList(),
      phase: this.phase,
      mode: this.mode,
      duration: this.duration,
      timeRemaining: this.timeRemaining,
      yourId,
    };
  }

  private _broadcastRoomState() {
    for (const [id] of this.players) {
      this._sendTo?.(id, this.getRoomStateMessage(id));
    }
  }

  broadcastRoomStateToAll() {
    this._broadcastRoomState();
  }

  destroy() {
    this._cleanup();
    this.players.clear();
  }
}
