'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import styles from '@/styles/celebration.module.css';

function animateValue(el: HTMLElement, target: number, suffix: string = '', duration = 1200) {
  let start: number | null = null;
  const animate = (now: number) => {
    if (!start) start = now;
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
}

export default function CelebrationStats() {
  const mode = useGameStore((s) => s.mode);
  const correctCharacters = useGameStore((s) => s.correctCharacters);
  const incorrectAttempts = useGameStore((s) => s.incorrectAttempts);
  const missedWords = useGameStore((s) => s.missedWords);
  const startTime = useGameStore((s) => s.startTime);
  const isMathMode = useGameStore((s) => s.isMathMode);
  const mathQuestionsAnswered = useGameStore((s) => s.mathQuestionsAnswered);
  const totalMathSolveTime = useGameStore((s) => s.totalMathSolveTime);

  const wpmRef = useRef<HTMLDivElement>(null);
  const accRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const totalMinutes = startTime ? (Date.now() - startTime) / 60000 : 1;
    const totalSeconds = startTime ? (Date.now() - startTime) / 1000 : 1;

    if (isMathMode || mode === 'math') {
      // SPS (solves per second)
      const sps = totalSeconds > 0 ? mathQuestionsAnswered / totalSeconds : 0;
      if (wpmRef.current) animateValue(wpmRef.current, Math.round(sps * 100) / 100, '');
      // Avg solve time
      const avgSolve = mathQuestionsAnswered > 0 ? totalMathSolveTime / mathQuestionsAnswered / 1000 : 0;
      if (accRef.current) animateValue(accRef.current, Math.round(avgSolve * 10) / 10, 's');
    } else {
      // WPM
      const wpm = totalMinutes > 0 ? (correctCharacters / 5) / totalMinutes : 0;
      if (wpmRef.current) animateValue(wpmRef.current, Math.round(wpm), '');
      // Accuracy
      const total = correctCharacters + incorrectAttempts;
      const accuracy = total > 0 ? (correctCharacters / total) * 100 : 100;
      if (accRef.current) animateValue(accRef.current, Math.round(accuracy), '%');
    }
  }, [correctCharacters, incorrectAttempts, startTime, isMathMode, mode, mathQuestionsAnswered, totalMathSolveTime]);

  return (
    <>
      <div className={styles.leftStats}>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>
            {isMathMode || mode === 'math' ? 'SPS' : 'WPM'}
          </div>
          <div ref={wpmRef} className={styles.statValue}>
            0
          </div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>
            {isMathMode || mode === 'math' ? 'AVG SOLVE' : 'ACCURACY'}
          </div>
          <div ref={accRef} className={`${styles.statValue} ${styles.celebrationAccuracy}`}>
            0
          </div>
        </div>
      </div>

      <div className={styles.celebrationRocketIcon}>🚀</div>

      <div className={styles.bottomStats}>
        <div className={styles.bottomStatsLeft}>
          <div className={styles.bottomStatLabel}>Incorrect attempts</div>
          <div className={styles.bottomStatLabel}>Missed</div>
        </div>
        <div className={styles.bottomStatsRight}>
          <div className={styles.bottomStatValue}>{incorrectAttempts}</div>
          <div className={styles.bottomStatValue}>{missedWords}</div>
        </div>
      </div>
    </>
  );
}
