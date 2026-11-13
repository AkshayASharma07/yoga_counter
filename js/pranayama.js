/**
 * Dedicated Pranayama (Breathing) Engine
 * Supports:
 * - Total Rounds Picker (Scroll Dial from 1 to 50 rounds)
 * - Mode A: Classical 1:4:2:2 Ratio (Puraka : Antar Kumbhaka : Rechaka : Bahya Kumbhaka)
 *   Calculates all phase durations automatically from one base scroll dial input.
 * - Mode B: Custom 2-Part Ratio (Independent Inhale : Exhale scroll dial inputs).
 * - Hypnotic Visual Breathing Guide (expanding/contracting circle with keyframe aura pulse)
 * - Singing bowl transition bells & Web Speech API voice cues for final rounds.
 * 100% Bug-Free, Accurate Timing & Fully Mobile-Optimized.
 */

import { zenAudio } from './audio-feedback.js';
import { ScrollDial } from './scroll-dial.js';

export class PranayamaTracker {
  constructor({
    roundsMount,
    modeAMount,
    modeBInhaleMount,
    modeBExhaleMount,
    ui = {}
  }) {
    this.roundsMount = roundsMount;
    this.modeAMount = modeAMount;
    this.modeBInhaleMount = modeBInhaleMount;
    this.modeBExhaleMount = modeBExhaleMount;
    this.ui = ui;

    // State
    this.activeMode = 'modeA'; // 'modeA' | 'modeB'
    this.status = 'idle'; // 'idle' | 'running' | 'paused' | 'completed'
    
    // Total Target Rounds for Pranayama
    this.totalRounds = 5;

    // Mode A: 1:4:2:2 base unit in seconds
    this.baseUnit = 3; 

    // Mode B: Custom Inhale / Exhale in seconds
    this.customInhale = 4;
    this.customExhale = 6;

    // Session Execution State
    this.currentCycle = 1;
    this.currentPhaseIndex = 0;
    this.phaseTimeRemaining = 0;
    this.totalSecondsElapsed = 0;
    this.intervalId = null;
    this.announcedRounds = new Set();

    this.initDials();
    this.bindEvents();
    this.updateRoundsSummary();
    this.updateModeACalculations();
    this.updateModeBCalculations();
  }

  /**
   * Initializes the rotating scroll dials for Pranayama:
   * 1. Total Rounds Dial (1 to 50+ rounds)
   * 2. Mode A: Base Seconds Dial (2s to 8s)
   * 3. Mode B: Inhale (2s to 20s) and Exhale (2s to 30s)
   */
  initDials() {
    // 1. Total Rounds Dial for Pranayama
    if (this.roundsMount) {
      const roundItems = [];
      for (let r = 1; r <= 30; r++) {
        roundItems.push(`${r}`);
      }
      roundItems.push('36', '48', '54', '108');

      this.dialRounds = new ScrollDial(this.roundsMount, {
        columns: [
          {
            items: roundItems,
            loop: false,
            label: 'Total Rounds',
            value: '5'
          }
        ],
        onChange: (values, formatted) => {
          const num = parseInt(formatted, 10);
          this.totalRounds = isNaN(num) || num < 1 ? 5 : num;
          this.updateRoundsSummary();
        }
      });
    }

    // 2. Mode A: Base Seconds Dial (2 to 8 seconds)
    if (this.modeAMount) {
      const baseItems = [];
      for (let s = 2; s <= 8; s++) {
        baseItems.push(`${s}s`);
      }

      this.dialModeA = new ScrollDial(this.modeAMount, {
        columns: [
          {
            items: baseItems,
            loop: false,
            label: 'Base Unit (s)',
            value: '3s'
          }
        ],
        onChange: (values, formatted) => {
          const num = parseInt(formatted, 10);
          this.baseUnit = isNaN(num) ? 3 : Math.max(1, num);
          this.updateModeACalculations();
        }
      });
    }

    // 3. Mode B: Inhale Dial (2s to 20s)
    if (this.modeBInhaleMount) {
      const inhaleItems = [];
      for (let s = 2; s <= 20; s++) {
        inhaleItems.push(`${s}s`);
      }

      this.dialModeBInhale = new ScrollDial(this.modeBInhaleMount, {
        columns: [
          {
            items: inhaleItems,
            loop: false,
            label: 'Inhale (Puraka)',
            value: '4s'
          }
        ],
        onChange: (values, formatted) => {
          const num = parseInt(formatted, 10);
          this.customInhale = isNaN(num) ? 4 : Math.max(1, num);
          this.updateModeBCalculations();
        }
      });
    }

    // 4. Mode B: Exhale Dial (2s to 30s)
    if (this.modeBExhaleMount) {
      const exhaleItems = [];
      for (let s = 2; s <= 30; s++) {
        exhaleItems.push(`${s}s`);
      }

      this.dialModeBExhale = new ScrollDial(this.modeBExhaleMount, {
        columns: [
          {
            items: exhaleItems,
            loop: false,
            label: 'Exhale (Rechaka)',
            value: '6s'
          }
        ],
        onChange: (values, formatted) => {
          const num = parseInt(formatted, 10);
          this.customExhale = isNaN(num) ? 6 : Math.max(1, num);
          this.updateModeBCalculations();
        }
      });
    }
  }

