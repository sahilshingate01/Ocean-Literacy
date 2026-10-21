/**
 * Ocean Soundscape Audio Synthesizer
 * Procedurally generates gentle oceanic ambient audio using the Web Audio API.
 * Requires no external audio files.
 */

const Soundscape = {
  audioCtx: null,
  isPlaying: false,
  gainNode: null,

  toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  },

  start() {
    if (this.isPlaying) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.audioCtx = new AudioContext();

      // Master Volume Gain
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(0.01, this.audioCtx.currentTime);
      this.gainNode.gain.exponentialRampToValueAtTime(0.25, this.audioCtx.currentTime + 3);
      this.gainNode.connect(this.audioCtx.destination);

      // 1. Deep Sub-Surface Oceanic Drone (Oscillator 1 & 2)
      const osc1 = this.audioCtx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(55, this.audioCtx.currentTime); // Low A

      const osc2 = this.audioCtx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(82.4, this.audioCtx.currentTime); // Low E

      // Filter for deep warmth
      const biquad = this.audioCtx.createBiquadFilter();
      biquad.type = 'lowpass';
      biquad.frequency.setValueAtTime(140, this.audioCtx.currentTime);

      osc1.connect(biquad);
      osc2.connect(biquad);
      biquad.connect(this.gainNode);

      osc1.start();
      osc2.start();

      // 2. Slow Tidal Swell LFO (Low Frequency Oscillator)
      const lfo = this.audioCtx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, this.audioCtx.currentTime); // ~8 second ocean wave cycle
      const lfoGain = this.audioCtx.createGain();
      lfoGain.gain.setValueAtTime(40, this.audioCtx.currentTime);

      lfo.connect(biquad.frequency);
      lfo.start();

      this.isPlaying = true;
    } catch (err) {
      console.warn('Web Audio initialization error:', err);
    }
  },

  stop() {
    if (!this.isPlaying || !this.audioCtx) return;
    try {
      if (this.gainNode) {
        this.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 1);
        setTimeout(() => {
          if (this.audioCtx) {
            this.audioCtx.close();
            this.audioCtx = null;
          }
          this.isPlaying = false;
        }, 1000);
      } else {
        this.audioCtx.close();
        this.audioCtx = null;
        this.isPlaying = false;
      }
    } catch (err) {
      this.isPlaying = false;
    }
  }
};
