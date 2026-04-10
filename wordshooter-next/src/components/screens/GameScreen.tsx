'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useGameEngine } from '@/hooks/useGameEngine';
import { useKeyboardInput } from '@/hooks/useKeyboardInput';
import { useResponsive } from '@/hooks/useResponsive';
import { setInputCallbacks, type InputCallbacks } from '@/engine/InputHandler';
import { spawnMathInvader, pickSentence } from '@/engine/SpawnManager';
import { beginPhaseTransition, completePhaseTransition } from '@/engine/JourneyManager';
import { getSentenceDuration } from '@/engine/DifficultyManager';
import { applySentenceCompleteScore, applySentenceSkipPenalty } from '@/engine/ScoreManager';
import { checkJourneyPhaseTransition } from '@/engine/JourneyManager';
import { playShootSound, playErrorSound, playSuccessSound } from '@/audio/SoundEffects';
import type { GameEngineCallbacks } from '@/engine/GameEngine';
import type { InvaderData, BulletData } from '@/types/game';
import TopBar from '@/components/game/TopBar';
import StarfieldCanvas from '@/components/game/StarfieldCanvas';
import InvaderArea from '@/components/game/InvaderArea';
import Bullet from '@/components/game/Bullet';
import RocketArea from '@/components/game/RocketArea';
import ComboDisplay from '@/components/game/ComboDisplay';
import SentencesOverlay from '@/components/game/SentencesOverlay';
import OnScreenKeyboard from '@/components/keyboard/OnScreenKeyboard';
import NumberKeyboard from '@/components/keyboard/NumberKeyboard';
import PauseOverlay from '@/components/screens/PauseOverlay';
import PhaseTransitionOverlay from '@/components/screens/PhaseTransitionOverlay';
import styles from '@/styles/game.module.css';

let bulletIdCounter = 0;

function createBullet(invader: InvaderData): { bullet: BulletData; travelTime: number } {
  const rocketX = window.innerWidth / 2;
  const rocketY = window.innerHeight * 0.85;
  const targetX = invader.x + 30;
  const targetY = invader.y + 20;

  const dx = targetX - rocketX;
  const dy = targetY - rocketY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const speed = 49.5; // px per frame (matching original)
  const speedX = (dx / distance) * speed;
  const speedY = (dy / distance) * speed;
  const travelTime = (distance / speed) * (1000 / 60);

  const bullet: BulletData = {
    id: `bullet_${++bulletIdCounter}_${Date.now()}`,
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
  };

  return { bullet, travelTime };
}

