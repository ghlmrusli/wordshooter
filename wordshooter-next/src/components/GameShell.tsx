'use client';

import { useEffect, lazy, Suspense } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useAuth } from '@/hooks/useAuth';
import { useGameRecordSaver } from '@/hooks/useGameRecordSaver';
import StartScreen from '@/components/screens/StartScreen';
import GameScreen from '@/components/screens/GameScreen';
import CelebrationScreen from '@/components/screens/CelebrationScreen';

// Lazy-load screens not needed on first paint
const LeaderboardScreen = lazy(() => import('@/components/screens/LeaderboardScreen'));
const LobbyScreen = lazy(() => import('@/components/screens/LobbyScreen'));
const MultiplayerGameScreen = lazy(() => import('@/components/screens/MultiplayerGameScreen'));
const MultiplayerScoreboard = lazy(() => import('@/components/screens/MultiplayerScoreboard'));

export default function GameShell() {
  const screen = useGameStore((state) => state.screen);

  // Init auth (guest ID + JWT check)
  useAuth();

  // Auto-save game records on celebration
  useGameRecordSaver();

  // Add icons-loaded class after font loads
  useEffect(() => {
    if (document.fonts) {
      document.fonts.ready.then(() => {
        document.body.classList.add('icons-loaded');
      });
    }
    // Fallback: always add after 2 seconds
    const timer = setTimeout(() => {
      document.body.classList.add('icons-loaded');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {screen === 'start' && <StartScreen />}
      {screen === 'game' && <GameScreen />}
      {screen === 'celebration' && <CelebrationScreen />}
      <Suspense fallback={null}>
        {screen === 'leaderboard' && <LeaderboardScreen />}
        {screen === 'lobby' && <LobbyScreen />}
        {screen === 'mpGame' && <MultiplayerGameScreen />}
        {screen === 'mpScoreboard' && <MultiplayerScoreboard />}
      </Suspense>
    </>
  );
}