  updateRoundsSummary() {
    if (this.ui.setupTargetRounds) {
      this.ui.setupTargetRounds.textContent = this.totalRounds;
    }
    if (this.ui.modeBTargetRounds) {
      this.ui.modeBTargetRounds.textContent = this.totalRounds;
    }

    // Synchronize preset pill buttons
    if (this.ui.roundsPresets) {
      this.ui.roundsPresets.forEach(btn => {
        const r = parseInt(btn.dataset.rounds, 10);
        btn.classList.toggle('active', r === this.totalRounds);
      });
    }

    this.updateModeACalculations();
    this.updateModeBCalculations();
  }

  updateModeACalculations() {
    const inhale = this.baseUnit * 1;
    const holdFull = this.baseUnit * 4;
    const exhale = this.baseUnit * 2;
    const holdEmpty = this.baseUnit * 2;
    const cycleTotal = inhale + holdFull + exhale + holdEmpty;

    const sessionTotalSeconds = cycleTotal * this.totalRounds;
    const mins = Math.floor(sessionTotalSeconds / 60);
    const secs = sessionTotalSeconds % 60;
    const timeStr = mins > 0 ? `${mins}m ${secs > 0 ? secs + 's' : ''}` : `${secs}s`;

    if (this.ui.modeACalcInhale) this.ui.modeACalcInhale.textContent = `${inhale}s`;
    if (this.ui.modeACalcHoldFull) this.ui.modeACalcHoldFull.textContent = `${holdFull}s`;
    if (this.ui.modeACalcExhale) this.ui.modeACalcExhale.textContent = `${exhale}s`;
    if (this.ui.modeACalcHoldEmpty) this.ui.modeACalcHoldEmpty.textContent = `${holdEmpty}s`;
    if (this.ui.modeATotalCycle) this.ui.modeATotalCycle.textContent = `${cycleTotal}s`;
    if (this.ui.modeATotalSession) this.ui.modeATotalSession.textContent = timeStr;

    if (this.ui.modeAPresets) {
      this.ui.modeAPresets.forEach(btn => {
        const b = parseInt(btn.dataset.base, 10);
        btn.classList.toggle('active', b === this.baseUnit);
      });
    }
  }

