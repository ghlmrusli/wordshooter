'use client';

import { useGameStore } from '@/store/gameStore';

export default function PhaseTransitionOverlay() {
  const phaseTransition = useGameStore((s) => s.phaseTransition);

  if (!phaseTransition) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        animation: 'fadeIn 0.5s ease-in',
      }}
    >
      <div
        style={{
          fontSize: '14px',
          fontFamily: "'Press Start 2P', cursive",
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '12px',
        }}
      >
        PHASE {phaseTransition.phase}
      </div>
      <div
        style={{
          fontSize: '20px',
          fontFamily: "'Press Start 2P', cursive",
          color: phaseTransition.color,
          textShadow: `0 0 20px ${phaseTransition.color}`,
        }}
      >
        {phaseTransition.name}
      </div>
    </div>
  );
}
