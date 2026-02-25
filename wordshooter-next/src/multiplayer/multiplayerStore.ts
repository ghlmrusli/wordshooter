// ── Multiplayer-specific Zustand store ──

import { create } from 'zustand';
import type { PlayerInfo, ServerInvader, ScoreboardEntry } from '../../party/types';

export type MPPhase = 'connecting' | 'lobby' | 'countdown' | 'playing' | 'finished';

export interface KillToast {
  id: string;
  killerName: string;
  killerColor: number;
  word: string;
  points: number;
  timestamp: number;
}

export interface MultiplayerState {
  // Connection
  isMultiplayer: boolean;
  roomCode: string | null;
  myId: string | null;
  phase: MPPhase;

  // Players
  players: PlayerInfo[];

  // Game config
  mode: 'words' | 'math' | 'adventure' | null;
  duration: number | null;
  timeRemaining: number | null;
  countdownValue: number | null;

  // Adventure mode phase info
  adventurePhase: { name: string; emoji: string; type: string } | null;

  // Invaders (server-authoritative, client animates positions)
  serverInvaders: Map<string, ServerInvader>;
  killedInvaderIds: Set<string>;

  // Scoreboard
  scoreboard: ScoreboardEntry[];

  // Kill feed
  killToasts: KillToast[];

  // Typing indicators
  playerTyping: Map<string, string>; // playerId → currentInput

  // Rocket aim rotation (degrees) per player
  rocketRotations: Map<string, number>; // playerId → rotation deg

  // Emoji reactions floating above rockets
  playerEmojis: Map<string, { emoji: string; timestamp: number }>;

  // Error
  error: string | null;

  // Actions
  setMultiplayer: (active: boolean) => void;
  setRoomCode: (code: string | null) => void;
  setMyId: (id: string) => void;
  setPhase: (phase: MPPhase) => void;
  setPlayers: (players: PlayerInfo[]) => void;
  setMode: (mode: 'words' | 'math' | 'adventure' | null) => void;
  setAdventurePhase: (phase: { name: string; emoji: string; type: string } | null) => void;
  setDuration: (duration: number | null) => void;
  setTimeRemaining: (time: number | null) => void;
  setCountdown: (count: number | null) => void;

  addInvader: (invader: ServerInvader) => void;
  removeInvader: (id: string) => void;
  markInvaderKilled: (id: string) => void;
  clearInvaders: () => void;

  setScoreboard: (scoreboard: ScoreboardEntry[]) => void;
  addKillToast: (toast: KillToast) => void;
  removeKillToast: (id: string) => void;

  setPlayerTyping: (playerId: string, input: string) => void;
  clearPlayerTyping: (playerId: string) => void;

  setRocketRotation: (playerId: string, rotation: number) => void;
  clearRocketRotation: (playerId: string) => void;

  setPlayerEmoji: (playerId: string, emoji: string) => void;

  setError: (error: string | null) => void;

  reset: () => void;
}

const initialState = {
  isMultiplayer: false,
  roomCode: null,
  myId: null,
  phase: 'connecting' as MPPhase,
  players: [],
  mode: null,
  duration: null,
  timeRemaining: null,
  countdownValue: null,
  adventurePhase: null,
  serverInvaders: new Map<string, ServerInvader>(),
  killedInvaderIds: new Set<string>(),
  scoreboard: [],
  killToasts: [],
  playerTyping: new Map<string, string>(),
  rocketRotations: new Map<string, number>(),
  playerEmojis: new Map<string, { emoji: string; timestamp: number }>(),
  error: null,
};

export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
  ...initialState,

  setMultiplayer: (active) => set({ isMultiplayer: active }),
  setRoomCode: (code) => set({ roomCode: code }),
  setMyId: (id) => set({ myId: id }),
  setPhase: (phase) => set({ phase }),
  setPlayers: (players) => set({ players }),
  setMode: (mode) => set({ mode }),
  setAdventurePhase: (phase) => set({ adventurePhase: phase }),
  setDuration: (duration) => set({ duration }),
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  setCountdown: (count) => set({ countdownValue: count }),

  addInvader: (invader) => {
    const next = new Map(get().serverInvaders);
    next.set(invader.id, invader);
    set({ serverInvaders: next });
  },

  removeInvader: (id) => {
    const next = new Map(get().serverInvaders);
    next.delete(id);
    const killed = new Set(get().killedInvaderIds);
    killed.delete(id);
    set({ serverInvaders: next, killedInvaderIds: killed });
  },

  markInvaderKilled: (id) => {
    const killed = new Set(get().killedInvaderIds);
    killed.add(id);
    set({ killedInvaderIds: killed });
  },

  clearInvaders: () => set({
    serverInvaders: new Map(),
    killedInvaderIds: new Set(),
  }),

  setScoreboard: (scoreboard) => set({ scoreboard }),

  addKillToast: (toast) => {
    const toasts = [...get().killToasts, toast].slice(-5); // keep last 5
    set({ killToasts: toasts });
    // Auto-remove after 3 seconds
    setTimeout(() => get().removeKillToast(toast.id), 3000);
  },

  removeKillToast: (id) => {
    set({ killToasts: get().killToasts.filter((t) => t.id !== id) });
  },

  setPlayerTyping: (playerId, input) => {
    const next = new Map(get().playerTyping);
    next.set(playerId, input);
    set({ playerTyping: next });
  },

  clearPlayerTyping: (playerId) => {
    const next = new Map(get().playerTyping);
    next.delete(playerId);
    set({ playerTyping: next });
  },

  setRocketRotation: (playerId, rotation) => {
    const next = new Map(get().rocketRotations);
    next.set(playerId, rotation);
    set({ rocketRotations: next });
  },

  clearRocketRotation: (playerId) => {
    const next = new Map(get().rocketRotations);
    next.delete(playerId);
    set({ rocketRotations: next });
  },

  setPlayerEmoji: (playerId, emoji) => {
    const next = new Map(get().playerEmojis);
    next.set(playerId, { emoji, timestamp: Date.now() });
    set({ playerEmojis: next });
    // Auto-clear after 2 seconds
    setTimeout(() => {
      const current = get().playerEmojis.get(playerId);
      if (current && current.emoji === emoji && Date.now() - current.timestamp >= 1900) {
        const cleared = new Map(get().playerEmojis);
        cleared.delete(playerId);
        set({ playerEmojis: cleared });
      }
    }, 2000);
  },

  setError: (error) => set({ error }),

  reset: () => set({
    ...initialState,
    serverInvaders: new Map(),
    killedInvaderIds: new Set(),
    playerTyping: new Map(),
    rocketRotations: new Map(),
    playerEmojis: new Map(),
  }),
}));
