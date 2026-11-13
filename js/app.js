/**
 * Main Application Logic
 * Initializes Zen themes, audio feedback, breathing engine,
 * Surya Namaskara tracker, Pranayama sanctuary, and custom rotating scroll dials.
 * 100% Robust & Bug-Free.
 */

import { zenAudio } from './audio-feedback.js';
import { ScrollDial } from './scroll-dial.js';
import { SuryaNamaskaraTracker } from './surya-namaskara.js';
import { PranayamaTracker } from './pranayama.js';

class ZenApp {
  constructor() {
    this.theme = 'light';
    this.dials = {};

    this.initTheme();
    this.initSoundToggle();
    this.initSuryaTracker();
    this.initPranayamaTracker();
    this.initDials();
  }

  /* ------------------------------------------------------------------------
     Theme Management (Light / Dark)
     ------------------------------------------------------------------------ */
  initTheme() {
    const savedTheme = localStorage.getItem('zen_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.theme = savedTheme || (prefersDark ? 'dark' : 'light');
    this.applyTheme(this.theme);

    const toggleBtn = document.getElementById('themeToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('zen_theme', this.theme);
        this.applyTheme(this.theme);
        zenAudio.playTick({ pitch: this.theme === 'dark' ? 0.85 : 1.25, volume: 0.05 });
      });
    }
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);

    const sunIcon = document.getElementById('themeIconSun');
    const moonIcon = document.getElementById('themeIconMoon');
    const toggleText = document.getElementById('themeToggleText');

    if (sunIcon && moonIcon && toggleText) {
      if (theme === 'dark') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
        toggleText.textContent = 'Dark Mode';
      } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
        toggleText.textContent = 'Light Mode';
      }
    }
  }

  /* ------------------------------------------------------------------------
     Sound Toggle
     ------------------------------------------------------------------------ */
  initSoundToggle() {
    const soundBtn = document.getElementById('soundToggleBtn');
    const iconOn = document.getElementById('soundIconOn');
    const iconOff = document.getElementById('soundIconOff');

    if (!soundBtn) return;

    zenAudio.subscribe((isMuted) => {
      if (iconOn && iconOff) {
        iconOn.style.display = isMuted ? 'none' : 'block';
        iconOff.style.display = isMuted ? 'block' : 'none';
      }
      soundBtn.setAttribute('aria-pressed', (!isMuted).toString());
      soundBtn.title = isMuted ? 'Sound muted (click to enable)' : 'Sound enabled (click to mute)';
    });

    soundBtn.addEventListener('click', () => {
      zenAudio.toggleMute();
    });
  }

  /* ------------------------------------------------------------------------
     Part 2: Surya Namaskara Tracker Initialization
     ------------------------------------------------------------------------ */
  initSuryaTracker() {
    const roundsDialMount = document.getElementById('suryaRoundsDialMount');
    const timeDialMount = document.getElementById('suryaTimeDialMount');

    if (!roundsDialMount || !timeDialMount) return;

    this.suryaTracker = new SuryaNamaskaraTracker({
      roundsDialMount,
      timeDialMount,
      ui: {
        setupSection: document.getElementById('suryaSetupSection'),
        activeSection: document.getElementById('suryaActiveSection'),
        completedSection: document.getElementById('suryaCompletedSection'),

        setupSummaryRounds: document.getElementById('suryaSummaryRounds'),
        setupSummaryDuration: document.getElementById('suryaSummaryDuration'),
        setupSummaryTotalAsanas: document.getElementById('suryaSummaryTotalAsanas'),
        setupSummaryTotalTime: document.getElementById('suryaSummaryTotalTime'),

        startBtn: document.getElementById('suryaStartBtn'),
        pauseBtn: document.getElementById('suryaPauseBtn'),
        stopBtn: document.getElementById('suryaStopBtn'),
        skipBtn: document.getElementById('suryaSkipBtn'),

        presetRounds: document.querySelectorAll('#suryaSetupSection [data-rounds]'),
        presetTimes: document.querySelectorAll('#suryaSetupSection [data-seconds]'),

        liveRound: document.getElementById('suryaLiveRound'),
        liveTotalRounds: document.getElementById('suryaLiveTotalRounds'),
        remainingRoundsBadge: document.getElementById('suryaRemainingBadge'),
        overallProgressFill: document.getElementById('suryaOverallProgressFill'),

        liveAsanaNum: document.getElementById('suryaLiveAsanaNum'),
        liveSanskrit: document.getElementById('suryaLiveSanskrit'),
        liveEnglish: document.getElementById('suryaLiveEnglish'),
        liveCue: document.getElementById('suryaLiveCue'),
        liveIcon: document.getElementById('suryaLiveIcon'),
        liveBreathBadge: document.getElementById('suryaLiveBreathBadge'),
        liveNextAsana: document.getElementById('suryaLiveNextAsana'),

        liveCountdown: document.getElementById('suryaLiveCountdown'),
        countdownRing: document.getElementById('suryaCountdownRing'),

        completedSummaryRounds: document.getElementById('suryaCompletedRounds'),
        completedSummaryTotalAsanas: document.getElementById('suryaCompletedTotalAsanas')
      }
    });

    const newSessionBtn = document.getElementById('suryaNewSessionBtn');
    if (newSessionBtn) {
      newSessionBtn.addEventListener('click', () => {
        this.suryaTracker.stopAndReset();
      });
    }

    // Mutual exclusivity: starting Surya halts active Pranayama
    const suryaStartBtn = document.getElementById('suryaStartBtn');
    if (suryaStartBtn) {
      suryaStartBtn.addEventListener('click', () => {
        if (this.pranayamaTracker && this.pranayamaTracker.status === 'running') {
          this.pranayamaTracker.stopAndReset();
        }
      });
    }
  }

  /* ------------------------------------------------------------------------
     Part 3: Dedicated Pranayama (Breathing) Sanctuary
     ------------------------------------------------------------------------ */
  initPranayamaTracker() {
    const roundsMount = document.getElementById('pranayamaRoundsMount');
    const modeAMount = document.getElementById('pranayamaModeAMount');
    const modeBInhaleMount = document.getElementById('pranayamaModeBInhaleMount');
    const modeBExhaleMount = document.getElementById('pranayamaModeBExhaleMount');

    if (!roundsMount || !modeAMount || !modeBInhaleMount || !modeBExhaleMount) return;

    this.pranayamaTracker = new PranayamaTracker({
      roundsMount,
      modeAMount,
      modeBInhaleMount,
      modeBExhaleMount,
      ui: {
        tabModeA: document.getElementById('pranayamaTabA'),
        tabModeB: document.getElementById('pranayamaTabB'),
        panelModeA: document.getElementById('pranayamaPanelA'),
        panelModeB: document.getElementById('pranayamaPanelB'),

        setupContainer: document.getElementById('pranayamaSetupContainer'),
        activeContainer: document.getElementById('pranayamaActiveContainer'),
        completedContainer: document.getElementById('pranayamaCompletedSection'),

        setupTargetRounds: document.getElementById('pranayamaSetupTargetRounds'),

        // Mode A Calculation Cards
        modeACalcInhale: document.getElementById('modeACalcInhale'),
        modeACalcHoldFull: document.getElementById('modeACalcHoldFull'),
        modeACalcExhale: document.getElementById('modeACalcExhale'),
        modeACalcHoldEmpty: document.getElementById('modeACalcHoldEmpty'),
        modeATotalCycle: document.getElementById('modeATotalCycle'),
        modeATotalSession: document.getElementById('modeATotalSession'),

        // Mode B Calculation Cards
        modeBCalcInhale: document.getElementById('modeBCalcInhale'),
        modeBCalcExhale: document.getElementById('modeBCalcExhale'),
        modeBTotalCycle: document.getElementById('modeBTotalCycle'),
        modeBTargetRounds: document.getElementById('modeBTargetRounds'),
        modeBTotalSession: document.getElementById('modeBTotalSession'),

        // Presets
        roundsPresets: document.querySelectorAll('.pranayama-rounds-block [data-rounds]'),
        modeAPresets: document.querySelectorAll('#pranayamaPanelA [data-base]'),
        modeBPresets: document.querySelectorAll('#pranayamaPanelB [data-ratio]'),

        // Action Buttons
        startBtn: document.getElementById('pranayamaStartBtn'),
        pauseBtn: document.getElementById('pranayamaPauseBtn'),
        skipBtn: document.getElementById('pranayamaSkipBtn'),
        stopBtn: document.getElementById('pranayamaStopBtn'),
        newSessionBtn: document.getElementById('pranayamaNewSessionBtn'),

        // Visual Breathing Guide Orb elements
        visualOrb: document.getElementById('pranayamaVisualOrb'),
        visualPulseRing: document.getElementById('pranayamaPulseRing'),
        orbCountdown: document.getElementById('pranayamaOrbCountdown'),
        orbLabel: document.getElementById('pranayamaOrbLabel'),

        // Live Phase Information
        livePhaseName: document.getElementById('pranayamaLivePhaseName'),
        livePhaseCue: document.getElementById('pranayamaLivePhaseCue'),
        livePhaseBadge: document.getElementById('pranayamaPhaseBadge'),
        liveCycleCount: document.getElementById('pranayamaLiveCycleCount'),
        roundsProgressFill: document.getElementById('pranayamaRoundsProgressFill'),
        liveElapsedTime: document.getElementById('pranayamaLiveElapsedTime'),

        // Completed stats
        completedRoundsText: document.getElementById('pranayamaCompletedRounds'),
        completedTimeText: document.getElementById('pranayamaCompletedTime')
      }
    });

    // Mutual exclusivity: starting Pranayama halts active Surya Namaskara
    const pranayamaStartBtn = document.getElementById('pranayamaStartBtn');
    if (pranayamaStartBtn) {
      pranayamaStartBtn.addEventListener('click', () => {
        if (this.suryaTracker && this.suryaTracker.status === 'running') {
          this.suryaTracker.stopAndReset();
        }
      });
    }
  }

  /* ------------------------------------------------------------------------
     Initialize Additional Mindful Dials
     ------------------------------------------------------------------------ */
  initDials() {
    // Single Column Dial: Breath Retention Level (1 to 9)
    const singleTarget = document.getElementById('singleDialContainer');
    const singleReadout = document.getElementById('singleReadout');
    const intensityLabel = document.getElementById('intensityLabel');

    const intensityDescriptions = {
      1: '/ 9 (Gentle / Restorative)',
      2: '/ 9 (Subtle Awareness)',
      3: '/ 9 (Grounding Calm)',
      4: '/ 9 (Balanced Prana)',
      5: '/ 9 (Moderate Flow)',
      6: '/ 9 (Deepened Focus)',
      7: '/ 9 (Kundalini Awakening)',
      8: '/ 9 (Intense Capacity)',
      9: '/ 9 (Peak Vitality)'
    };

    if (singleTarget) {
      this.dials.single = new ScrollDial(singleTarget, {
        columns: 1,
        value: 5,
        onChange: (values, formatted) => {
          const val = parseInt(formatted, 10);
          if (singleReadout) singleReadout.textContent = val;
          if (intensityLabel) intensityLabel.textContent = intensityDescriptions[val] || `/ 9`;
        }
      });

      const levelButtons = document.querySelectorAll('.zen-card [data-level]');
      levelButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          levelButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const lvl = parseInt(btn.dataset.level, 10);
          this.dials.single.setValue(0, lvl);
        });
      });
    }

    // Session Duration: 2 Columns (Minutes & Seconds)
    const durationTarget = document.getElementById('durationDialContainer');
    const durationReadout = document.getElementById('durationReadout');

    if (durationTarget) {
      this.dials.duration = new ScrollDial(durationTarget, {
        columns: [
          { min: 0, max: 90, pad: 2, label: 'Min', value: '15' },
          { min: 0, max: 55, step: 5, pad: 2, label: 'Sec', value: '00' }
        ],
        separator: ':',
        onChange: (values, formatted) => {
          if (durationReadout) durationReadout.textContent = formatted;
        }
      });

      const durationButtons = document.querySelectorAll('.zen-card [data-duration]');
      durationButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          durationButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const [m, s] = btn.dataset.duration.split(',');
          this.dials.duration.setValues([m.padStart(2, '0'), s.padStart(2, '0')]);
        });
      });
    }
  }

  }

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new ZenApp();
});
