'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getRank } from '@/data/ranks';
import styles from '@/styles/celebration.module.css';

export default function CelebrationHeader() {
  const score = useGameStore((s) => s.score);
  const scoreRef = useRef<HTMLDivElement>(null);
  const rank = getRank(score);

  // Animate score count-up
  useEffect(() => {
    const el = scoreRef.current;
    if (!el) return;
    let current = 0;
    const target = score;
    const duration = 1500;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      current = Math.round(eased * target);
      el.textContent = String(current);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div className={styles.celebrationHeader}>
      <div className={styles.headerLeft}>
        <div className={styles.headerLabel}>Score</div>
        <div className={styles.headerRank}>{rank}</div>
      </div>
      <div ref={scoreRef} className={styles.headerValue}>
        0
      </div>
    </div>
  );
}
