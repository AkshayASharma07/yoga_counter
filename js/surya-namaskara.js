/**
 * Surya Namaskara (Sun Salutation) Tracker Engine
 * Tracks 12 sacred asanas per round with real-time countdown,
 * singing bowl transition bells, and Web Speech API voice cues.
 */

import { zenAudio } from './audio-feedback.js';
import { ScrollDial } from './scroll-dial.js';

export const SURYA_ASANAS = [
  {
    id: 1,
    sanskrit: "Pranamasana",
    english: "Prayer Pose",
    breath: "Exhale",
    cue: "Stand tall, hands at heart center, calm intention",
    icon: "🙏"
  },
  {
    id: 2,
    sanskrit: "Hastauttanasana",
    english: "Raised Arms Pose",
    breath: "Inhale",
    cue: "Extend upward and back, opening the heart to the sun",
    icon: "🙌"
  },
  {
    id: 3,
    sanskrit: "Hastapadasana",
    english: "Hand to Foot Pose",
    breath: "Exhale",
    cue: "Fold forward from hips, grounding toward the earth",
    icon: "🙇"
  },
  {
    id: 4,
    sanskrit: "Ashwa Sanchalanasana",
    english: "Equestrian Pose (Right)",
    breath: "Inhale",
    cue: "Right leg extends back, knee down, chest opens",
    icon: "🧘"
  },
  {
    id: 5,
    sanskrit: "Dandasana",
    english: "Plank Pose",
    breath: "Retain",
    cue: "Firm torso, crown to heels in one line of energy",
    icon: "━"
  },
  {
    id: 6,
    sanskrit: "Ashtanga Namaskara",
    english: "Eight-Limbed Salutation",
    breath: "Exhale",
    cue: "Feet, knees, chest, hands, and chin touch the earth",
    icon: "🙇‍♂️"
  },
  {
    id: 7,
    sanskrit: "Bhujangasana",
    english: "Cobra Pose",
    breath: "Inhale",
    cue: "Glide chest forward and upward, shoulders soft",
    icon: "🐍"
  },
  {
    id: 8,
    sanskrit: "Adho Mukha Svanasana",
    english: "Downward-Facing Dog",
    breath: "Exhale",
    cue: "Press hips high, lengthening spine and hamstrings",
    icon: "⛰️"
  },
  {
    id: 9,
    sanskrit: "Ashwa Sanchalanasana",
    english: "Equestrian Pose (Left)",
    breath: "Inhale",
    cue: "Step left leg forward, gaze gently lifted",
    icon: "🧘"
  },
  {
    id: 10,
    sanskrit: "Hastapadasana",
    english: "Hand to Foot Pose",
    breath: "Exhale",
    cue: "Fold deep, releasing neck and shoulders",
    icon: "🙇"
  },
  {
    id: 11,
    sanskrit: "Hastauttanasana",
    english: "Raised Arms Pose",
    breath: "Inhale",
    cue: "Sweep arms wide and high, arching gracefully",
    icon: "🙌"
  },
  {
    id: 12,
    sanskrit: "Pranamasana",
    english: "Prayer Pose",
    breath: "Exhale",
    cue: "Return hands to heart, one complete cycle of light",
    icon: "🙏"
  }
];

export class SuryaNamaskaraTracker {
  constructor({
    roundsDialMount,
    timeDialMount,
    ui = {}
  }) {
    this.roundsDialMount = roundsDialMount;
    this.timeDialMount = timeDialMount;
    this.ui = ui;

    // Session State
    this.totalRounds = 12;
    this.timePerAsana = 15; // strict minimum 10 seconds
    this.currentRound = 1;
    this.currentAsana = 1;
    this.timeRemaining = 15;
    this.status = 'idle'; // 'idle' | 'running' | 'paused' | 'completed'

    this.timerInterval = null;
    this.announcedRounds = new Set();

    this.initDials();
    this.bindEvents();
    this.updateSetupSummary();
  }

