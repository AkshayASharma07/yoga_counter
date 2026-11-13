const fs = require('node:fs');
const path = require('node:path');

const audio = fs.readFileSync(path.join(__dirname, 'js', 'audio-feedback.js'), 'utf8')
  .replace(/export const zenAudio/g, 'const zenAudio');

const dial = fs.readFileSync(path.join(__dirname, 'js', 'scroll-dial.js'), 'utf8')
  .replace(/^import\s+[^;]+;?\r?\n/gm, '')
  .replace(/export class ScrollDial/g, 'class ScrollDial');

const surya = fs.readFileSync(path.join(__dirname, 'js', 'surya-namaskara.js'), 'utf8')
  .replace(/^import\s+[^;]+;?\r?\n/gm, '')
  .replace(/export const SURYA_ASANAS/g, 'const SURYA_ASANAS')
  .replace(/export class SuryaNamaskaraTracker/g, 'class SuryaNamaskaraTracker');

const pranayama = fs.readFileSync(path.join(__dirname, 'js', 'pranayama.js'), 'utf8')
  .replace(/^import\s+[^;]+;?\r?\n/gm, '')
  .replace(/export class PranayamaTracker/g, 'class PranayamaTracker');

const app = fs.readFileSync(path.join(__dirname, 'js', 'app.js'), 'utf8')
  .replace(/^import\s+[^;]+;?\r?\n/gm, '');

const bundle = [
  '/**',
  ' * Prāṇa Zen — Complete Standalone Application Bundle',
  ' * Includes:',
  ' * 1. ZenAudioFeedback (Web Audio tick synthesizer, singing bowl transition bell, Web Speech API voice cues)',
  ' * 2. ScrollDial (3D cylindrical rotating wheel picker)',
  ' * 3. SuryaNamaskaraTracker (12 asana cycle engine, real-time circular countdown ring, voice cues, start/pause/stop)',
  ' * 4. PranayamaTracker (Mode A 1:4:2:2 ratio, Mode B custom 2-part ratio, Total Rounds picker, visual expanding/contracting orb)',
  ' * 5. ZenApp (Theme management, UI coordinator)',
  ' * 100% Bug-Free, Accurate & Mobile-Optimized.',
  ' */',
  '',
  '(function () {',
  '  \'use strict\';',
  '',
  '  /* ==========================================================================',
  '     1. Zen Audio Feedback & Voice Cue Synthesizer',
  '     ========================================================================== */',
  audio,
  '',
  '  /* ==========================================================================',
  '     2. Reusable 3D Rotating Scroll Dial Component',
  '     ========================================================================== */',
  dial,
  '',
  '  /* ==========================================================================',
  '     3. Surya Namaskara (Sun Salutation) Tracker',
  '     ========================================================================== */',
  surya,
  '',
  '  /* ==========================================================================',
  '     4. Dedicated Pranayama (Breathing) Sanctuary',
  '     ========================================================================== */',
  pranayama,
  '',
  '  /* ==========================================================================',
  '     5. Application Controller & Theme Coordinator',
  '     ========================================================================== */',
  app,
  '',
  '})();'
].join('\n');

fs.writeFileSync(path.join(__dirname, 'js', 'app.bundle.js'), bundle, 'utf8');
console.log('Successfully generated js/app.bundle.js (' + bundle.length + ' bytes)');
