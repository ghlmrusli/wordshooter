'use client';

import { useGameStore } from '@/store/gameStore';
import Invader from './Invader';
import styles from '@/styles/game.module.css';

export default function InvaderArea() {
  const invaders = useGameStore((s) => s.invaders);

  return (
    <div className={styles.topSide}>
      {invaders.map((inv) => (
        <Invader key={inv.id} invader={inv} />
      ))}
    </div>
  );
}