  /**
   * Initializes the two required custom rotating scroll dials:
   * 1. Total Rounds: 3 digits (Hundreds, Tens, Units) from 001 to 999.
   * 2. Time Between Asanas: Scroll dial with strict minimum 10 seconds.
   */
  initDials() {
    // 1. Total Rounds (3 digits: Hundreds, Tens, Units)
    if (this.roundsDialMount) {
      this.roundsDial = new ScrollDial(this.roundsDialMount, {
        columns: [
          { min: 0, max: 9, label: 'Hundreds', loop: true },
          { min: 0, max: 9, label: 'Tens', loop: true },
          { min: 0, max: 9, label: 'Units', loop: true }
        ],
        value: ['0', '1', '2'], // Default 12 rounds
        onChange: (values, formatted) => {
          let num = parseInt(formatted, 10);
          // Strict minimum limit of 1 round (001 to 999)
          if (isNaN(num) || num < 1) {
            num = 1;
            // Auto-snap units to 1 if user dialed 000
            this.roundsDial.setValue(2, 1);
          }
          this.totalRounds = num;
          this.updateSetupSummary();
        }
      });
    }

    // 2. Time Between Asanas (Strict minimum 10 seconds)
    // Generates items from 10s up to 90s, strictly enforcing >= 10s
    if (this.timeDialMount) {
      const timeItems = [];
      for (let s = 10; s <= 90; s += 1) {
        timeItems.push(s < 100 ? String(s).padStart(2, '0') : String(s));
      }

      this.timeDial = new ScrollDial(this.timeDialMount, {
        columns: [
          {
            items: timeItems,
            loop: false,
            label: 'Duration (s)',
            value: '15'
          }
        ],
        onChange: (values, formatted) => {
          let seconds = parseInt(formatted, 10);
          // Strict minimum limit of 10 seconds
          if (isNaN(seconds) || seconds < 10) {
            seconds = 10;
            this.timeDial.setValue(0, '10');
          }
          this.timePerAsana = seconds;
          this.updateSetupSummary();
        }
      });
    }
  }

  updateSetupSummary() {
    if (this.ui.setupSummaryRounds) {
      this.ui.setupSummaryRounds.textContent = this.totalRounds;
    }
    if (this.ui.setupSummaryDuration) {
      this.ui.setupSummaryDuration.textContent = `${this.timePerAsana}s`;
    }
    if (this.ui.setupSummaryTotalTime) {
      const totalSeconds = this.totalRounds * 12 * this.timePerAsana;
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      this.ui.setupSummaryTotalTime.textContent = mins > 0
        ? `${mins}m ${secs > 0 ? secs + 's' : ''}`
        : `${secs}s`;
    }
    if (this.ui.setupSummaryTotalAsanas) {
      this.ui.setupSummaryTotalAsanas.textContent = this.totalRounds * 12;
    }

    // Keep preset pills synchronized with active dial values
    if (this.ui.presetRounds) {
      this.ui.presetRounds.forEach(btn => {
        const r = parseInt(btn.dataset.rounds, 10);
        btn.classList.toggle('active', r === this.totalRounds);
      });
    }
    if (this.ui.presetTimes) {
      this.ui.presetTimes.forEach(btn => {
        const s = parseInt(btn.dataset.seconds, 10);
        btn.classList.toggle('active', s === this.timePerAsana);
      });
    }
  }

  bindEvents() {
    if (this.ui.startBtn) {
      this.ui.startBtn.addEventListener('click', () => this.start());
    }
    if (this.ui.pauseBtn) {
      this.ui.pauseBtn.addEventListener('click', () => this.togglePause());
    }
    if (this.ui.stopBtn) {
      this.ui.stopBtn.addEventListener('click', () => this.stopAndReset());
    }
    if (this.ui.skipBtn) {
      this.ui.skipBtn.addEventListener('click', () => this.skipAsana());
    }

    // Quick Rounds Presets
    if (this.ui.presetRounds) {
      this.ui.presetRounds.forEach(btn => {
        btn.addEventListener('click', () => {
          this.ui.presetRounds.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const target = parseInt(btn.dataset.rounds, 10);
          if (this.roundsDial) {
            this.roundsDial.setValues(target);
          }
        });
      });
    }

    // Quick Time Presets (Strict minimum >= 10s)
    if (this.ui.presetTimes) {
      this.ui.presetTimes.forEach(btn => {
        btn.addEventListener('click', () => {
          this.ui.presetTimes.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const secs = Math.max(10, parseInt(btn.dataset.seconds, 10));
          if (this.timeDial) {
            this.timeDial.setValue(0, String(secs).padStart(2, '0'));
          }
        });
      });
    }
  }

