'use client';

import { useRef } from 'react';
import { use3DCardEffect } from '@/hooks/use3DCardEffect';
import CelebrationHeader from './CelebrationHeader';
import CelebrationStats from './CelebrationStats';
import JourneyTabs from './JourneyTabs';
import PerformanceGraph from './PerformanceGraph';
import SpeedometerCanvas from './SpeedometerCanvas';
import { useGameStore } from '@/store/gameStore';
import styles from '@/styles/celebration.module.css';
import { useState } from 'react';

export default function CelebrationCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  use3DCardEffect(cardRef);

  const mode = useGameStore((s) => s.mode);
  const [showGraph, setShowGraph] = useState(true);

  return (
    <div className={styles.hover3dWrapper}>
      <div ref={cardRef} className={styles.hover3d}>
        <div className={styles.celebrationCard}>
          <CelebrationHeader />
          <div className={styles.celebrationBody}>
            {mode === 'journey' ? <JourneyTabs /> : <CelebrationStats />}

            <div className={styles.graphViewToggle}>
              <button
                className={styles.btnViewToggle}
                onClick={() => setShowGraph(!showGraph)}
              >
                {showGraph ? 'Speedometer' : 'Graph'}
              </button>
            </div>

            {showGraph ? <PerformanceGraph /> : <SpeedometerCanvas />}

            <div className={styles.scoreboardLink}>
              <span
                className={styles.playAgainLink}
                onClick={() => {
                  useGameStore.getState().resetGame();
                  useGameStore.setState({ screen: 'start' });
                }}
              >
                Play Again
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
