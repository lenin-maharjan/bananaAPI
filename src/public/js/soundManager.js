/**
 * @file soundManager.js
 * @description Event-Driven Synthesized Audio Engine using Web Audio API.
 * Subscribes to application audio events and synthesizes procedural sound effects
 * without requiring any external audio assets or network downloads.
 */

class SoundManager {
  constructor(bus) {
    this.bus = bus;
    this.audioCtx = null;
    this.isMuted = false;
    this.init();
  }

  init() {
    // Lazy audio context creation upon user interaction (browser policy)
    const unlockAudio = () => {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    // Listen for event-driven audio triggers
    this.bus.on(window.EVENTS.AUDIO_PLAY_EFFECT, (effectName) => {
      this.play(effectName);
    });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.bus.emit(window.EVENTS.TOAST_SHOW, {
      message: this.isMuted ? 'Sound Muted' : 'Sound Enabled',
      type: 'info'
    });
    return this.isMuted;
  }

  play(effectName) {
    if (this.isMuted) return;
    if (!this.audioCtx) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      } catch (e) {
        return;
      }
    }

    try {
      const now = this.audioCtx.currentTime;

      switch (effectName) {
        case 'click':
          this._playTone(600, 'sine', now, 0.05, 0.1);
          break;

        case 'correct':
          // Harmonious ascending arpeggio: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz)
          this._playTone(523.25, 'sine', now, 0.08, 0.15);
          this._playTone(659.25, 'sine', now + 0.08, 0.08, 0.18);
          this._playTone(783.99, 'triangle', now + 0.16, 0.20, 0.22);
          break;

        case 'incorrect':
          // Low dissonance buzz: F#3 (185Hz) -> Eb3 (155Hz)
          this._playTone(185, 'sawtooth', now, 0.12, 0.15);
          this._playTone(155, 'sawtooth', now + 0.10, 0.18, 0.15);
          break;

        case 'tick':
          this._playTone(880, 'sine', now, 0.03, 0.06);
          break;

        case 'gameover':
          // Dramatic cadence
          this._playTone(440, 'triangle', now, 0.15, 0.18);
          this._playTone(392, 'triangle', now + 0.15, 0.15, 0.18);
          this._playTone(349.23, 'triangle', now + 0.30, 0.20, 0.18);
          this._playTone(261.63, 'sine', now + 0.50, 0.40, 0.25);
          break;

        case 'streak':
          this._playTone(587.33, 'triangle', now, 0.1, 0.2);
          this._playTone(880, 'sine', now + 0.08, 0.25, 0.25);
          break;
      }
    } catch (e) {
      console.warn('[SoundManager] Audio play error:', e.message);
    }
  }

  _playTone(frequency, type, startTime, duration, maxGain = 0.2) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(maxGain, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }
}

if (typeof window !== 'undefined') {
  window.SoundManager = SoundManager;
}