  start() {
    if (this.status === 'paused') {
      this.status = 'running';
      this.updateUIMode('running');
      this.runTimer();
      return;
    }

    // New Session Start
    this.status = 'running';
    this.currentRound = 1;
    this.currentAsana = 1;
    this.timeRemaining = this.timePerAsana;
    this.announcedRounds.clear();

    this.updateUIMode('running');
    this.updateLiveDisplay();

    // Check voice cue for first round (e.g. if total rounds is 3, 2, or 1)
    this.checkVoiceCues();

    // Begin countdown
    this.runTimer();
  }

  togglePause() {
    if (this.status === 'running') {
      this.status = 'paused';
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      this.updateUIMode('paused');
    } else if (this.status === 'paused') {
      this.status = 'running';
      this.updateUIMode('running');
      this.runTimer();
    }
  }

  /**
   * Prominent Stop Counter: halts the session instantly and resets.
   */
  stopAndReset() {
    this.status = 'idle';
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.currentRound = 1;
    this.currentAsana = 1;
    this.timeRemaining = this.timePerAsana;
    this.announcedRounds.clear();

    zenAudio.playTick({ pitch: 0.8, volume: 0.05 });
    this.updateUIMode('idle');
    this.updateLiveDisplay();
  }

  skipAsana() {
    if (this.status !== 'running' && this.status !== 'paused') return;
    this.onAsanaComplete();
  }

  runTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      if (this.status !== 'running') return;

      this.timeRemaining -= 1;
      this.updateCountdownDisplay();

