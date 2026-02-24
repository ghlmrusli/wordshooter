'use client';

import { useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import InputDisplay from './InputDisplay';
import styles from '@/styles/game.module.css';
import clsx from 'clsx';

export default function RocketArea() {
  const gunRef = useRef<HTMLDivElement>(null);
  const isShooting = useGameStore((s) => s.isShooting);
  const targetInvaderId = useGameStore((s) => s.targetInvaderId);
  const invaders = useGameStore((s) => s.invaders);

  // Compute rocket rotation toward target invader
  let rotation = -45; // default resting angle
  if (targetInvaderId) {
    const target = invaders.find((inv) => inv.id === targetInvaderId);
    if (target && typeof window !== 'undefined') {
      const rocketX = window.innerWidth / 2;
      const rocketY = window.innerHeight * 0.85;
      const dx = target.x - rocketX;
      const dy = target.y - rocketY;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      // Clamp rotation between -75 and -15 degrees
      rotation = Math.max(-75, Math.min(-15, angle - 90));
    }
  }

  return (
    <div className={styles.bottomSide}>
      <div
        ref={gunRef}
        className={clsx(styles.gun, isShooting && styles.shoot, targetInvaderId && styles.aiming)}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        🚀
      </div>
      <InputDisplay />
    </div>
  );
}