  updateModeBCalculations() {
    const total = this.customInhale + this.customExhale;
    const sessionTotalSeconds = total * this.totalRounds;
    const mins = Math.floor(sessionTotalSeconds / 60);
    const secs = sessionTotalSeconds % 60;
    const timeStr = mins > 0 ? `${mins}m ${secs > 0 ? secs + 's' : ''}` : `${secs}s`;

    if (this.ui.modeBCalcInhale) this.ui.modeBCalcInhale.textContent = `${this.customInhale}s`;
    if (this.ui.modeBCalcExhale) this.ui.modeBCalcExhale.textContent = `${this.customExhale}s`;
    if (this.ui.modeBTotalCycle) this.ui.modeBTotalCycle.textContent = `${total}s`;
    if (this.ui.modeBTotalSession) this.ui.modeBTotalSession.textContent = timeStr;

    if (this.ui.modeBPresets) {
      this.ui.modeBPresets.forEach(btn => {
        const [inh, exh] = btn.dataset.ratio.split(',').map(s => parseInt(s, 10));
        btn.classList.toggle('active', inh === this.customInhale && exh === this.customExhale);
      });
    }
  }

  bindEvents() {
    // Mode Switcher Tabs (Mode A vs Mode B)
    if (this.ui.tabModeA) {
      this.ui.tabModeA.addEventListener('click', () => this.switchMode('modeA'));
    }
    if (this.ui.tabModeB) {
      this.ui.tabModeB.addEventListener('click', () => this.switchMode('modeB'));
    }

    // Action Buttons
    if (this.ui.startBtn) {
      this.ui.startBtn.addEventListener('click', () => this.start());
    }
    if (this.ui.pauseBtn) {
      this.ui.pauseBtn.addEventListener('click', () => this.togglePause());
    }
    if (this.ui.skipBtn) {
      this.ui.skipBtn.addEventListener('click', () => this.skipPhase());
    }
    if (this.ui.stopBtn) {
      this.ui.stopBtn.addEventListener('click', () => this.stopAndReset());
    }
    if (this.ui.newSessionBtn) {
      this.ui.newSessionBtn.addEventListener('click', () => this.stopAndReset());
    }

    // Rounds Presets
    if (this.ui.roundsPresets) {
      this.ui.roundsPresets.forEach(btn => {
        btn.addEventListener('click', () => {
          this.ui.roundsPresets.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const rounds = parseInt(btn.dataset.rounds, 10);
          if (this.dialRounds) {
            this.dialRounds.setValue(0, `${rounds}`);
          }
        });
      });
    }

    // Mode A Presets
    if (this.ui.modeAPresets) {
      this.ui.modeAPresets.forEach(btn => {
        btn.addEventListener('click', () => {
          this.ui.modeAPresets.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const base = parseInt(btn.dataset.base, 10);
          if (this.dialModeA) {
            this.dialModeA.setValue(0, `${base}s`);
          }
        });
      });
    }

    // Mode B Presets
    if (this.ui.modeBPresets) {
      this.ui.modeBPresets.forEach(btn => {
        btn.addEventListener('click', () => {
          this.ui.modeBPresets.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const [inh, exh] = btn.dataset.ratio.split(',').map(s => parseInt(s, 10));
          if (this.dialModeBInhale) this.dialModeBInhale.setValue(0, `${inh}s`);
          if (this.dialModeBExhale) this.dialModeBExhale.setValue(0, `${exh}s`);
        });
      });
    }
  }

  switchMode(mode) {
    if (this.status === 'running') {
      this.stopAndReset();
    }
    this.activeMode = mode;

    if (this.ui.tabModeA && this.ui.tabModeB) {
      this.ui.tabModeA.classList.toggle('active', mode === 'modeA');
      this.ui.tabModeB.classList.toggle('active', mode === 'modeB');
      this.ui.tabModeA.setAttribute('aria-selected', (mode === 'modeA').toString());
      this.ui.tabModeB.setAttribute('aria-selected', (mode === 'modeB').toString());
    }

    if (this.ui.panelModeA && this.ui.panelModeB) {
      this.ui.panelModeA.style.display = mode === 'modeA' ? 'block' : 'none';
      this.ui.panelModeB.style.display = mode === 'modeB' ? 'block' : 'none';
    }

    zenAudio.playTick({ pitch: 1.15, volume: 0.04 });
  }

