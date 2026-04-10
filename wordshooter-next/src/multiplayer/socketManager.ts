// ── Singleton socket manager for multiplayer ──
// Persists across screen transitions (lobby → game → scoreboard).

'use client';

import PartySocket from 'partysocket';
import type { ServerMessage, ClientMessage } from '../../party/types';

const PARTY_HOST =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999';

type MessageHandler = (msg: ServerMessage) => void;

let _socket: PartySocket | null = null;
let _handler: MessageHandler | null = null;
let _currentRoom: string | null = null;

function _onMessage(event: MessageEvent) {
  try {
    const msg: ServerMessage = JSON.parse(event.data);
    _handler?.(msg);
  } catch {
    // Ignore malformed messages
  }
}

export function connectToRoom(roomCode: string, onMessage: MessageHandler): void {
  // If already connected to this room, just swap handler
  if (_socket && _currentRoom === roomCode && _socket.readyState === WebSocket.OPEN) {
    _handler = onMessage;
    return;
  }

  // Close existing connection
  disconnect();

  _handler = onMessage;
  _currentRoom = roomCode;

  _socket = new PartySocket({
    host: PARTY_HOST,
    room: roomCode,
  });

  _socket.addEventListener('message', _onMessage);
}

export function setMessageHandler(handler: MessageHandler): void {
  _handler = handler;
}

export function sendMessage(msg: ClientMessage): void {
  if (_socket?.readyState === WebSocket.OPEN) {
    _socket.send(JSON.stringify(msg));
  }
}

export function disconnect(): void {
  if (_socket) {
    _socket.removeEventListener('message', _onMessage);
    _socket.close();
    _socket = null;
  }
  _handler = null;
  _currentRoom = null;
}

export function isConnected(): boolean {
  return _socket?.readyState === WebSocket.OPEN;
}

export function getSocket(): PartySocket | null {
  return _socket;
}
