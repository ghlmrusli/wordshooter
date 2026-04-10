'use client';

import { useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useStarfield } from '@/hooks/useStarfield';
import styles from '@/styles/game.module.css';

interface StarfieldCanvasProps {
  mode?: 'game' | 'menu';
}

export default function StarfieldCanvas({ mode = 'game' }: StarfieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getSpeedScale = useCallback(() => {
    if (mode === 'menu') return 0.008;
    const score = useGameStore.getState().score;
    return 0.008 + 0.292 * Math.pow(Math.min(score, 1000) / 1000, 2.2);
  }, [mode]);

  useStarfield(canvasRef, getSpeedScale);

  return <canvas ref={canvasRef} className={styles.starCanvas} />;
}
