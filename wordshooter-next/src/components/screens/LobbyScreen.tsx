'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useMultiplayerStore } from '@/multiplayer/multiplayerStore';
import { connectToRoom, sendMessage, disconnect } from '@/multiplayer/socketManager';
import { useStarfield } from '@/hooks/useStarfield';
import { PLAYER_COLORS } from '../../../party/types';
import type { ServerMessage } from '../../../party/types';
import styles from '@/styles/lobby.module.css';
import clsx from 'clsx';

type LobbyView = 'menu' | 'create' | 'join' | 'waiting';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function LobbyScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const getSpeedScale = useCallback(() => 0.008, []);
  useStarfield(canvasRef, getSpeedScale);

  const [view, setView] = useState<LobbyView>('menu');
  const [playerName, setPlayerName] = useState('');
  const [selectedColor, setSelectedColor] = useState(0);
  const [joinCode, setJoinCode] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const joinSentRef = useRef(false);

  // Host settings
  const [selectedMode, setSelectedMode] = useState<'words' | 'math'>('words');
  const [selectedDuration, setSelectedDuration] = useState<60 | 90 | 120>(60);

  const mpStore = useMultiplayerStore();

  const handleMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case 'roomState':
        useMultiplayerStore.getState().setMyId(msg.yourId);
        useMultiplayerStore.getState().setPlayers(msg.players);
        useMultiplayerStore.getState().setPhase(msg.phase === 'lobby' ? 'lobby' : msg.phase as any);
        useMultiplayerStore.getState().setRoomCode(msg.roomCode);
        useMultiplayerStore.getState().setMode(msg.mode);
        useMultiplayerStore.getState().setDuration(msg.duration);
        useMultiplayerStore.getState().setTimeRemaining(msg.timeRemaining);

        // Auto-send join if we haven't yet
        if (!joinSentRef.current) {
          joinSentRef.current = true;
          const name = playerName.trim() || 'Player';
          sendMessage({ type: 'join', playerName: name, playerColor: selectedColor });
        }
        break;

      case 'countdown':
        useMultiplayerStore.getState().setPhase('countdown');
        useMultiplayerStore.getState().setCountdown(msg.count);
        if (msg.count === 0) {
          useMultiplayerStore.getState().setPhase('playing');
          useMultiplayerStore.getState().setMultiplayer(true);
          useGameStore.setState({ screen: 'mpGame' });
        }
        break;

      case 'error':
        useMultiplayerStore.getState().setError(msg.message);
        break;

      default:
        break;
    }
  }, [playerName, selectedColor]);

  // Connect when roomCode is set and view is waiting
  useEffect(() => {
    if (roomCode && view === 'waiting') {
      joinSentRef.current = false;
      connectToRoom(roomCode, handleMessage);
    }
  }, [roomCode, view, handleMessage]);

  const handleCreate = () => {
    if (!playerName.trim()) return;
    const code = generateRoomCode();
    setRoomCode(code);
    setView('waiting');
  };

  const handleJoin = () => {
    if (!playerName.trim() || joinCode.length !== 4) return;
    setRoomCode(joinCode.toUpperCase());
    setView('waiting');
  };

  const handleStartGame = () => {
    sendMessage({ type: 'startGame', mode: selectedMode, duration: selectedDuration });
  };

  const handleBack = () => {
    if (view === 'waiting') {
      sendMessage({ type: 'leave' });
      disconnect();
      setRoomCode('');
      mpStore.reset();
    }
    setView('menu');
  };

  const isHost = mpStore.players.find((p) => p.id === mpStore.myId)?.isHost ?? false;

  return (
    <div className={styles.lobbyContainer}>
      <canvas ref={canvasRef} className={styles.starCanvas} />

      <div className={styles.lobbyContent}>
        {view !== 'menu' && (
          <button className={styles.backBtn} onClick={handleBack}>
            &lt; Back
          </button>
        )}

        {/* ── Main menu ── */}
        {view === 'menu' && (
          <>
            <div className={styles.lobbyTitle}>Multiplayer</div>
            <div className={styles.lobbySubtitle}>Race to type fastest!</div>

            <div className={styles.formSection}>
              <div className={styles.inputGroup}>
                <span className={styles.inputLabel}>Your Name</span>
                <input
                  className={styles.textInput}
                  placeholder="Enter name..."
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value.slice(0, 12))}
                  maxLength={12}
                />
              </div>

            </div>

            <div className={styles.buttonRow}>
              <div className={clsx(styles.lobbyBtn, styles.lobbyBtnPrimary)} onClick={handleCreate}>
                <div className={styles.lobbyBtnLabel}>Create Room</div>
                <div className={styles.lobbyBtnDesc}>Host a game</div>
              </div>
              <div className={styles.lobbyBtn} onClick={() => playerName.trim() && setView('join')}>
                <div className={styles.lobbyBtnLabel}>Join Room</div>
                <div className={styles.lobbyBtnDesc}>Enter code</div>
              </div>
            </div>

            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button
                className={styles.backBtn}
                onClick={() => useGameStore.setState({ screen: 'start' })}
              >
                Back to Menu
              </button>
            </div>
          </>
        )}

        {/* ── Join form ── */}
        {view === 'join' && (
          <>
            <div className={styles.lobbyTitle}>Join Room</div>
            <div className={styles.lobbySubtitle}>Enter 4-letter room code</div>

            <div className={styles.formSection}>
              <input
                className={clsx(styles.textInput, styles.codeInput)}
                placeholder="ABCD"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase())}
                maxLength={4}
                autoFocus
              />
            </div>

            <div
              className={clsx(styles.lobbyBtn, styles.lobbyBtnPrimary)}
              onClick={handleJoin}
              style={{ opacity: joinCode.length === 4 ? 1 : 0.4 }}
            >
              <div className={styles.lobbyBtnLabel}>Join</div>
            </div>
          </>
        )}

        {/* ── Waiting room ── */}
        {view === 'waiting' && (
          <>
            <div className={styles.roomCode}>
              <div className={styles.roomCodeLabel}>Room Code</div>
              <div className={styles.roomCodeValue}>{roomCode}</div>
            </div>

            {mpStore.countdownValue !== null && mpStore.phase === 'countdown' && (
              <div style={{ textAlign: 'center', fontSize: 40, color: '#4ecca3', marginBottom: 16, fontFamily: "'Press Start 2P', cursive" }}>
                {mpStore.countdownValue > 0 ? mpStore.countdownValue : 'GO!'}
              </div>
            )}

            <div className={styles.playerList}>
              {mpStore.players.map((p) => (
                <div key={p.id} className={styles.playerItem}>
                  <div
                    className={styles.playerDot}
                    style={{ background: PLAYER_COLORS[p.color] }}
                  />
                  <span className={styles.playerName}>{p.name}</span>
                  {p.isHost && <span className={styles.playerHost}>HOST</span>}
                  {p.id === mpStore.myId && <span className={styles.playerYou}>YOU</span>}
                </div>
              ))}
            </div>

            {mpStore.players.length < 2 && (
              <div className={styles.waitingText}>
                Waiting for players... ({mpStore.players.length}/5)
              </div>
            )}

            {isHost && mpStore.phase === 'lobby' && (
              <>
                <div className={styles.inputGroup}>
                  <span className={styles.inputLabel}>Mode</span>
                  <div className={styles.modeSelect}>
                    <div
                      className={clsx(styles.modeOption, selectedMode === 'words' && styles.modeOptionSelected)}
                      onClick={() => setSelectedMode('words')}
                    >
                      <div className={styles.modeOptionEmoji}>👾</div>
                      <div className={styles.modeOptionName}>Words</div>
                    </div>
                    <div
                      className={clsx(styles.modeOption, selectedMode === 'math' && styles.modeOptionSelected)}
                      onClick={() => setSelectedMode('math')}
                    >
                      <div className={styles.modeOptionEmoji}>👽</div>
                      <div className={styles.modeOptionName}>Math</div>
                    </div>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <span className={styles.inputLabel}>Duration</span>
                  <div className={styles.durationSelect}>
                    {([60, 90, 120] as const).map((d) => (
                      <div
                        key={d}
                        className={clsx(styles.durationOption, selectedDuration === d && styles.durationOptionSelected)}
                        onClick={() => setSelectedDuration(d)}
                      >
                        {d}s
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  className={styles.startGameBtn}
                  onClick={handleStartGame}
                  disabled={mpStore.players.length < 2}
                >
                  Start Game
                </button>
              </>
            )}

            {!isHost && mpStore.phase === 'lobby' && (
              <div className={styles.waitingText}>
                Waiting for host to start...
              </div>
            )}

            {mpStore.error && (
              <div className={styles.errorMsg}>{mpStore.error}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