      if (this.timeRemaining <= 0) {
        this.onAsanaComplete();
      }
    }, 1000);
  }

  /**
   * Triggered precisely when an asana duration completes.
   */
  onAsanaComplete() {
    // 1. Play soothing transition bell / singing bowl precisely on posture completion
    zenAudio.playTransitionBell();

    // 2. Advance asana
    this.currentAsana += 1;

    // Check if 12 asanas of the round are finished
    if (this.currentAsana > 12) {
      this.currentAsana = 1;
      this.currentRound += 1;

      // Check if total rounds completed
      if (this.currentRound > this.totalRounds) {
        this.completeSession();
        return;
      }

      // Voice cue check at start of new round
      this.checkVoiceCues();
    }

    // Reset countdown for next posture
    this.timeRemaining = this.timePerAsana;
    this.updateLiveDisplay();
  }

  /**
   * Voice Cues via Web Speech API
   * Announces "Last three rounds", "Last two rounds", "Last round"
   */
  checkVoiceCues() {
    const remaining = this.totalRounds - this.currentRound + 1;
    if (this.announcedRounds.has(this.currentRound)) return;

    let cue = null;
    if (remaining === 3) {
      cue = "Last three rounds";
    } else if (remaining === 2) {
      cue = "Last two rounds";
    } else if (remaining === 1) {
      cue = "Last round";
    }

    if (cue) {
      this.announcedRounds.add(this.currentRound);
      // Gentle 450ms pause so singing bowl chime resonates before voice speaks
      setTimeout(() => {
        if (this.status === 'running') {
          zenAudio.speakCue(cue);
        }
      }, 450);
    }
  }

  completeSession() {
    this.status = 'completed';
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    zenAudio.playCelebrationChime();
    zenAudio.speakCue("Practice complete. Namaste.");

    this.updateUIMode('completed');
  }

  updateLiveDisplay() {
    const asana = SURYA_ASANAS[this.currentAsana - 1] || SURYA_ASANAS[0];
    const nextAsana = SURYA_ASANAS[this.currentAsana % 12] || SURYA_ASANAS[0];

    // Round counter
    if (this.ui.liveRound) {
      this.ui.liveRound.textContent = this.currentRound;
    }
    if (this.ui.liveTotalRounds) {
      this.ui.liveTotalRounds.textContent = this.totalRounds;
    }

    // Remaining rounds badge
    if (this.ui.remainingRoundsBadge) {
      const remaining = this.totalRounds - this.currentRound + 1;
      if (remaining === 1) {
        this.ui.remainingRoundsBadge.textContent = "Final Round";
        this.ui.remainingRoundsBadge.className = "zen-badge pulse-accent";
      } else if (remaining <= 3) {
        this.ui.remainingRoundsBadge.textContent = `${remaining} rounds remaining`;
        this.ui.remainingRoundsBadge.className = "zen-badge highlight-accent";
      } else {
        this.ui.remainingRoundsBadge.textContent = `${remaining} rounds remaining`;
        this.ui.remainingRoundsBadge.className = "zen-badge";
      }
    }

    // Asana information
    if (this.ui.liveAsanaNum) {
      this.ui.liveAsanaNum.textContent = this.currentAsana;
    }
    if (this.ui.liveSanskrit) {
      this.ui.liveSanskrit.textContent = asana.sanskrit;
    }
    if (this.ui.liveEnglish) {
      this.ui.liveEnglish.textContent = asana.english;
    }
    if (this.ui.liveCue) {
      this.ui.liveCue.textContent = asana.cue;
    }
    if (this.ui.liveIcon) {
      this.ui.liveIcon.textContent = asana.icon;
    }
    if (this.ui.liveBreathBadge) {
      this.ui.liveBreathBadge.textContent = asana.breath;
      this.ui.liveBreathBadge.setAttribute('data-breath', asana.breath.toLowerCase());
    }
    if (this.ui.liveNextAsana) {
      this.ui.liveNextAsana.textContent = `Next: ${nextAsana.sanskrit} (${nextAsana.english})`;
    }

    // Overall progress bar (Total Asanas progress)
    if (this.ui.overallProgressFill) {
      const totalAsanas = this.totalRounds * 12;
      const completedAsanas = ((this.currentRound - 1) * 12) + (this.currentAsana - 1);
      const percent = Math.min(100, (completedAsanas / totalAsanas) * 100);
      this.ui.overallProgressFill.style.width = `${percent.toFixed(1)}%`;
    }

    this.updateCountdownDisplay();
  }

  updateCountdownDisplay() {
    if (this.ui.liveCountdown) {
      this.ui.liveCountdown.textContent = `${this.timeRemaining}s`;
    }

    // Circular Countdown Ring animation
    if (this.ui.countdownRing) {
      const circumference = 2 * Math.PI * 54; // r = 54
      const progress = this.timeRemaining / this.timePerAsana;
      const offset = circumference * (1 - progress);
      this.ui.countdownRing.style.strokeDashoffset = offset;
    }
  }

  updateUIMode(mode) {
    if (!this.ui.setupSection || !this.ui.activeSection || !this.ui.completedSection) return;

    if (mode === 'idle') {
      this.ui.setupSection.style.display = 'block';
      this.ui.activeSection.style.display = 'none';
      this.ui.completedSection.style.display = 'none';
      if (this.ui.pauseBtn) this.ui.pauseBtn.textContent = 'Pause';
    } else if (mode === 'running') {
      this.ui.setupSection.style.display = 'none';
      this.ui.activeSection.style.display = 'block';
      this.ui.completedSection.style.display = 'none';
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
      this.ui.setupSection.style.display = 'none';
      this.ui.activeSection.style.display = 'none';
      this.ui.completedSection.style.display = 'flex';
      if (this.ui.completedSummaryRounds) {
        this.ui.completedSummaryRounds.textContent = this.totalRounds;
      }
      if (this.ui.completedSummaryTotalAsanas) {
        this.ui.completedSummaryTotalAsanas.textContent = this.totalRounds * 12;
      }
    }
  }
}
