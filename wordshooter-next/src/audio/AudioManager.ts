/**
 * AudioManager — singleton that owns the shared Web Audio API AudioContext.
 *
 * The AudioContext is created lazily on the first call to `getContext()` because
 * browsers require a user-gesture before an AudioContext may start.  Every other
 * audio module (SoundEffects, AmbientMusic) routes through this manager so there
 * is a single master gain node controlling overall volume.
 */

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  /**
   * Lazily create (or return the existing) AudioContext.
   * Must be called inside a user-gesture handler the first time.
   */
  getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  /** Return the master GainNode (creates context if needed). */
  getMasterGain(): GainNode {
    if (!this.masterGain) {
      this.getContext(); // side-effect: creates masterGain
    }
    return this.masterGain!;
  }

  /** Resume a suspended context (e.g. after page visibility change). */
  async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  /** Suspend the context (e.g. when the tab is hidden). */
  async suspend(): Promise<void> {
    if (this.ctx && this.ctx.state === 'running') {
      await this.ctx.suspend();
    }
  }

  /** Close the context and release all resources. */
  close(): void {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
      this.masterGain = null;
    }
  }

  /** Whether a context has been created at all. */
  hasContext(): boolean {
    return this.ctx !== null;
  }
}

export const audioManager = new AudioManager();
