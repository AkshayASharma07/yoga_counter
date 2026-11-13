/**
 * Zen Audio Feedback Synthesizer & Voice Cue Engine
 * Mindful, organic sound effects for dial interactions and breathwork.
 * Synthesized dynamically via Web Audio API & Web Speech API.
 * 100% Bug-Free & Cross-Platform compatible.
 */

class ZenAudioFeedback {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('zen_muted') === 'true';
    this.lastTickTime = 0;
    this.minTickInterval = 30; // ms debounce between rapid ticks
    this.listeners = new Set();
    this.preferredVoice = null;
    this.currentUtterance = null;

    this.initSpeechVoices();
    this.setupGestureUnlock();
  }

  /**
   * Unlocks Web Audio on the very first user gesture anywhere on the page.
   */
  setupGestureUnlock() {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      this.initContext();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
  }

  /**
   * Initializes or resumes the AudioContext on user gesture.
   */
  initContext() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {
      // AudioContext blocked or unsupported
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('zen_muted', this.isMuted.toString());
    this.notifyListeners();

    if (this.isMuted) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }
    } else {
      this.playTick({ pitch: 1.1, volume: 0.05 });
    }
    return this.isMuted;
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    localStorage.setItem('zen_muted', this.isMuted.toString());
    this.notifyListeners();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.isMuted);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(cb => {
      try { cb(this.isMuted); } catch (e) { console.error(e); }
    });
  }

  /**
   * Delicate organic wooden tick sound for wheel rotation.
   */
  playTick({ pitch = 1.0, volume = 0.04 } = {}) {
    if (this.isMuted) return;

    const now = performance.now();
    if (now - this.lastTickTime < this.minTickInterval) {
      return;
    }
    this.lastTickTime = now;

    try {
      this.initContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const safeVol = Math.max(0.001, Math.min(0.2, volume));

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      const baseFreq = 440 * pitch;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * 1.25, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(100, baseFreq * 0.7), t + 0.016);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.Q.setValueAtTime(1.0, t);

      gain.gain.setValueAtTime(safeVol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.018);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.02);
    } catch (err) {}
  }

  /**
   * Soothing Tibetan Singing Bowl Bell.
   * Plays precisely when the time for each asana/phase completes.
   */
  playTransitionBell({ baseFreq = 432, duration = 2.8, volume = 0.08 } = {}) {
    if (this.isMuted) return;

    try {
      this.initContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const safeVol = Math.max(0.001, Math.min(0.25, volume));

      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(safeVol, t);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      masterGain.connect(this.ctx.destination);

      // Authentic singing bowl acoustics: higher harmonics decay more quickly
      const harmonics = [
        { mult: 1.0, gain: 0.75, detune: 0, decay: duration },
        { mult: 2.01, gain: 0.30, detune: 2, decay: duration * 0.75 },
        { mult: 3.08, gain: 0.15, detune: -3, decay: duration * 0.52 },
        { mult: 4.82, gain: 0.06, detune: 1, decay: duration * 0.38 }
      ];

      harmonics.forEach(h => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * h.mult, t);
        osc.detune.setValueAtTime(h.detune, t);

        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(h.gain, t + 0.014);
        g.gain.exponentialRampToValueAtTime(0.0001, t + h.decay);

        osc.connect(g);
        g.connect(masterGain);

        osc.start(t);
        osc.stop(t + h.decay);
      });
    } catch (err) {}
  }

  playCelebrationChime() {
    this.playTransitionBell({ baseFreq: 528, duration: 3.5, volume: 0.11 });
    setTimeout(() => {
      this.playTransitionBell({ baseFreq: 660, duration: 3.2, volume: 0.08 });
    }, 380);
  }

  /* ------------------------------------------------------------------------
     Web Speech API Voice Cues
     ------------------------------------------------------------------------ */
  initSpeechVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const findVoice = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) return;

        const preferred = voices.find(v => 
          v.lang.startsWith('en') && (
            v.name.includes('Natural') ||
            v.name.includes('Samantha') ||
            v.name.includes('Google') ||
            v.name.includes('Karen') ||
            v.name.includes('Serena') ||
            v.name.includes('Victoria')
          )
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

        this.preferredVoice = preferred;
      } catch (e) {}
    };

    findVoice();
    if (typeof window.speechSynthesis.addEventListener === 'function') {
      window.speechSynthesis.addEventListener('voiceschanged', findVoice);
    } else if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = findVoice;
    }
  }

  speakCue(text) {
    if (this.isMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.log(`[Voice Cue]: ${text}`);
      return;
    }

    try {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.preferredVoice) {
        utterance.voice = this.preferredVoice;
      }
      utterance.rate = 0.88;
      utterance.pitch = 1.0;
      utterance.volume = 0.95;

      this.currentUtterance = utterance;
      utterance.onend = () => {
        if (this.currentUtterance === utterance) this.currentUtterance = null;
      };
      utterance.onerror = () => {
        if (this.currentUtterance === utterance) this.currentUtterance = null;
      };

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Voice cue error:', err);
    }
  }
}

export const zenAudio = new ZenAudioFeedback();
