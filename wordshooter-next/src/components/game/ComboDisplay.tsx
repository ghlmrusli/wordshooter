'use client';

import { useGameStore } from '@/store/gameStore';

export default function ComboDisplay() {
  const consecutiveHits = useGameStore((s) => s.consecutiveHits);
  const comboMultiplier = useGameStore((s) => s.comboMultiplier);

  if (consecutiveHits < 3) return null;

  const color =
    comboMultiplier >= 3
      ? '#ff4500'
      : comboMultiplier >= 2
      ? '#ffd700'
      : '#4ecca3';

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '24px',
        fontWeight: 'bold',
        fontFamily: "'Press Start 2P', cursive",
        color,
        textShadow: `0 0 20px ${color}`,
        zIndex: 999,
        pointerEvents: 'none',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      {comboMultiplier}x COMBO!
    </div>
  );
}
