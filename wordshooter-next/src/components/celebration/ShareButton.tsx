'use client';

import { useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getRank } from '@/data/ranks';

export default function ShareButton() {
  const handleShare = useCallback(() => {
    const state = useGameStore.getState();
    const rank = getRank(state.score);
    const totalMinutes = state.startTime ? (Date.now() - state.startTime) / 60000 : 1;
    const wpm = Math.round((state.correctCharacters / 5) / totalMinutes);
    const total = state.correctCharacters + state.incorrectAttempts;
    const accuracy = total > 0 ? Math.round((state.correctCharacters / total) * 100) : 100;

    const text = `🚀 Word Shooter!\nScore: ${state.score} (${rank})\nWPM: ${wpm} | Accuracy: ${accuracy}%\nhttps://wordshooter.vercel.app`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
      });
    } else {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Copied to clipboard!');
    }
  }, []);

  return (
    <button
      onClick={handleShare}
      title="Share"
      className="celebration-top-btn"
      style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.2)',
        padding: 0,
        width: 32,
        height: 32,
        fontSize: 12,
        fontWeight: 'bold',
        borderRadius: 10,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18, lineHeight: 1 }}>
        share
      </span>
    </button>
  );
}