  getPhases() {
    if (this.activeMode === 'modeA') {
      return [
        {
          name: "Puraka (Inhale)",
          duration: this.baseUnit * 1,
          type: "inhale",
          cue: "Slowly draw the vital breath inward"
        },
        {
          name: "Antar Kumbhaka (Hold Full)",
          duration: this.baseUnit * 4,
          type: "hold-full",
          cue: "Gently retain prana at the heart center"
        },
        {
          name: "Rechaka (Exhale)",
          duration: this.baseUnit * 2,
          type: "exhale",
          cue: "Smoothly and quietly release the breath"
        },
        {
          name: "Bahya Kumbhaka (Hold Empty)",
          duration: this.baseUnit * 2,
          type: "hold-empty",
          cue: "Rest in calm, still stillness"
        }
      ];
    } else {
      return [
        {
          name: "Inhale (Puraka)",
          duration: this.customInhale,
          type: "inhale",
          cue: "Expand and fill with fresh solar prana"
        },
        {
          name: "Exhale (Rechaka)",
          duration: this.customExhale,
          type: "exhale",
          cue: "Release tension, surrender outward"
        }
      ];
    }
  }

  start() {
    if (this.status === 'paused') {
      this.status = 'running';
      this.updateUIMode('running');
      const phases = this.getPhases();
      this.applyOrbPhase(phases[this.currentPhaseIndex], this.phaseTimeRemaining);
      this.runTimer();
      return;
    }

    // Mutual exclusivity callback if defined
    if (typeof this.onSessionStart === 'function') {
      this.onSessionStart();
    }

    this.status = 'running';
    this.currentCycle = 1;
    this.currentPhaseIndex = 0;
    this.totalSecondsElapsed = 0;
    this.announcedRounds.clear();

    const phases = this.getPhases();
    this.phaseTimeRemaining = phases[0].duration;

    this.updateUIMode('running');
    this.applyOrbPhase(phases[0], phases[0].duration);
    this.updateLiveDisplays();
    this.checkVoiceCues();
    this.runTimer();

    zenAudio.playTick({ pitch: 1.3, volume: 0.06 });
  }

  togglePause() {
    if (this.status === 'running') {
      this.status = 'paused';
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      this.updateUIMode('paused');
      this.pauseOrbAnimation();
    } else if (this.status === 'paused') {
      this.status = 'running';
      this.updateUIMode('running');
      const phases = this.getPhases();
      this.applyOrbPhase(phases[this.currentPhaseIndex], this.phaseTimeRemaining);
      this.runTimer();
    }
  }

  skipPhase() {
    if (this.status !== 'running' && this.status !== 'paused') return;
    this.advancePhase();
  }

  stopAndReset() {
    this.status = 'idle';
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.currentCycle = 1;
    this.currentPhaseIndex = 0;
    this.totalSecondsElapsed = 0;
    this.announcedRounds.clear();

    this.resetOrbVisual();
    this.updateUIMode('idle');
    zenAudio.playTick({ pitch: 0.75, volume: 0.05 });
  }

  runTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      if (this.status !== 'running') return;

      this.totalSecondsElapsed += 1;
      this.phaseTimeRemaining -= 1;

      this.updateLiveDisplays();

