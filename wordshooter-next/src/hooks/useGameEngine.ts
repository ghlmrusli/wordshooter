'use client';

import { useRef, useEffect, useCallback } from 'react';
import { GameEngine } from '@/engine/GameEngine';

export function useGameEngine() {
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    engineRef.current = new GameEngine();
    return () => {
      engineRef.current?.stop();
    };
  }, []);

  const start = useCallback(() => {
    engineRef.current?.start();
  }, []);

  const stop = useCallback(() => {
    engineRef.current?.stop();
  }, []);

  return { engine: engineRef, start, stop };
}
