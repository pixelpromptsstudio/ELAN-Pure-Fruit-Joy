type MuteListener = (muted: boolean) => void;

/**
 * Muted-by-default Web Audio API crystal chime synthesizer.
 * Produces subtle acoustic feedback only after the visitor opts in.
 */
class LuxuryAudioEngine {
  private muted = true;
  private ctx: AudioContext | null = null;
  private listeners = new Set<MuteListener>();
  private lastHoverAt = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private playTone(freq: number, durationSec: number, gainPeak: number, delaySec = 0) {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  }

  playHover() {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - this.lastHoverAt < 90) return;
    this.lastHoverAt = now;
    this.playTone(784, 0.065, 0.014);
  }

  playClick() {
    this.playTone(587.33, 0.1, 0.024);
  }

  playChime() {
    this.playTone(523.25, 0.35, 0.025, 0);
    this.playTone(659.25, 0.4, 0.022, 0.08);
    this.playTone(783.99, 0.55, 0.02, 0.16);
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (!this.muted) {
      this.ensureContext();
      this.playTone(659.25, 0.18, 0.022);
    }
    this.listeners.forEach((fn) => fn(this.muted));
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  subscribe(listener: MuteListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const luxuryAudio = new LuxuryAudioEngine();