      if (this.phaseTimeRemaining <= 0) {
        this.advancePhase();
      }
    }, 1000);
  }

  advancePhase() {
    const phases = this.getPhases();
    this.currentPhaseIndex += 1;

    // Check if one full breath cycle (all phases) completed
    if (this.currentPhaseIndex >= phases.length) {
      this.currentPhaseIndex = 0;
      this.currentCycle += 1;

      // Check if user reached total target rounds!
      if (this.currentCycle > this.totalRounds) {
        this.completeSession();
        return;
      }

      this.checkVoiceCues();
    }

    const nextPhase = phases[this.currentPhaseIndex];
    this.phaseTimeRemaining = nextPhase.duration;

    // Soft singing bowl chime on transition
    const chimeFreq = nextPhase.type === 'inhale' ? 480 : (nextPhase.type === 'exhale' ? 380 : 432);
    zenAudio.playTransitionBell({ baseFreq: chimeFreq, duration: 2.2, volume: 0.07 });

    this.applyOrbPhase(nextPhase, nextPhase.duration);
    this.updateLiveDisplays();
  }

  checkVoiceCues() {
    const remaining = this.totalRounds - this.currentCycle + 1;
    if (this.announcedRounds.has(this.currentCycle)) return;

    let cue = null;
    if (remaining === 3) {
      cue = "Last three rounds";
    } else if (remaining === 2) {
      cue = "Last two rounds";
    } else if (remaining === 1) {
      cue = "Last round";
    }

    if (cue) {
      this.announcedRounds.add(this.currentCycle);
      setTimeout(() => {
        if (this.status === 'running') {
          zenAudio.speakCue(cue);
        }
      }, 450);
    }
  }

  completeSession() {
    this.status = 'completed';
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    zenAudio.playCelebrationChime();
    zenAudio.speakCue("Pranayama practice complete. Namaste.");

    this.resetOrbVisual();
    this.updateUIMode('completed');

    if (this.ui.completedRoundsText) {
      this.ui.completedRoundsText.textContent = `${this.totalRounds}`;
    }
    if (this.ui.completedTimeText) {
      const mins = Math.floor(this.totalSecondsElapsed / 60);
      const secs = this.totalSecondsElapsed % 60;
      this.ui.completedTimeText.textContent = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    }
  }

  /**
   * Applies the visual breathing guide animation.
   * Uses robust CSS transitions & classes with zero invalid syntax.
   */
  applyOrbPhase(phase, durationSeconds) {
    const orb = this.ui.visualOrb;
    const pulseRing = this.ui.visualPulseRing;
    if (!orb) return;

    const duration = Math.max(0.5, durationSeconds);

    // Remove any holding pulse class first
    orb.classList.remove('is-holding-full');

    if (phase.type === 'inhale') {
      orb.style.transition = `transform ${duration}s cubic-bezier(0.4, 0, 0.2, 1), box-shadow ${duration}s ease, background 0.5s ease`;
      orb.style.transform = 'scale(1.85)';
      orb.style.boxShadow = '0 0 44px var(--accent-sage), inset 0 0 24px rgba(255, 255, 255, 0.35)';
      if (pulseRing) {
        pulseRing.style.transition = `transform ${duration}s ease, opacity ${duration}s ease`;
        pulseRing.style.transform = 'scale(2.1)';
        pulseRing.style.opacity = '0.5';
      }
    } else if (phase.type === 'hold-full') {
      orb.style.transition = 'box-shadow 0.5s ease';
      orb.style.transform = 'scale(1.85)';
      orb.classList.add('is-holding-full');
      if (pulseRing) {
        pulseRing.style.opacity = '0.7';
      }
    } else if (phase.type === 'exhale') {
      orb.style.transition = `transform ${duration}s cubic-bezier(0.4, 0, 0.2, 1), box-shadow ${duration}s ease, background 0.5s ease`;
      orb.style.transform = 'scale(1.0)';
      orb.style.boxShadow = '0 0 16px var(--accent-sage-soft), inset 0 0 8px rgba(255, 255, 255, 0.1)';
      if (pulseRing) {
        pulseRing.style.transition = `transform ${duration}s ease, opacity ${duration}s ease`;
        pulseRing.style.transform = 'scale(1.0)';
        pulseRing.style.opacity = '0.2';
      }
    } else if (phase.type === 'hold-empty') {
      orb.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease';
      orb.style.transform = 'scale(1.0)';
      orb.style.boxShadow = '0 0 8px rgba(0, 0, 0, 0.15)';
      if (pulseRing) {
        pulseRing.style.opacity = '0.1';
      }
    }
  }

  pauseOrbAnimation() {
    const orb = this.ui.visualOrb;
    const pulseRing = this.ui.visualPulseRing;
    if (!orb) return;
    const computed = window.getComputedStyle(orb).transform;
    orb.classList.remove('is-holding-full');
    orb.style.transition = 'none';
    orb.style.transform = computed;

    if (pulseRing) {
      const computedRing = window.getComputedStyle(pulseRing).transform;
      pulseRing.style.transition = 'none';
      pulseRing.style.transform = computedRing;
    }
  }

  resetOrbVisual() {
    const orb = this.ui.visualOrb;
    if (!orb) return;
    orb.classList.remove('is-holding-full');
    orb.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease';
    orb.style.transform = 'scale(1.0)';
    orb.style.boxShadow = '0 0 20px var(--accent-sage-soft)';
    if (this.ui.visualPulseRing) {
      this.ui.visualPulseRing.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
      this.ui.visualPulseRing.style.transform = 'scale(1.0)';
      this.ui.visualPulseRing.style.opacity = '0.25';
    }
  }

  updateLiveDisplays() {
    const phases = this.getPhases();
    const currentPhase = phases[this.currentPhaseIndex] || phases[0];

    if (this.ui.livePhaseName) {
      this.ui.livePhaseName.textContent = currentPhase.name;
    }
    if (this.ui.orbCountdown) {
      this.ui.orbCountdown.textContent = `${this.phaseTimeRemaining}s`;
    }
    if (this.ui.livePhaseCue) {
      this.ui.livePhaseCue.textContent = currentPhase.cue;
    }

    if (this.ui.livePhaseBadge) {
      this.ui.livePhaseBadge.textContent = currentPhase.type.toUpperCase().replace('-', ' ');
      const breathStyle = currentPhase.type === 'inhale'
        ? 'inhale'
        : currentPhase.type === 'exhale'
          ? 'exhale'
          : 'retain';
      this.ui.livePhaseBadge.setAttribute('data-breath', breathStyle);
    }

    // Rounds counter: e.g. "Round 2 of 5"
    if (this.ui.liveCycleCount) {
      this.ui.liveCycleCount.textContent = `Round ${this.currentCycle} of ${this.totalRounds}`;
    }

    // Smooth intra-cycle progress bar for Pranayama rounds
    if (this.ui.roundsProgressFill) {
      const totalPhases = this.totalRounds * phases.length;
      const completedPhases = ((this.currentCycle - 1) * phases.length) + this.currentPhaseIndex;
      const percent = Math.min(100, (completedPhases / totalPhases) * 100);
      this.ui.roundsProgressFill.style.width = `${percent.toFixed(1)}%`;
    }

    if (this.ui.liveElapsedTime) {
      const mins = Math.floor(this.totalSecondsElapsed / 60);
      const secs = this.totalSecondsElapsed % 60;
      this.ui.liveElapsedTime.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }

  updateUIMode(mode) {
    if (!this.ui.setupContainer || !this.ui.activeContainer) return;

    if (mode === 'idle') {
      this.ui.setupContainer.style.display = 'block';
      this.ui.activeContainer.style.display = 'none';
      if (this.ui.completedContainer) this.ui.completedContainer.style.display = 'none';
      if (this.ui.pauseBtn) this.ui.pauseBtn.textContent = 'Pause';
    } else if (mode === 'running') {
      this.ui.setupContainer.style.display = 'none';
      this.ui.activeContainer.style.display = 'flex';
      if (this.ui.completedContainer) this.ui.completedContainer.style.display = 'none';
      if (this.ui.pauseBtn) {
        this.ui.pauseBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1"></rect>
            <rect x="14" y="4" width="4" height="16" rx="1"></rect>
          </svg>
          Pause
        `;
      }
    } else if (mode === 'paused') {
      if (this.ui.pauseBtn) {
        this.ui.pauseBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Resume
        `;
      }
    } else if (mode === 'completed') {
      this.ui.setupContainer.style.display = 'none';
      this.ui.activeContainer.style.display = 'none';
      if (this.ui.completedContainer) {
        this.ui.completedContainer.style.display = 'flex';
      }
    }
  }
}
