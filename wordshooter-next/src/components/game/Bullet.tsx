'use client';

import type { BulletData } from '@/types/game';
import styles from '@/styles/game.module.css';

interface BulletProps {
  bullet: BulletData;
}

export default function Bullet({ bullet }: BulletProps) {
  // Compute angle from velocity vector
  const angle = Math.atan2(bullet.targetY - bullet.startY, bullet.targetX - bullet.startX);
  const degrees = angle * (180 / Math.PI) + 90; // +90 because bullet visual is vertical

  return (
    <div
      className={styles.bullet}
      style={{
        left: `${bullet.x}px`,
        top: `${bullet.y}px`,
        height: '40px',
        transform: `rotate(${degrees}deg)`,
      }}
    />
  );
}
