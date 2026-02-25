// ── Server room state for a single multiplayer room ──

import type { PlayerInfo, ServerInvader, ScoreboardEntry } from './types';
import { PLAYER_COLORS } from './types';
import { generateWordInvader, generateMathInvader, generateLetterInvader } from './ServerSpawnManager';

export type Phase = 'lobby' | 'countdown' | 'playing' | 'finished';
export type GameMode = 'words' | 'math' | 'adventure';

// Adventure mode phase cycle — each phase lasts ~20 seconds
type AdventurePhaseType = 'words' | 'letters' | 'math';
const ADVENTURE_PHASES: { type: AdventurePhaseType; duration: number; emoji: string; name: string }[] = [
  { type: 'words',   duration: 20, emoji: '👾', name: 'WORDS' },
  { type: 'letters', duration: 15, emoji: '🔤', name: 'LETTERS' },
  { type: 'math',    duration: 20, emoji: '👽', name: 'MATH' },
  { type: 'words',   duration: 15, emoji: '👾', name: 'WORDS' },
  { type: 'letters', duration: 10, emoji: '🔤', name: 'LETTERS' },
  { type: 'math',    duration: 15, emoji: '👽', name: 'MATH' },
];

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
  private _adventurePhaseIndex = 0;
  private _adventurePhaseTimer: ReturnType<typeof setTimeout> | null = null;
  private _currentAdventureType: AdventurePhaseType = 'words';

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
      // Adventure: speed based on current phase type
      if (this._currentAdventureType === 'math') return 0.35 + 0.05 * steps;
      if (this._currentAdventureType === 'letters') return 0.4 + 0.1 * steps;
      return 0.3 + 0.1 * steps;
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
    this._adventurePhaseIndex = 0;
    this._enterAdventurePhase(0);
  }

  private _enterAdventurePhase(index: number) {
    // Clear existing spawn interval and invaders for phase transition
    if (this._spawnInterval) { clearInterval(this._spawnInterval); this._spawnInterval = null; }
    if (this._adventurePhaseTimer) { clearTimeout(this._adventurePhaseTimer); this._adventurePhaseTimer = null; }

    const phaseIdx = index % ADVENTURE_PHASES.length;
    const phase = ADVENTURE_PHASES[phaseIdx];
    this._adventurePhaseIndex = phaseIdx;
    this._currentAdventureType = phase.type;

    // Clear current invaders for clean transition
    for (const [id] of this.invaders) {
      this._broadcast?.({ type: 'missed', invaderId: id });
    }
    this.invaders.clear();

    // Broadcast phase change
    this._broadcast?.({
      type: 'adventurePhase',
      phaseName: phase.name,
      phaseEmoji: phase.emoji,
      phaseType: phase.type,
    });

    // Spawn initial invaders for this phase
    this._spawnForAdventurePhase(phase.type, 3);

    // Spawn loop for this phase
    const spawnMs = phase.type === 'math' ? 4000 : phase.type === 'letters' ? 1500 : 2500;
    this._spawnInterval = setInterval(() => {
      if (this.phase !== 'playing') return;
      if (phase.type === 'math') {
        if (this._aliveInvaderCount() === 0) {
          this._spawnForAdventurePhase(phase.type, 1);
        }
      } else {
        const maxAlive = phase.type === 'letters' ? 8 : 6;
        if (this._aliveInvaderCount() < maxAlive) {
          this._spawnForAdventurePhase(phase.type, 1);
        }
      }
    }, spawnMs);

    // Schedule next phase transition
    this._adventurePhaseTimer = setTimeout(() => {
      if (this.phase === 'playing') {
        this._enterAdventurePhase(index + 1);
      }
    }, phase.duration * 1000);
  }

  private _spawnForAdventurePhase(type: AdventurePhaseType, count: number) {
    const baseSpeed = this._getCurrentBaseSpeed();
    for (let i = 0; i < count; i++) {
      let inv: import('./types').ServerInvader;
      if (type === 'letters') {
        const usedLetters = Array.from(this.invaders.values()).map((i) => i.word);
        inv = generateLetterInvader(usedLetters, baseSpeed);
      } else if (type === 'math') {
        inv = generateMathInvader(baseSpeed);
      } else {
        const usedWords = Array.from(this.invaders.values()).map((i) => i.word);
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
    if (this._adventurePhaseTimer) { clearTimeout(this._adventurePhaseTimer); this._adventurePhaseTimer = null; }
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

    // In math mode (or adventure math phase), spawn next invader after a short delay
    const isMathPhase = this.mode === 'math' || (this.mode === 'adventure' && this._currentAdventureType === 'math');
    if (isMathPhase) {
      setTimeout(() => {
        if (this.phase === 'playing' && this._aliveInvaderCount() === 0) {
          if (this.mode === 'adventure') {
            this._spawnForAdventurePhase('math', 1);
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
