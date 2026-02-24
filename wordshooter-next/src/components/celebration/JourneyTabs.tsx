'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import styles from '@/styles/celebration.module.css';
import clsx from 'clsx';

type TabKey = 'words' | 'sentences' | 'math' | 'letters';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'words', label: 'Word' },
  { key: 'sentences', label: 'Sentence' },
  { key: 'math', label: 'Math' },
  { key: 'letters', label: 'Letter' },
];

export default function JourneyTabs() {
  const [activeTab, setActiveTab] = useState<TabKey>('words');
  const journeyStats = useGameStore((s) => s.journeyStats);
  const correctCharacters = useGameStore((s) => s.correctCharacters);
  const startTime = useGameStore((s) => s.startTime);

  const totalMinutes = startTime ? (Date.now() - startTime) / 60000 : 1;

  // Calculate sentence WPM
  const sentenceWpm = totalMinutes > 0
    ? Math.round((journeyStats.sentences.correctChars / 5) / totalMinutes)
    : 0;

  // Calculate letter per second
  const totalSeconds = startTime ? (Date.now() - startTime) / 1000 : 1;
  const lps = totalSeconds > 0
    ? (journeyStats.letters.hit / totalSeconds).toFixed(1)
    : '0';

  return (
    <div className={styles.journeyTabs} style={{ display: 'flex' }}>
      <div className={styles.journeyTabNav}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={clsx(styles.journeyTabBtn, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'words' && (
        <div className={clsx(styles.journeyTabContent, styles.active)}>
          <div className={styles.journeyStatBlock}>
            <div className={styles.journeyStatLabel}>Completed</div>
            <div className={styles.journeyStatValue}>{journeyStats.words.wordsHit}</div>
          </div>
          <div className={styles.journeyStatBlock}>
            <div className={styles.journeyStatLabel}>Missed</div>
            <div className={styles.journeyStatValue}>{journeyStats.words.wordsMissed}</div>
          </div>
          <div className={clsx(styles.journeyStatBlock, styles.fullWidth)}>
            <div className={styles.journeyStatLabel}>Incorrect attempts</div>
            <div className={styles.journeyStatValue}>{journeyStats.words.incorrectKeys}</div>
          </div>
        </div>
      )}

      {activeTab === 'sentences' && (
        <div className={clsx(styles.journeyTabContent, styles.active)}>
          <div className={styles.journeyStatBlock}>
            <div className={styles.journeyStatLabel}>Completed</div>
            <div className={styles.journeyStatValue}>{journeyStats.sentences.completed}</div>
          </div>
          <div className={styles.journeyStatBlock}>
            <div className={styles.journeyStatLabel}>Missed</div>
            <div className={styles.journeyStatValue}>{journeyStats.sentences.skipped}</div>
          </div>
          <div className={clsx(styles.journeyStatBlock, styles.fullWidth)}>
            <div className={styles.journeyStatLabel}>Word per minute</div>
            <div className={styles.journeyStatValue}>{sentenceWpm}</div>
          </div>
        </div>
      )}

      {activeTab === 'math' && (
        <div className={clsx(styles.journeyTabContent, styles.active)}>
          <div className={styles.journeyStatBlock}>
            <div className={styles.journeyStatLabel}>Completed</div>
            <div className={styles.journeyStatValue}>{journeyStats.math.solved}</div>
          </div>
          <div className={styles.journeyStatBlock}>
            <div className={styles.journeyStatLabel}>Missed</div>
            <div className={styles.journeyStatValue}>{journeyStats.math.missed}</div>
          </div>
          <div className={clsx(styles.journeyStatBlock, styles.fullWidth)}>
            <div className={styles.journeyStatLabel}>Solved under 1s</div>
            <div className={styles.journeyStatValue}>{journeyStats.math.fastSolves}</div>
          </div>
        </div>
      )}

      {activeTab === 'letters' && (
        <div className={clsx(styles.journeyTabContent, styles.active)}>
          <div className={styles.journeyStatBlock}>
            <div className={styles.journeyStatLabel}>Completed</div>
            <div className={styles.journeyStatValue}>{journeyStats.letters.hit}</div>
          </div>
          <div className={styles.journeyStatBlock}>
            <div className={styles.journeyStatLabel}>Missed</div>
            <div className={styles.journeyStatValue}>{journeyStats.letters.missed}</div>
          </div>
          <div className={clsx(styles.journeyStatBlock, styles.fullWidth)}>
            <div className={styles.journeyStatLabel}>Letter per second</div>
            <div className={styles.journeyStatValue}>{lps}</div>
          </div>
        </div>
      )}
    </div>
  );
}
