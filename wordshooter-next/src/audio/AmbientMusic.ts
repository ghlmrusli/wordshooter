/**
 * AmbientMusic — procedural ambient music engine.
 *
 * Generates a layered, evolving soundscape entirely through the Web Audio API:
 *   - 5 warm pad layers (sine + triangle with LFO vibrato, pentatonic tuning)
 *   - Spacious convolution reverb (4-second synthesised impulse response)
 *   - Sub-bass pulse following an 8-step pattern at 75 BPM
 *   - Wandering pentatonic Am melody
 *   - High-frequency shimmer (noise through a 6 kHz highpass)
 *   - Soft hi-hat rhythm (8-step accent/ghost pattern)
 *
 * All parameters faithfully ported from the original monolithic index.html
 * (lines ~4222-4442).
 *
 * Usage:
 *   import { ambientMusic } from './AmbientMusic';
 *   ambientMusic.start();   // begin all layers
 *   ambientMusic.stop();    // fade-out and tear-down
 *   ambientMusic.setMute(true);  // toggle
 */

import { audioManager } from './AudioManager';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Master volume (20 %) */
const MASTER_VOL = 0.20;

/** Beats per minute */
const BPM = 75;

/** Duration of one beat in milliseconds */
const STEP = (60 / BPM) * 1000;

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

class AmbientMusic {
  private started = false;
  private muted = false;

  /** Nodes that need to be .stop()-ed on teardown (oscillators, buffer sources). */
  private nodes: AudioScheduledSourceNode[] = [];

  /** Timeout / interval IDs so we can cancel loops on stop(). */
  private timers: ReturnType<typeof setTimeout>[] = [];

  /** Dedicated gain used by the ambient music (child of audioManager master). */
  private masterGain: GainNode | null = null;

  /** Convolution reverb shared by several layers. */
  private reverbNode: ConvolverNode | null = null;

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  /**
   * Ensure the AudioContext, local master gain, and reverb node are ready.
   * Returns the AudioContext for convenience.
   */
  private ensureGraph(): AudioContext {
    const ctx = audioManager.getContext();

    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : MASTER_VOL;
      this.masterGain.connect(ctx.destination);
    }

    if (!this.reverbNode) {
      // Spacious reverb — 4-second synthesised impulse response
      this.reverbNode = ctx.createConvolver();
      const revLen = ctx.sampleRate * 4;
      const revBuf = ctx.createBuffer(2, revLen, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = revBuf.getChannelData(c);
        for (let i = 0; i < revLen; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / revLen, 1.8);
        }
      }
      this.reverbNode.buffer = revBuf;

