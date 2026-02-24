// ── Shared message types for PartyKit server <-> client communication ──

// ── Player colors ──
export const PLAYER_COLORS = [
  '#ff4444', // red
  '#4ecca3', // green
  '#4a90e2', // blue
  '#ffd700', // gold
  '#ff69b4', // pink
  '#00d4ff', // cyan
] as const;

// ── Player info ──
export interface PlayerInfo {
  id: string;
  name: string;
  color: number; // index into PLAYER_COLORS
  score: number;
  combo: number;
  maxCombo: number;
  wordsKilled: number;
  totalAttempts: number;
  correctAttempts: number;
  isHost: boolean;
}

// ── Server invader (serializable, no DOM refs) ──
export interface ServerInvader {
  id: string;
  word: string;
  displayWord: string;
  answer: string;
  x: number;
  speed: number;
  horizontalDrift: number;
  invaderType: 'word' | 'math';
  emoji: string;
  spawnTime: number;
}

// ── Scoreboard entry ──
export interface ScoreboardEntry {
  id: string;
  name: string;
  color: number;
  score: number;
  wordsKilled: number;
  maxCombo: number;
  accuracy: number;
}

// ═══════════════════════════════════════════
// Client → Server messages
// ═══════════════════════════════════════════

export type C2S_Join = {
  type: 'join';
  playerName: string;
  playerColor: number;
};

export type C2S_Attempt = {
  type: 'attempt';
  invaderId: string;
  typed: string;
};

export type C2S_Typing = {
  type: 'typing';
  currentInput: string;
};

export type C2S_StartGame = {
  type: 'startGame';
  mode: 'words' | 'math';
  duration: 60 | 90 | 120;
};

export type C2S_Leave = {
  type: 'leave';
};

export type ClientMessage =
  | C2S_Join
  | C2S_Attempt
  | C2S_Typing
  | C2S_StartGame
  | C2S_Leave;

// ═══════════════════════════════════════════
// Server → Client messages
// ═══════════════════════════════════════════

export type S2C_RoomState = {
  type: 'roomState';
  roomCode: string;
  players: PlayerInfo[];
  phase: 'lobby' | 'countdown' | 'playing' | 'finished';
  mode: 'words' | 'math' | null;
  duration: number | null;
  timeRemaining: number | null;
  yourId: string;
};

export type S2C_Spawn = {
  type: 'spawn';
  invader: ServerInvader;
};

export type S2C_Kill = {
  type: 'kill';
  invaderId: string;
  killedBy: string;
  killerName: string;
  killerColor: number;
  pointsEarned: number;
  newScore: number;
  newCombo: number;
};

export type S2C_Missed = {
  type: 'missed';
  invaderId: string;
};

export type S2C_AttemptRejected = {
  type: 'attemptRejected';
  invaderId: string;
  reason: 'already_killed' | 'wrong_answer';
};

export type S2C_TimeTick = {
  type: 'timeTick';
  timeRemaining: number;
};

export type S2C_GameOver = {
  type: 'gameOver';
  scoreboard: ScoreboardEntry[];
};

export type S2C_PlayerTyping = {
  type: 'playerTyping';
  playerId: string;
  playerName: string;
  currentInput: string;
};

export type S2C_Countdown = {
  type: 'countdown';
  count: number; // 3, 2, 1, 0 (0 = go!)
};

export type S2C_Error = {
  type: 'error';
  message: string;
};

export type ServerMessage =
  | S2C_RoomState
  | S2C_Spawn
  | S2C_Kill
  | S2C_Missed
  | S2C_AttemptRejected
  | S2C_TimeTick
  | S2C_GameOver
  | S2C_PlayerTyping
  | S2C_Countdown
  | S2C_Error;
