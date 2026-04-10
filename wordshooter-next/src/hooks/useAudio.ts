'use client';

import { useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { ambientMusic } from '@/audio/AmbientMusic';
import { audioManager } from '@/audio/AudioManager';

export function useAudio() {
  const isMuted = useGameStore((state) => state.isMuted);

  const startMusic = useCallback(() => {
    audioManager.resume();
    ambientMusic.start();
  }, []);

  const stopMusic = useCallback(() => {
    ambientMusic.stop();
  }, []);

  const toggleMute = useCallback(() => {
    const newMuted = !useGameStore.getState().isMuted;
    useGameStore.setState({ isMuted: newMuted });
    ambientMusic.setMute(newMuted);
  }, []);

  return { startMusic, stopMusic, toggleMute, isMuted };
}
