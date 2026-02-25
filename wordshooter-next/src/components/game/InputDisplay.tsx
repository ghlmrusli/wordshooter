'use client';

import { useGameStore } from '@/store/gameStore';
import styles from '@/styles/game.module.css';
import clsx from 'clsx';

export default function InputDisplay() {
  const currentInput = useGameStore((s) => s.currentInput);
  const targetInvaderId = useGameStore((s) => s.targetInvaderId);
  const invaders = useGameStore((s) => s.invaders);
  const inputError = useGameStore((s) => s.inputError);
  const isSentenceActive = useGameStore((s) => s.isSentenceActive);

  // Hide during sentences mode — input is shown inline on the sentence
  if (isSentenceActive) return null;

  const targetInvader = invaders.find((i) => i.id === targetInvaderId);
  const targetWord = targetInvader
    ? targetInvader.type === 'math'
      ? targetInvader.answer
      : targetInvader.word
    : '';

  const hasInput = currentInput.length > 0;

  return (
    <div
      className={clsx(
        styles.inputDisplay,
        hasInput && styles.inputDisplayActive,
        inputError && styles.inputDisplayError
      )}
    >
      {targetWord ? (
        <>
          <span className={styles.typed}>{currentInput}</span>
          <span className={styles.untyped}>{targetWord.slice(currentInput.length)}</span>
        </>
      ) : (
        currentInput && <span className={styles.typed}>{currentInput}</span>
      )}
    </div>
  );
}
