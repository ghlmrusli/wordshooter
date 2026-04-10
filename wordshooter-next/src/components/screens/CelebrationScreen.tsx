'use client';

import { useGameStore } from '@/store/gameStore';
import { useAudio } from '@/hooks/useAudio';
import CelebrationCard from '@/components/celebration/CelebrationCard';
import ShareButton from '@/components/celebration/ShareButton';
import styles from '@/styles/celebration.module.css';

export default function CelebrationScreen() {
  const { stopMusic } = useAudio();

  const handleRestart = () => {
    useGameStore.getState().resetGame();
    useGameStore.setState({ screen: 'start' });
  };

  const handleHome = () => {
    useGameStore.getState().resetGame();
    useGameStore.setState({ screen: 'start' });
  };

  return (
    <div className={styles.celebrationScreen}>
      <div className={styles.celebrationTopBar}>
        <div className={styles.celebrationTitle}>Word Shooter!</div>
        <div className={styles.celebrationButtons}>
          <button className={styles.celebrationTopBtn} onClick={handleRestart} title="Restart">
            <span className="material-symbols-outlined">refresh</span>
          </button>
          <button className={styles.celebrationTopBtn} onClick={handleHome} title="Home">
            <span className="material-symbols-outlined">home</span>
          </button>
          <button
            className={styles.celebrationTopBtn}
            onClick={() => useGameStore.setState({ screen: 'leaderboard' })}
            title="Leaderboard"
          >
            <span className="material-symbols-outlined">leaderboard</span>
          </button>
          <ShareButton />
        </div>
      </div>

      <CelebrationCard />
    </div>
  );
}
