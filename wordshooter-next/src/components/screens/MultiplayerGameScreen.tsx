'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useMultiplayerStore } from '@/multiplayer/multiplayerStore';
import { setMessageHandler, sendMessage } from '@/multiplayer/socketManager';
import { PLAYER_COLORS } from '../../../party/types';
import type { ServerMessage, ServerInvader } from '../../../party/types';
import type { InvaderData, BulletData } from '@/types/game';
import StarfieldCanvas from '@/components/game/StarfieldCanvas';
import InvaderArea from '@/components/game/InvaderArea';
import Bullet from '@/components/game/Bullet';
import MultiplayerRockets, { getRocketX } from '@/components/game/MultiplayerRockets';
import { playShootSound, playSuccessSound, playErrorSound } from '@/audio/SoundEffects';
import styles from '@/styles/multiplayer.module.css';
import gameStyles from '@/styles/game.module.css';

let bulletIdCounter = 0;

function serverToClientInvader(inv: ServerInvader): InvaderData {
  const scaleX = typeof window !== 'undefined' ? window.innerWidth / 1024 : 1;
  return {
    id: inv.id,
    word: inv.word,
    displayWord: inv.displayWord,
    answer: inv.answer,
    x: inv.x * scaleX,
    y: 0,
    speed: inv.speed,
    horizontalDrift: inv.horizontalDrift,
    type: inv.invaderType === 'math' ? 'math' : 'word',
    isDying: false,
    spawnTime: inv.spawnTime,
    isMathQuestion: inv.invaderType === 'math',
    isLetter: false,
    isSentence: false,
    emoji: inv.emoji,
    elementRef: null,
    wordElementRef: null,
  };
}

function createBullet(invader: InvaderData, color?: string, originX?: number): { bullet: BulletData; travelTime: number } {
  const rocketX = originX ?? window.innerWidth / 2;
  const rocketY = window.innerHeight * 0.88;
  const targetX = invader.x + 30;
  const targetY = invader.y + 20;

  const dx = targetX - rocketX;
  const dy = targetY - rocketY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const speed = 49.5;
  const speedX = (dx / distance) * speed;
  const speedY = (dy / distance) * speed;
  const travelTime = (distance / speed) * (1000 / 60);

  const bullet: BulletData = {
    id: `mpbullet_${++bulletIdCounter}_${Date.now()}`,
    x: rocketX,
    y: rocketY,
    speedX,
    speedY,
    startX: rocketX,
    startY: rocketY,
    targetX,
    targetY,
    distanceTraveled: 0,
    maxDistance: distance,
    angle: 0,
    elementRef: null,
    color,
  };

  return { bullet, travelTime };
}

