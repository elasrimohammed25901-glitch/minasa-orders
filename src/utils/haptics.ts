// Haptic Feedback Simulation for Mobile & Field Work Experience
// Combines Web Vibration API with an acoustic tactile click synthesizer (via Web Audio API)
// ensuring tactile response works across all devices (Android, iOS Safari, desktop)

export type HapticType = 'light' | 'selection' | 'medium' | 'heavy' | 'success' | 'warning';

class HapticManager {
  private audioCtx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    try {
      const stored = localStorage.getItem('injaz_haptic_feedback');
      if (stored !== null) {
        this.enabled = stored === 'true';
      }
    } catch {
      this.enabled = true;
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    try {
      localStorage.setItem('injaz_haptic_feedback', String(val));
    } catch {
      // ignore
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    if (this.enabled) {
      this.trigger('success');
    }
    return this.enabled;
  }

  private getAudioContext(): AudioContext | null {
    try {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  // Synthesize a very subtle, crisp mechanical switch/tactile click (15-20ms)
  private playAcousticClick(pitch: number = 140, duration: number = 0.025, volume: number = 0.07) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + duration);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio might fail if user hasn't interacted yet
    }
  }

  /**
   * Main trigger function called on button clicks
   */
  public trigger(type: HapticType = 'light') {
    if (!this.enabled) return;

    // 1. Hardware Vibration (Android / Supported Browsers)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        switch (type) {
          case 'light':
            navigator.vibrate(12);
            break;
          case 'selection':
            navigator.vibrate(16);
            break;
          case 'medium':
            navigator.vibrate(28);
            break;
          case 'heavy':
            navigator.vibrate(45);
            break;
          case 'success':
            navigator.vibrate([20, 35, 25]);
            break;
          case 'warning':
            navigator.vibrate([35, 45, 35]);
            break;
        }
      } catch {
        // Ignore vibration errors
      }
    }

    // 2. Simulated Acoustic Tactile Feedback (Tactile micro-tick for field responsiveness & iOS)
    try {
      switch (type) {
        case 'light':
          this.playAcousticClick(150, 0.015, 0.05);
          break;
        case 'selection':
          this.playAcousticClick(180, 0.018, 0.06);
          break;
        case 'medium':
          this.playAcousticClick(220, 0.025, 0.08);
          break;
        case 'heavy':
          this.playAcousticClick(120, 0.035, 0.1);
          break;
        case 'success':
          this.playAcousticClick(320, 0.025, 0.07);
          setTimeout(() => this.playAcousticClick(480, 0.03, 0.09), 40);
          break;
        case 'warning':
          this.playAcousticClick(280, 0.03, 0.08);
          setTimeout(() => this.playAcousticClick(180, 0.04, 0.08), 50);
          break;
      }
    } catch {
      // Audio context might be restricted
    }
  }
}

export const haptics = new HapticManager();

export const triggerHaptic = (type: HapticType = 'light') => {
  haptics.trigger(type);
};