export default function GameScreen() {
  const { engine, start, stop } = useGameEngine();
  const { isMobile } = useResponsive();
  useKeyboardInput();

  const bullets = useGameStore((s) => s.bullets);
  const isMathMode = useGameStore((s) => s.isMathMode);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sentenceSpawningRef = useRef(false);

  // Sentence spawning helper
  const spawnSentence = useCallback(() => {
    if (sentenceSpawningRef.current) return;
    sentenceSpawningRef.current = true;

    const { text } = pickSentence();
    const duration = getSentenceDuration();

    useGameStore.setState({
      isSentenceActive: true,
      currentSentenceText: text,
      currentInput: '',
      sentenceTimeLeft: duration,
      sentenceDuration: duration,
      sentenceAnimating: 'in',
      sentenceCharIndex: 0,
    });

    // Clear animating state after slide-in animation
    setTimeout(() => {
      useGameStore.setState({ sentenceAnimating: null });
      sentenceSpawningRef.current = false;
    }, 500);

    // Start countdown timer
    if (sentenceTimerRef.current) clearInterval(sentenceTimerRef.current);
    sentenceTimerRef.current = setInterval(() => {
      const state = useGameStore.getState();
      if (state.isPaused) return;

      const newTime = state.sentenceTimeLeft - 1;
      useGameStore.setState({ sentenceTimeLeft: newTime });

      if (newTime <= 0) {
        // Sentence timed out
        if (sentenceTimerRef.current) clearInterval(sentenceTimerRef.current);

        const result = applySentenceSkipPenalty();

        useGameStore.setState({ sentenceAnimating: 'out' });
        setTimeout(() => {
          useGameStore.setState({
            isSentenceActive: false,
            sentenceAnimating: null,
            currentInput: '',
          });

          if (result.isGameOver) {
            useGameStore.getState().fullCleanup();
            useGameStore.setState({ screen: 'celebration' });
            return;
          }

          // Delay before allowing next sentence — engine will spawn it
          setTimeout(() => {
            const s = useGameStore.getState();
            if (!s.isGameOver && s.screen === 'game') {
              engine.current?.resetSentenceRequest();
            }
          }, 1000);
        }, 350);
      }
    }, 1000);
  }, [engine]);

  // Handle sentence completion via store subscription
  useEffect(() => {
    const unsub = useGameStore.subscribe((state, prev) => {
      if (
        state.isSentenceActive &&
        state.currentSentenceText.length > 0 &&
        state.currentInput === state.currentSentenceText &&
        prev.currentInput !== state.currentInput
      ) {
        // Sentence completed!
        if (sentenceTimerRef.current) clearInterval(sentenceTimerRef.current);

        const scoreResult = applySentenceCompleteScore();

        useGameStore.setState({ sentenceAnimating: 'out' });
        setTimeout(() => {
          useGameStore.setState({
            isSentenceActive: false,
            sentenceAnimating: null,
            currentInput: '',
          });

          // Check journey phase transition
          const phaseResult = checkJourneyPhaseTransition();
          if (phaseResult?.changed && phaseResult.showTransition) {
            beginPhaseTransition(phaseResult);
            useGameStore.setState({
              phaseTransition: {
                phase: phaseResult.newPhase,
                name: phaseResult.phaseName,
                color: phaseResult.phaseColor,
              },
            });
            setTimeout(() => {
              const s = useGameStore.getState();
              if (s.isGameOver || s.screen !== 'game') return;
              const newMode = completePhaseTransition(phaseResult);
              useGameStore.setState({ phaseTransition: null });
              if (newMode === 'sentences') engine.current?.resetSentenceRequest();
              else if (newMode === 'math') spawnMathInvader(window.innerWidth);
            }, 2000);
            return;
          }

          if (scoreResult.isCelebration) {
            useGameStore.getState().fullCleanup();
            useGameStore.setState({ screen: 'celebration' });
            return;
          }

          // Delay before allowing next sentence — engine will spawn it
          setTimeout(() => {
            const s = useGameStore.getState();
            if (!s.isGameOver && s.screen === 'game') {
              engine.current?.resetSentenceRequest();
            }
          }, 1000);
        }, 350);
      }
    });
    return unsub;
  }, [spawnSentence, engine]);

  // Wire up GameEngine callbacks
  useEffect(() => {
    if (!engine.current) return;

    const engineCallbacks: GameEngineCallbacks = {
      getViewportWidth: () => window.innerWidth,
      getViewportHeight: () => window.innerHeight,

      onInvaderSpawned: () => {
        // React handles rendering via store subscription — no-op
      },

      onInvaderMissed: () => {
        // Trigger screen shake
        if (containerRef.current) {
          containerRef.current.style.animation = 'none';
          void containerRef.current.offsetHeight;
          containerRef.current.style.animation = 'shake 0.3s';
        }
      },

      onScoreChange: () => {
        // Score animation is handled by TopBar's local useEffect
      },

      onGameOver: () => {
        useGameStore.getState().fullCleanup();
        useGameStore.setState({ screen: 'celebration' });
      },

      onMathInvaderMissed: () => {
        setTimeout(() => {
          const state = useGameStore.getState();
          if (!state.isGameOver && state.screen === 'game') {
            spawnMathInvader(window.innerWidth);
          }
        }, 1000);
      },

      onPhaseTransition: (result) => {
        beginPhaseTransition(result);

        useGameStore.setState({
          phaseTransition: {
            phase: result.newPhase,
            name: result.phaseName,
            color: result.phaseColor,
          },
        });

        setTimeout(() => {
          const state = useGameStore.getState();
          if (state.isGameOver || state.screen !== 'game') return;

          const newMode = completePhaseTransition(result);
          useGameStore.setState({ phaseTransition: null });

          if (newMode === 'sentences') {
            engine.current?.resetSentenceRequest();
          } else if (newMode === 'math') {
            spawnMathInvader(window.innerWidth);
          }
        }, 2000);
      },

      onSentenceNeeded: () => {
        // Engine detected sentences mode with no active sentence — spawn one
        spawnSentence();
      },

      removeBulletElement: (bulletId: string) => {
        useGameStore.getState().removeBullet(bulletId);
      },

      removeInvaderElement: (invaderId: string) => {
        useGameStore.getState().removeInvader(invaderId);
      },
    };

    engine.current.setCallbacks(engineCallbacks);
  }, [engine, spawnSentence]);

  // Wire up InputHandler callbacks
  useEffect(() => {
    const inputCallbacks: InputCallbacks = {
      playShootSound: () => {
        try { playShootSound(); } catch { /* audio context may not be ready */ }
      },

      playSuccessSound: () => {
        try { playSuccessSound(); } catch { /* audio context may not be ready */ }
      },

      playErrorSound: () => {
        try { playErrorSound(); } catch { /* audio context may not be ready */ }
        useGameStore.setState({ inputError: true });
        setTimeout(() => useGameStore.setState({ inputError: false }), 300);
      },

      shoot: (invader: InvaderData): number => {
        const { bullet, travelTime } = createBullet(invader);
        useGameStore.getState().addBullet(bullet);

        useGameStore.setState({ isShooting: true });
        setTimeout(() => useGameStore.setState({ isShooting: false }), 100);

        return travelTime;
      },

      onScoreChange: () => {
        // Handled by TopBar's local state
      },

      onComboUpdate: () => {
        // React reads combo from store directly
      },

      updateWordProgress: () => {
        // React handles via store subscription (currentInput changes)
      },

      updateInputDisplay: () => {
        // React handles via store subscription
      },

      updateKeyboardHighlight: () => {
        // Could be wired up for keyboard highlighting but not critical
      },

      rotateRocketToTarget: () => {
        // RocketArea computes rotation from targetInvaderId in store
      },

      onInvaderKilled: (invader: InvaderData, travelTime: number) => {
        // Invader is already marked as dying in store by InputHandler
        // Remove after bullet travel + death animation
        setTimeout(() => {
          useGameStore.getState().removeInvader(invader.id);
        }, travelTime + 500);
      },

      onGameOver: () => {
        useGameStore.getState().fullCleanup();
        useGameStore.setState({ screen: 'celebration' });
      },

      onSentenceComplete: () => {
        // Sentence completion is handled by the subscribe effect above.
        // The InputHandler calls this when currentInput === targetSentence,
        // but the subscribe handler is the authoritative handler for scoring
        // and spawning the next sentence. This is intentionally a no-op.
      },

      onPhaseTransition: (result) => {
        if (!result || !result.changed) return;

        beginPhaseTransition(result);

        useGameStore.setState({
          phaseTransition: {
            phase: result.newPhase,
            name: result.phaseName,
            color: result.phaseColor,
          },
        });

        setTimeout(() => {
          const state = useGameStore.getState();
          if (state.isGameOver || state.screen !== 'game') return;

          const newMode = completePhaseTransition(result);
          useGameStore.setState({ phaseTransition: null });

          if (newMode === 'sentences') {
            engine.current?.resetSentenceRequest();
          } else if (newMode === 'math') {
            spawnMathInvader(window.innerWidth);
          }
        }, 2000);
      },

      scheduleNextMathSpawn: (delayMs: number) => {
        setTimeout(() => {
          const state = useGameStore.getState();
          if (!state.isGameOver && state.screen === 'game') {
            spawnMathInvader(window.innerWidth);
          }
        }, delayMs);
      },
    };

    setInputCallbacks(inputCallbacks);
  }, [engine]);

  useEffect(() => {
    start();
    return () => {
      stop();
      // Clean up sentence timer on unmount
      if (sentenceTimerRef.current) clearInterval(sentenceTimerRef.current);
    };
  }, [start, stop]);

  return (
    <>
      <TopBar />
      <div ref={containerRef} className={styles.gameContainer} tabIndex={0}>
        <StarfieldCanvas mode="game" />
        <InvaderArea />
        {bullets.map((b) => (
          <Bullet key={b.id} bullet={b} />
        ))}
        <RocketArea />
        <ComboDisplay />

        {isMobile && !isMathMode && <OnScreenKeyboard />}
        {isMobile && isMathMode && <NumberKeyboard />}
      </div>

      <SentencesOverlay />
      <PauseOverlay />
      <PhaseTransitionOverlay />
    </>
  );
}
