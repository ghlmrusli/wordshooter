'use client';

import { useMultiplayerStore } from '@/multiplayer/multiplayerStore';
import { PLAYER_COLORS } from '../../../party/types';
import type { PlayerInfo } from '../../../party/types';
import styles from '@/styles/multiplayer.module.css';

/**
 * Sort players so "me" is in the center, others flanking evenly.
 * Supports up to 5 players.
 */
function sortPlayersForLayout(players: PlayerInfo[], myId: string | null): PlayerInfo[] {
  const me = players.find((p) => p.id === myId);
  const others = players.filter((p) => p.id !== myId);

  if (!me) return players;
  if (others.length === 0) return [me];

  // Split others into left half and right half
  const half = Math.ceil(others.length / 2);
  const left = others.slice(0, half);
  const right = others.slice(half);

  return [...left, me, ...right];
}

/**
 * Get the X position for a player's rocket based on their sorted index.
 */
export function getRocketX(players: PlayerInfo[], myId: string | null, playerId: string): number {
  const sorted = sortPlayersForLayout(players, myId);
  const count = sorted.length;
  const index = sorted.findIndex((p) => p.id === playerId);
  if (index === -1) return window.innerWidth / 2;
  return ((index + 1) / (count + 1)) * window.innerWidth;
}

export default function MultiplayerRockets() {
  const players = useMultiplayerStore((s) => s.players);
  const myId = useMultiplayerStore((s) => s.myId);
  const rocketRotations = useMultiplayerStore((s) => s.rocketRotations);
  const playerEmojis = useMultiplayerStore((s) => s.playerEmojis);

  const sorted = sortPlayersForLayout(players, myId);
  const count = sorted.length;

  return (
    <div className={styles.mpRocketRow}>
      {sorted.map((player, index) => {
        const xPercent = ((index + 1) / (count + 1)) * 100;
        const color = PLAYER_COLORS[player.color];
        const isMe = player.id === myId;
        const rotation = rocketRotations.get(player.id) ?? -45;

        const emojiData = playerEmojis.get(player.id);

        return (
          <div
            key={player.id}
            className={`${styles.mpRocket} ${isMe ? styles.mpRocketMe : styles.mpRocketOther}`}
            style={{ left: `${xPercent}%` }}
          >
            {emojiData && (
              <div key={emojiData.timestamp} className={styles.mpFloatingEmoji}>
                {emojiData.emoji}
              </div>
            )}
            <div className={styles.mpRocketEmojiWrap}>
              <div
                className={styles.mpRocketEmoji}
                style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.15s ease-out' }}
              >
                {'\u{1F680}'}
              </div>
            </div>
            <div
              className={styles.mpRocketLabel}
              style={{ color: isMe ? '#ffd700' : '#ffffff', textShadow: isMe ? '0 0 8px rgba(255, 215, 0, 0.5)' : 'none' }}
            >
              {isMe ? 'You' : player.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
