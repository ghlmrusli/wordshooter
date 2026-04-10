'use client';

import { useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { InvaderData } from '@/types/game';
import styles from '@/styles/game.module.css';
import clsx from 'clsx';

interface InvaderProps {
  invader: InvaderData;
}

export default function Invader({ invader }: InvaderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const currentInput = useGameStore((s) => s.currentInput);
  const targetInvaderId = useGameStore((s) => s.targetInvaderId);

  const isTarget = targetInvaderId === invader.id;
  const word = invader.type === 'math' ? invader.displayWord : invader.word;
  const answer = invader.type === 'math' ? invader.answer : invader.word;

  // Calculate progress
  const progress = isTarget ? (currentInput.length / answer.length) * 100 : 0;

  const emoji = invader.type === 'math' ? '👽' : invader.type === 'letter' ? '⭐' : '👾';

  // Fade out as invader approaches the bottom (65%-70% of viewport)
  let opacity = 1;
  if (typeof window !== 'undefined') {
    const fadeStart = window.innerHeight * 0.65;
    const fadeEnd = window.innerHeight * 0.70;
    if (invader.y >= fadeStart && invader.y < fadeEnd) {
      opacity = Math.max(0, 1 - (invader.y - fadeStart) / (fadeEnd - fadeStart));
    }
  }

  return (
    <div
      ref={ref}
      className={clsx(styles.invader, invader.isDying && styles.dying)}
      style={{
        left: `${invader.x}px`,
        top: `${invader.y}px`,
        opacity,
      }}
      data-invader-id={invader.id}
    >
      <div className={styles.invaderEmoji}>{emoji}</div>
      <div
        className={clsx(
          styles.invaderWord,
          isTarget && styles.typing
        )}
        style={{ '--progress': `${progress}%` } as React.CSSProperties}
      >
        {word.split('').map((char, i) => (
          <span key={i} className={styles.char}>
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}