export default function MultiplayerGameScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(performance.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentInput, setCurrentInput] = useState('');
  const lastEmojiTime = useRef<number>(0);

  const invaders = useGameStore((s) => s.invaders);
  const bullets = useGameStore((s) => s.bullets);

  const players = useMultiplayerStore((s) => s.players);
  const myId = useMultiplayerStore((s) => s.myId);
  const timeRemaining = useMultiplayerStore((s) => s.timeRemaining);
  const roomCode = useMultiplayerStore((s) => s.roomCode) ?? '';
  const killToasts = useMultiplayerStore((s) => s.killToasts);

  // Wire up the singleton socket's message handler
  const handleMessage = useCallback((msg: ServerMessage) => {
    const mp = useMultiplayerStore.getState();

    switch (msg.type) {
      case 'spawn': {
        const clientInv = serverToClientInvader(msg.invader);
        useGameStore.getState().addInvader(clientInv);
        mp.addInvader(msg.invader);
        break;
      }

      case 'kill': {
        const inv = useGameStore.getState().invaders.find((i) => i.id === msg.invaderId);
        if (inv) {
          // Play sounds: shoot for all kills, success chime if it's my kill
          try { playShootSound(); } catch { /* audio ctx may not be ready */ }
          if (msg.killedBy === mp.myId) {
            try { playSuccessSound(); } catch { /* */ }
          }

          const killerColor = PLAYER_COLORS[msg.killerColor];
          // Route bullet from the killer's rocket position
          const killerRocketX = getRocketX(mp.players, mp.myId, msg.killedBy);
          const { bullet, travelTime } = createBullet(inv, killerColor, killerRocketX);
          useGameStore.getState().addBullet(bullet);

          // Aim rocket toward the target invader
          const rocketY = window.innerHeight * 0.88;
          const dx = (inv.x + 30) - killerRocketX;
          const dy = (inv.y + 20) - rocketY;
          const aimAngle = Math.atan2(dy, dx) * (180 / Math.PI);
          const rotation = Math.max(-75, Math.min(-15, aimAngle - 90));
          mp.setRocketRotation(msg.killedBy, rotation);

          useGameStore.setState({
            invaders: useGameStore.getState().invaders.map((i) =>
              i.id === msg.invaderId ? { ...i, isDying: true } : i
            ),
          });

          setTimeout(() => {
            useGameStore.getState().removeInvader(msg.invaderId);
            useGameStore.getState().removeBullet(bullet.id);
            mp.clearRocketRotation(msg.killedBy);
          }, travelTime + 500);
        }

        mp.markInvaderKilled(msg.invaderId);
        mp.setPlayers(
          mp.players.map((p) =>
            p.id === msg.killedBy
              ? { ...p, score: msg.newScore, combo: msg.newCombo }
              : p
          )
        );

        mp.addKillToast({
          id: `kill_${Date.now()}_${Math.random()}`,
          killerName: msg.killerName,
          killerColor: msg.killerColor,
          word: inv?.displayWord ?? '',
          points: msg.pointsEarned,
          timestamp: Date.now(),
        });

        // Reset input only if the player was typing the same word that was killed
        if (inv) {
          const currentValue = inputRef.current?.value ?? '';
          if (currentValue.length > 0 && inv.answer.toLowerCase().startsWith(currentValue.toLowerCase())) {
            setCurrentInput('');
            if (inputRef.current) inputRef.current.value = '';
          }
        }
        break;
      }

      case 'missed': {
        useGameStore.getState().removeInvader(msg.invaderId);
        mp.removeInvader(msg.invaderId);
        break;
      }

      case 'attemptRejected': {
        try { playErrorSound(); } catch { /* */ }
        useGameStore.setState({ inputError: true });
        setTimeout(() => useGameStore.setState({ inputError: false }), 300);
        // Reset input on rejected attempt
        setCurrentInput('');
        if (inputRef.current) inputRef.current.value = '';
        break;
      }

      case 'timeTick': {
        mp.setTimeRemaining(msg.timeRemaining);
        break;
      }

      case 'gameOver': {
        mp.setScoreboard(msg.scoreboard);
        mp.setPhase('finished');
        useGameStore.setState({ invaders: [], bullets: [] });
        mp.clearInvaders();
        useGameStore.setState({ screen: 'mpScoreboard' });
        break;
      }

      case 'playerTyping': {
        mp.setPlayerTyping(msg.playerId, msg.currentInput);
        break;
      }

      case 'roomState': {
        mp.setPlayers(msg.players);
        mp.setTimeRemaining(msg.timeRemaining);
        break;
      }

      case 'reaction': {
        mp.setPlayerEmoji(msg.playerId, msg.emoji);
        break;
      }

      default:
        break;
    }
  }, []);

  // Set message handler on mount, clean up on unmount
  useEffect(() => {
    setMessageHandler(handleMessage);
    // Clear invaders from any previous state
    useGameStore.setState({ invaders: [], bullets: [] });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleMessage]);

  // RAF loop for animating invader/bullet positions
  useEffect(() => {
    const animate = (now: number) => {
      const delta = (now - lastFrameRef.current) / (1000 / 60);
      lastFrameRef.current = now;

      const state = useGameStore.getState();
      const viewportWidth = window.innerWidth;

      // Update invader positions
      const updated = state.invaders.map((inv) => {
        if (inv.isDying) return inv;
        const newY = inv.y + inv.speed * delta;
        let newX = inv.x + inv.horizontalDrift * delta;
        let drift = inv.horizontalDrift;
        if (newX < 0 || newX > viewportWidth - 80) {
          drift = -drift;
          newX = Math.max(0, Math.min(newX, viewportWidth - 80));
        }
        return { ...inv, y: newY, x: newX, horizontalDrift: drift };
      });

      // Update bullet positions
      const updatedBullets = state.bullets
        .map((b) => {
          const newX = b.x + b.speedX * delta;
          const newY = b.y + b.speedY * delta;
          const dx = newX - b.startX;
          const dy = newY - b.startY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          return { ...b, x: newX, y: newY, distanceTraveled: dist };
        })
        .filter((b) => b.distanceTraveled < b.maxDistance * 1.2);

      useGameStore.setState({ invaders: updated, bullets: updatedBullets });
      rafRef.current = requestAnimationFrame(animate);
    };

    lastFrameRef.current = performance.now();
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Handle keyboard input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentInput(value);

    // Send typing indicator (throttled would be ideal, but fine for now)
    sendMessage({ type: 'typing', currentInput: value });

    // Check for exact match against any invader
    const state = useGameStore.getState();
    for (const inv of state.invaders) {
      if (inv.isDying) continue;
      if (value.toLowerCase() === inv.answer.toLowerCase()) {
        sendMessage({ type: 'attempt', invaderId: inv.id, typed: value });
        setCurrentInput('');
        e.target.value = '';
        return;
      }
    }

    // Reset input if typed text doesn't match any living invader as a prefix
    if (value.length > 0) {
      const matchesAnyPrefix = state.invaders.some(
        (inv) => !inv.isDying && inv.answer.toLowerCase().startsWith(value.toLowerCase())
      );
      if (!matchesAnyPrefix) {
        setCurrentInput('');
        e.target.value = '';
      }
    }
  }, []);

  const REACTION_EMOJIS = ['\u{1F525}', '\u{1F480}', '\u{1F3C6}', '\u{1F624}', '\u{1F4AA}', '\u{1F3AF}'];

  const handleEmojiClick = useCallback((emoji: string) => {
    const now = Date.now();
    if (now - lastEmojiTime.current < 2000) return; // 2s cooldown
    lastEmojiTime.current = now;
    sendMessage({ type: 'reaction', emoji });
  }, []);

  // Keep input focused
  useEffect(() => {
    const focus = () => inputRef.current?.focus();
    focus();
    const interval = setInterval(focus, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className={gameStyles.gameContainer} tabIndex={0}>
      <StarfieldCanvas mode="game" />

      {/* Top bar with timer and scores */}
      <div className={styles.mpTopBar}>
        <div className={styles.mpTimer}>
          {timeRemaining != null ? `${timeRemaining}s` : ''}
        </div>
        <div className={styles.mpRoomCode}>{roomCode}</div>
      </div>

      {/* Player scores sidebar */}
      <div className={styles.mpSidebar}>
        {players.map((p) => (
          <div key={p.id} className={styles.mpPlayerScore}>
            <div
              className={styles.mpPlayerDot}
              style={{ background: PLAYER_COLORS[p.color] }}
            />
            <div className={styles.mpPlayerInfo}>
              <div className={styles.mpPlayerName}>
                {p.name} {p.id === myId ? '(You)' : ''}
              </div>
              <div className={styles.mpPlayerPts}>{p.score} pts</div>
            </div>
            {p.combo >= 3 && (
              <div className={styles.mpCombo}>x{p.combo}</div>
            )}
          </div>
        ))}
      </div>

      {/* Kill feed */}
      <div className={styles.mpKillFeed}>
        {killToasts.map((toast) => (
          <div key={toast.id} className={styles.mpKillToast}>
            <span style={{ color: PLAYER_COLORS[toast.killerColor] }}>
              {toast.killerName}
            </span>
            : {toast.word} +{toast.points}
          </div>
        ))}
      </div>

      <InvaderArea />
      {bullets.map((b) => (
        <Bullet key={b.id} bullet={b} />
      ))}
      <MultiplayerRockets />

      {/* Hidden input for capturing keyboard */}
      <input
        ref={inputRef}
        className={styles.mpHiddenInput}
        value={currentInput}
        onChange={handleInputChange}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />

      {/* Emoji reaction bar */}
      <div className={styles.mpEmojiBar}>
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            className={styles.mpEmojiBtn}
            onClick={() => handleEmojiClick(emoji)}
            type="button"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Visible input display */}
      <div className={styles.mpInputDisplay}>
        {currentInput || '\u00A0'}
      </div>
    </div>
  );
}