      const revGain = ctx.createGain();
      revGain.gain.value = 0.5;
      this.reverbNode.connect(revGain);
      revGain.connect(this.masterGain);
    }

    return ctx;
  }

  /** Helper to store a timer ID for cleanup. */
  private scheduleTimer(fn: () => void, delay: number): void {
    const id = setTimeout(() => {
      fn();
    }, delay);
    this.timers.push(id);
  }

  // -----------------------------------------------------------------------
  // Audio layers
  // -----------------------------------------------------------------------

  /**
   * Slow pad layer — warm sine/triangle blend with gentle LFO vibrato.
   *
   * @param freq  Base frequency (Hz)
   * @param vol   Peak gain
   * @param lfoHz LFO rate (Hz)
   * @param fadeIn Fade-in duration (seconds)
   */
  private makePad(freq: number, vol: number, lfoHz: number, fadeIn: number): void {
    const ac = this.ensureGraph();

    const osc1 = ac.createOscillator();
    const osc2 = ac.createOscillator();
    const lfo = ac.createOscillator();
    const lfoG = ac.createGain();
    const g = ac.createGain();

    osc1.type = 'sine';
    osc1.frequency.value = freq;
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 1.002;
    lfo.type = 'sine';
    lfo.frequency.value = lfoHz;
    lfoG.gain.value = freq * 0.002;

    lfo.connect(lfoG);
    lfoG.connect(osc1.frequency);
    lfoG.connect(osc2.frequency);

    g.gain.setValueAtTime(0, ac.currentTime);
    g.gain.linearRampToValueAtTime(vol, ac.currentTime + fadeIn);

    osc1.connect(g);
    osc2.connect(g);
    g.connect(this.masterGain!);
    g.connect(this.reverbNode!);

    osc1.start();
    osc2.start();
    lfo.start();

    this.nodes.push(osc1, osc2, lfo);
  }

  /**
   * Steady sub-bass pulse — the groove heartbeat at 75 BPM.
   * Uses an 8-step pattern over a pentatonic bass scale.
   */
  private makeBassPulse(): void {
    const BASS = [110, 130.81, 146.83, 164.81, 196];
    const pattern = [0, 0, 2, 0, 1, 0, 3, 2];
    let step = 0;

    const beat = (): void => {
      if (!this.started) return;

      const freq = BASS[pattern[step % pattern.length]];
      const ac = this.ensureGraph();
      const osc = ac.createOscillator();
      const g = ac.createGain();
      const lp = ac.createBiquadFilter();

      lp.type = 'lowpass';
      lp.frequency.value = 280;
      osc.type = 'sine';
      osc.frequency.value = freq;

      const now = ac.currentTime;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.22, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc.connect(lp);
      lp.connect(g);
      g.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 0.6);

      step++;
      this.scheduleTimer(beat, STEP);
    };

    this.scheduleTimer(beat, 2000);
  }

  /**
   * Synth melody — slow, wandering Am pentatonic phrase player.
   * Rotates through four 6-note phrases with randomised inter-phrase gaps.
   */
  private makeMelody(): void {
    const MELODY = [440, 523.25, 587.33, 659.25, 783.99, 880];
    const PHRASES = [
      [0, 2, 4, 3, 1, 0],
      [5, 4, 2, 0, 1, 3],
      [2, 4, 5, 4, 2, 1],
      [0, 1, 3, 5, 3, 2],
    ];
    let phraseIdx = 0;
    let noteIdx = 0;
    const NOTE_LEN = 1100;

    const note = (): void => {
      if (!this.started) return;

      const phrase = PHRASES[phraseIdx];
      const freq = MELODY[phrase[noteIdx]];
      const ac = this.ensureGraph();
      const osc = ac.createOscillator();
      const g = ac.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const now = ac.currentTime;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.055, now + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

      osc.connect(g);
      g.connect(this.masterGain!);
      g.connect(this.reverbNode!);

      osc.start(now);
      osc.stop(now + 1.7);

      noteIdx++;
      if (noteIdx >= phrase.length) {
        noteIdx = 0;
        phraseIdx = (phraseIdx + 1) % PHRASES.length;
        this.scheduleTimer(note, NOTE_LEN + 800);
      } else {
        this.scheduleTimer(note, NOTE_LEN);
      }
    };

    this.scheduleTimer(note, 5000);
  }

  /**
   * Hi-frequency shimmer noise — like stars twinkling.
   * Loops a 4-second noise buffer through a 6 kHz highpass filter.
   */
  private makeSpaceTexture(): void {
    const ac = this.ensureGraph();
    const bufSize = ac.sampleRate * 4;
    const buf = ac.createBuffer(2, bufSize, ac.sampleRate);

    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < bufSize; i++) {
        d[i] = Math.random() * 2 - 1;
      }
    }

    const src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6000;

    const g = ac.createGain();
    g.gain.setValueAtTime(0, ac.currentTime);
    g.gain.linearRampToValueAtTime(0.06, ac.currentTime + 10);

    src.connect(hp);
    hp.connect(g);
    g.connect(this.reverbNode!);

    src.start();
    this.nodes.push(src);
  }

  /**
   * Soft rhythmic hi-hat — 8-step accent/ghost pattern.
   * Synthesises each hit from a short noise burst through an 8 kHz highpass.
   */
  private makeHihat(): void {
    const HAT_PAT = [1, 0, 1, 1, 0, 1, 0, 1];
    let step = 0;

    const tick = (): void => {
      if (!this.started) return;

      if (HAT_PAT[step % HAT_PAT.length]) {
        const ac = this.ensureGraph();
        const bufSize = Math.floor(ac.sampleRate * 0.04);
        const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
        const d = buf.getChannelData(0);

        for (let i = 0; i < bufSize; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 3);
        }

        const src = ac.createBufferSource();
        src.buffer = buf;

        const hp = ac.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 8000;

        const g = ac.createGain();
        g.gain.value = 0.055;

        src.connect(hp);
        hp.connect(g);
        g.connect(this.masterGain!);

        src.start();
        src.stop(ac.currentTime + 0.04);
      }

      step++;
      this.scheduleTimer(tick, STEP * 2);
    };

    this.scheduleTimer(tick, 3000);
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /** Initialise and start all audio layers. */
  start(): void {
    if (this.started) return;
    this.started = true;

    this.ensureGraph();

    // 5 pad layers — pentatonic frequencies with staggered fade-ins (6-14 s)
    this.makePad(110.00, 0.16, 0.07, 6.0);
    this.makePad(164.81, 0.12, 0.05, 8.0);
    this.makePad(220.00, 0.10, 0.09, 10.0);
    this.makePad(261.63, 0.07, 0.06, 12.0);
    this.makePad(329.63, 0.05, 0.04, 14.0);

    this.makeSpaceTexture();
    this.makeBassPulse();
    this.makeHihat();
    this.makeMelody();
  }

  /** Fade out (2 s) then disconnect and release all nodes. */
  stop(): void {
    if (!this.started) return;
    this.started = false;

    // Cancel all pending timers so loops don't fire after teardown
    this.timers.forEach((id) => clearTimeout(id));
    this.timers = [];

    const ctx = audioManager.hasContext() ? audioManager.getContext() : null;

    if (this.masterGain && ctx) {
      this.masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.0);
    }

    // Wait for the fade-out, then hard-stop everything
    setTimeout(() => {
      this.nodes.forEach((n) => {
        try {
          n.stop();
        } catch (_) {
          // Node may already be stopped
        }
      });
      this.nodes = [];

      if (this.masterGain) {
        try {
          this.masterGain.disconnect();
        } catch (_) {
          // already disconnected
        }
        this.masterGain = null;
      }

      if (this.reverbNode) {
        try {
          this.reverbNode.disconnect();
        } catch (_) {
          // already disconnected
        }
        this.reverbNode = null;
      }
    }, 2100);
  }

  /** Mute or unmute the ambient music (smooth 0.3 s ramp). */
  setMute(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain) {
      const ctx = audioManager.hasContext() ? audioManager.getContext() : null;
      const t = ctx ? ctx.currentTime : 0;
      this.masterGain.gain.linearRampToValueAtTime(
        muted ? 0 : MASTER_VOL,
        t + 0.3,
      );
    }
  }

  /** Whether the music is currently muted. */
  isMuted(): boolean {
    return this.muted;
  }

  /** Whether the music engine has been started and is running. */
  isPlaying(): boolean {
    return this.started;
  }

  /** Suspend the underlying AudioContext (e.g. on tab hide). */
  suspend(): void {
    audioManager.suspend();
  }

  /** Resume a suspended AudioContext (e.g. on tab show). */
  resume(): void {
    audioManager.resume();
  }
}

export const ambientMusic = new AmbientMusic();
