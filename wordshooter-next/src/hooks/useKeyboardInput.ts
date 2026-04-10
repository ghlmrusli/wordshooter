'use client';

import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { handleKeyPress } from '@/engine/InputHandler';

export function useKeyboardInput() {
  const handleKey = useCallback((keyValue: string) => {
    const state = useGameStore.getState();
    if (state.screen !== 'game') return;
    if (state.isGameOver) return;

    // Spacebar toggles pause, UNLESS we're in sentence mode (spaces are typed)
    if (keyValue === ' ' && !state.isSentenceActive) {
      useGameStore.getState().togglePause();
      return;
    }

    if (state.isPaused) return;

    handleKeyPress(keyValue);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Prevent default for game keys (but not in sentence mode for space)
      if (e.key === ' ') e.preventDefault();
      if (e.key === 'Escape') {
        useGameStore.getState().togglePause();
        return;
      }

      if (e.key === 'Backspace') {
        handleKey('Backspace');
      } else if (e.key.length === 1) {
        handleKey(e.key);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKey]);

  return { handleKey };
}
