'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';

export function useGameRecordSaver() {
  const savedSessionRef = useRef<number | null>(null);

  useEffect(() => {
    const unsub = useGameStore.subscribe((state, prev) => {
      // Fire when screen transitions to 'celebration'
      if (state.screen !== 'celebration' || prev.screen === 'celebration') return;
      // Don't double-save for the same session
      if (savedSessionRef.current === state.sessionId) return;
      savedSessionRef.current = state.sessionId;

      const {
        mode,
        score,
        startTime,
        totalCharactersTyped,
        correctCharacters,
        incorrectAttempts,
        missedWords,
        maxConsecutiveHits,
        mathQuestionsAnswered,
        totalMathSolveTime,
        journeyStats,
        wpmHistory,
        accuracyHistory,
      } = state;

      const durationMs = startTime ? Date.now() - startTime : 0;
      const avgWpm = wpmHistory.length > 0
        ? wpmHistory.reduce((a, b) => a + b, 0) / wpmHistory.length
        : 0;
      const avgAccuracy = accuracyHistory.length > 0
        ? accuracyHistory.reduce((a, b) => a + b, 0) / accuracyHistory.length
        : 0;

      const guestId = useAuthStore.getState().guestId;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (guestId) headers['x-guest-id'] = guestId;

      fetch('/api/games', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mode,
          score,
          durationMs,
          totalChars: totalCharactersTyped,
          correctChars: correctCharacters,
          incorrectAttempts,
          missedWords,
          maxCombo: maxConsecutiveHits,
          mathSolved: mathQuestionsAnswered,
          mathTotalTime: Math.round(totalMathSolveTime),
          journeyStats: mode === 'journey' ? journeyStats : null,
          wpm: Math.round(avgWpm),
          accuracy: Math.round(avgAccuracy * 100) / 100,
          isMultiplayer: false,
        }),
      }).catch(console.error);
    });

    return unsub;
  }, []);
}
