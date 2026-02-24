'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import StartScreen from '@/components/screens/StartScreen';
import GameScreen from '@/components/screens/GameScreen';
import CelebrationScreen from '@/components/screens/CelebrationScreen';

export default function GameShell() {
  const screen = useGameStore((state) => state.screen);

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
    </>
  );
}
