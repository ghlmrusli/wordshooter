'use client';

import { useGameStore } from '@/store/gameStore';
import styles from '@/styles/sentences.module.css';
import clsx from 'clsx';

export default function SentencesOverlay() {
  const isSentenceActive = useGameStore((s) => s.isSentenceActive);
  const currentSentenceText = useGameStore((s) => s.currentSentenceText);
  const currentInput = useGameStore((s) => s.currentInput);
  const sentenceCharIndex = currentInput.length;
  const sentenceTimeLeft = useGameStore((s) => s.sentenceTimeLeft);
  const sentenceDuration = useGameStore((s) => s.sentenceDuration);
  const sentenceAnimating = useGameStore((s) => s.sentenceAnimating);

  if (!isSentenceActive && !sentenceAnimating) return null;

  const fillPercent = sentenceDuration > 0 ? (sentenceTimeLeft / sentenceDuration) * 100 : 100;

  // Build words with character spans
  const renderText = () => {
    if (!currentSentenceText) return null;

    const words = currentSentenceText.split(' ');
    let charIdx = 0;

    return words.map((word, wi) => {
      const chars = (wi > 0 ? ' ' + word : word).split('');
      const wordSpan = chars.map((ch) => {
        const idx = charIdx++;
        const isCorrect = idx < sentenceCharIndex;
        const isCurrent = idx === sentenceCharIndex;
        return (
          <span
            key={idx}
            className={clsx(
              styles.char,
              isCorrect && styles.correct,
              isCurrent && styles.current
            )}
          >
            {ch}
          </span>
        );
      });
      return (
        <span key={wi} className={styles.word}>
          {wordSpan}
        </span>
      );
    });
  };

  return (
    <div className={clsx(styles.sentencesOverlay, isSentenceActive && styles.show)}>
      <div
        className={clsx(
          styles.sentencesBox,
          sentenceAnimating === 'in' && styles.animateIn,
          sentenceAnimating === 'out' && styles.animateOut,
          isSentenceActive && !sentenceAnimating && styles.visible
        )}
      >
        <div className={styles.sentencesMeta}>
          <span className={styles.sentencesHint}>Start typing...</span>
          <div className={styles.sentencesTimer}>{sentenceTimeLeft}s</div>
        </div>
        <div className={styles.sentencesDurationBar}>
          <div
            className={styles.sentencesDurationFill}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
        <div className={styles.sentencesText}>{renderText()}</div>
      </div>
    </div>
  );
}
