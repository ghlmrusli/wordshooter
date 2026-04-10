/**
 * SoundEffects — one-shot procedural sound effects for gameplay events.
 *
 * Each function creates its own short-lived oscillator/gain graph that
 * auto-disconnects when the sound ends.  They all share the AudioContext
 * owned by `audioManager`.
 *
 * Ported from the original monolithic index.html.
 */

import { audioManager } from './AudioManager';

/**
 * Shoot sound — 200 Hz square wave, 0.1 s duration.
 * Gain envelope: 0.3 -> 0.01 (exponential ramp).
 */
export function playShootSound(): void {
  const ctx = audioManager.getContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = 200;
  oscillator.type = 'square';

  const now = ctx.currentTime;
  gainNode.gain.setValueAtTime(0.3, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

  oscillator.start(now);
  oscillator.stop(now + 0.1);
}

/**
 * Error sound — 150 Hz square wave, 0.15 s duration.
 * Gain envelope: 0.3 -> 0.01 (exponential ramp).
 */
export function playErrorSound(): void {
  const ctx = audioManager.getContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Lower frequency for error sound
  oscillator.frequency.value = 150;
  oscillator.type = 'square';

  const now = ctx.currentTime;
  gainNode.gain.setValueAtTime(0.3, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

  oscillator.start(now);
  oscillator.stop(now + 0.15);
}

/**
 * Success sound — cheerful ascending C-E-G arpeggio (C5, E5, G5).
 * Each note is a short sine-wave burst with staggered start times.
 */
/**
 * Lose sound — plays the "fahhhhh" mp3 clip.
 */
export function playLoseSound(): void {
  const audio = new Audio('/fahhhhh.mp3');
  audio.volume = 0.5;
  audio.play().catch(() => {/* user hasn't interacted yet */});
}

export function playSuccessSound(): void {
  const ctx = audioManager.getContext();

  const notes: { freq: number; time: number; duration: number }[] = [
    { freq: 523.25, time: 0, duration: 0.08 },     // C5
    { freq: 659.25, time: 0.06, duration: 0.08 },  // E5
    { freq: 783.99, time: 0.12, duration: 0.12 },  // G5
  ];

  notes.forEach((note) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = note.freq;
    oscillator.type = 'sine';

    const startTime = ctx.currentTime + note.time;
    gainNode.gain.setValueAtTime(0.15, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + note.duration);
  });
}
