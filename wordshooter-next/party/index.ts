// ── PartyKit multiplayer server for Word Shooter ──

import type * as Party from 'partykit/server';
import type { ClientMessage } from './types';
import { RoomState } from './RoomState';

export default class WordShooterServer implements Party.Server {
  room: RoomState;

  constructor(readonly party: Party.Party) {
    // Room code = party room ID (4-letter uppercase)
    this.room = new RoomState(party.id);
  }

  onConnect(conn: Party.Connection) {
    // Wire broadcast/sendTo using PartyKit's connection API
    this.room.setBroadcast(
      (msg) => this.party.broadcast(JSON.stringify(msg)),
      (id, msg) => {
        const target = this.party.getConnection(id);
        if (target) target.send(JSON.stringify(msg));
      }
    );

    // Send current room state so the client gets the connection ID
    conn.send(JSON.stringify(this.room.getRoomStateMessage(conn.id)));
  }

  onMessage(message: string, sender: Party.Connection) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }

    // Ensure broadcast is wired (in case onConnect hasn't been called for this instance)
    this.room.setBroadcast(
      (m) => this.party.broadcast(JSON.stringify(m)),
      (id, m) => {
        const target = this.party.getConnection(id);
        if (target) target.send(JSON.stringify(m));
      }
    );

    switch (msg.type) {
      case 'join':
        this._handleJoin(sender, msg.playerName, msg.playerColor);
        break;

      case 'attempt':
        this.room.handleAttempt(sender.id, msg.invaderId, msg.typed);
        break;

      case 'typing':
        // Broadcast typing indicator to other players
        const player = this.room.players.get(sender.id);
        if (player) {
          this.party.broadcast(
            JSON.stringify({
              type: 'playerTyping',
              playerId: sender.id,
              playerName: player.name,
              currentInput: msg.currentInput,
            }),
            [sender.id] // exclude sender
          );
        }
        break;

      case 'startGame':
        // Only host can start
        if (this.room.hostId === sender.id) {
          this.room.startCountdown(msg.mode, msg.duration);
        } else {
          sender.send(JSON.stringify({
            type: 'error',
            message: 'Only the host can start the game.',
          }));
        }
        break;

      case 'leave':
        this._handleLeave(sender);
        break;
    }
  }

  onClose(conn: Party.Connection) {
    this._handleLeave(conn);
  }

  private _handleJoin(conn: Party.Connection, name: string, colorIdx: number) {
    // Max 3 players
    if (this.room.players.size >= 3 && !this.room.players.has(conn.id)) {
      conn.send(JSON.stringify({
        type: 'error',
        message: 'Room is full (max 3 players).',
      }));
      return;
    }

    // Can't join mid-game
    if (this.room.phase === 'playing' || this.room.phase === 'countdown') {
      conn.send(JSON.stringify({
        type: 'error',
        message: 'Game is already in progress.',
      }));
      return;
    }

    this.room.addPlayer(conn.id, name, colorIdx);

    // Send room state to all players
    this.room.broadcastRoomStateToAll();
  }

  private _handleLeave(conn: Party.Connection) {
    const removed = this.room.removePlayer(conn.id);
    if (removed) {
      this.room.broadcastRoomStateToAll();
    }
  }
}

// PartyKit requires a default export satisfying Party.Worker
WordShooterServer satisfies Party.Worker;
