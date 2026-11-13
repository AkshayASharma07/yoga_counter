# Prāṇa Zen — Yoga & Breathwork Sanctuary

A mindful, calming single-page web application designed for tracking yoga, **Surya Namaskara (Sun Salutations)**, and **Pranayama (Breathing)** sessions with tactile 3D rotating scroll dials, visual breath guides, Tibetan singing bowl transition bells, and Web Speech API voice cues.

---

## 🌬️ Part 3: Dedicated Pranayama (Breathing) Section & Target Rounds

The application features a dedicated, meditative **Pranayama Sanctuary** module equipped with target round selection, two selectable breathing modes, and a hypnotic visual breathing guide:

### Target Number of Rounds (Scroll Dial Picker)
- **Dedicated Target Rounds Dial**: Dial from 1 to 50+ complete breath cycles (1, 2, 3... 30, 36, 48, 54, 108).
- **Quick Sadhana Presets**:
  - **3 Rounds** (Quick Reset)
  - **5 Rounds** (Mindful Practice)
  - **10 Rounds** (Coherence & Flow)
  - **20 Rounds** (Deep Sadhana)
- **Live Estimation**: Dynamically calculates and displays total session time in real-time (e.g. *5 Rounds @ 27s = 2m 15s*).
- **Progress Tracking & Final Voice Cues**: Displays real-time cycle progress (*Round 1 of 5*), smooth intra-cycle progress bar, and announces final rounds (*"Last three rounds"*, *"Last two rounds"*, *"Last round"*, and *"Pranayama practice complete. Namaste."*).

### Mode A: Classical 1:4:2:2 Kumbhaka Ratio
- **Standardized Classical Ratio**:
  - **Puraka** (Inhale): $1\times$
  - **Antar Kumbhaka** (Hold Full): $4\times$
  - **Rechaka** (Exhale): $2\times$
  - **Bahya Kumbhaka** (Hold Empty): $2\times$
- **Single Rotary Input**: Requires only **one base time unit in seconds** (e.g. 2s, 3s, 4s, 5s) dialed via the 3D scroll dial.
- **Automated Phase Calculations**: The application automatically calculates and presents the exact durations:
  - Base **3s** $\rightarrow$ Inhale **3s** &bull; Hold **12s** &bull; Exhale **6s** &bull; Empty **6s** (Total Cycle: **27s**).
- **Quick Classical Presets**: **2s (Intro: 2:8:4:4)**, **3s (Medium: 3:12:6:6)**, **4s (Deep: 4:16:8:8)**, **5s (Master: 5:20:10:10)**.

### Mode B: Custom 2-Part Ratio (Inhale : Exhale)
- **Independent Rotary Inputs**:
  - **Inhale Dial (Puraka)**: Allows setting 2s to 20s.
  - **Exhale Dial (Rechaka)**: Allows setting 2s to 30s.
- **Rhythmic Coherence Presets**:
  - **4s : 4s** (Equal Coherence / Sama Vritti)
  - **4s : 6s** (Calming 2:3)
  - **4s : 8s** (Relaxing Parasympathetic 1:2)
  - **6s : 3s** (Energizing Solar 2:1)

### Hypnotic Visual Breathing Guide
- A centered, organic visual guide circle with concentric resonance rings:
  - **Inhale**: Smoothly expands (`scale(1.0)` $\rightarrow$ `scale(1.85)`) with an emerald green aura.
  - **Hold Full**: Softly pulses in an expanded state with a radiant golden candlelight glow.
  - **Exhale**: Smoothly and quietly contracts back down (`scale(1.85)` $\rightarrow$ `scale(1.0)`).
  - **Hold Empty**: Rests quietly in deep stillness.
- **Real-Time Displays**:
  - Active phase name (Sanskrit & English: e.g. *Puraka*, *Antar Kumbhaka*).
  - Seconds countdown centered directly within the breathing orb.
  - Alignment cue guiding the breath.
  - Cycle counter (*Cycle 3*) and total session timer (*02:45*).
- **Transition Chimes**: Gentle Tibetan singing bowl bell rings as each phase concludes.
- **Session Controls**: Clear **Start**, **Pause**, and a prominent **"Stop Breathing"** button that halts instantly and resets to setup mode.

---

## ☀️ Part 2: Surya Namaskara (Sun Salutation) Tracker

- **3-Digit Total Rounds Dial (001 to 999)**:
  - Three independent scrolling columns for **Hundreds**, **Tens**, and **Units**.
  - Strict minimum limit enforced (`001` min). Dialing `000` automatically clamps to `001`.
  - Presets: **12 Classic**, **24 Dynamic**, **108 Sacred Mala**, **3 Intro**.
- **Time Between Asanas (Strict Minimum 10 Seconds)**:
  - Enforces minimum 10 seconds per posture (`10s` to `90s`).
  - Presets: **10s (Flow)**, **15s (Mindful)**, **20s (Deep)**, **30s (Hatha)**.
- **12 Sacred Asanas Sequence**:
  Tracks *Pranamasana*, *Hastauttanasana*, *Hastapadasana*, *Ashwa Sanchalanasana*, *Dandasana*, *Ashtanga Namaskara*, *Bhujangasana*, *Adho Mukha Svanasana*, and returns.
- **Real-Time Counter & Display**:
  - Round counter (`Round 01 of 12`) and Asana counter (`Asana 01 of 12`).
  - Circular SVG countdown ring with second-by-second animation.
  - Next posture preview ticker.
  - Cumulative asana progress bar.
- **Audio & Voice Cues**:
  - **Transition Bell**: Authentic Tibetan singing bowl synthesized via Web Audio API at 432 Hz.
  - **Voice Cues (Web Speech API)**: Announces *"Last three rounds"*, *"Last two rounds"*, *"Last round"*, and *"Practice complete. Namaste."*
- **Controls**: Start, Pause, Skip Asana, and prominent **"Stop Counter"** button to halt and reset immediately.

---

## 🧘‍♂️ Part 1: Core UI, Theming & 3D Scroll Dial Component

- **Zen & Calming Aesthetic**:
  - **Light Theme ("Morning Mist & Bamboo")**: Soft misty sage green (`#4E765D`), bamboo paper (`#F5F7F3`), sandstone (`#C5A37B`), and warm terracotta.
  - **Dark Theme ("Midnight Forest & Lunar Sand")**: Deep midnight slate (`#111613`), luminous jade moss (`#77A588`), candlelight amber (`#D5B48F`).
  - Frosted glassmorphism cards (`backdrop-filter: blur(20px)`), organic rounded corners (24-32px), and typography featuring Google's *Marcellus* + *Plus Jakarta Sans*.
- **Prominent Theme Toggle**:
  - Tactile header button with sliding icon pill and automatic `localStorage` persistence.
- **Reusable 3D Rotating Scroll Dial Component**:
  - Modeled on physical cylindrical drums and iOS/Android time-picker wheels.
  - 3D barrel perspective projection math (`rotateX` + `translateZ`).
  - Momentum inertia physics, elastic rubber-banding, magnetic center snapping.
  - Synthesized organic wooden tick via Web Audio API.
  - **Zero standard text or typing inputs anywhere in the application.**

---

## 📱 Mobile & Touchscreen Responsiveness

- **Touchscreen Dial Handling**:
  - Dials use `touch-action: none` to isolate wheel dragging and flicking from viewport scroll interference.
  - The outer container uses `touch-action: pan-y` ensuring smooth page scrolling outside the dials.
- **Touch Target Sizes**:
  - All interactive buttons, pill toggles, and stepper chevrons feature minimum touch targets $\ge 44\text{px} \times 44\text{px}$.
- **Fluid Layouts**:
  - Adaptive grids (`grid-template-columns: repeat(auto-fit, minmax(...))`) stack naturally from desktop (1200px) down to mobile phones (320px).
  - Typography uses fluid `clamp()` sizing preventing clipping on small displays.
  - Hardware accelerated GPU rendering (`will-change: transform`, `transform: translate3d(...)`).

---

## 📂 Project Structure

```
d:\yoga counter\
├── index.html                # Single-page web application entry point
├── package.json              # Project scripts and metadata
├── server.js                 # Zero-dependency local Node static server
├── README.md                 # Complete documentation and API guide
├── assets/
│   └── favicon.svg           # Minimalist Zen lotus logo
├── css/
│   ├── zen-theme.css         # Theme tokens, CSS variables, typography
│   ├── scroll-dial.css       # 3D cylindrical drum styles, selection lens, masking
│   └── app.css               # Page layout, Surya tracker, Pranayama, mobile responsive
├── js/
│   ├── audio-feedback.js     # Web Audio API bell & Web Speech API engine
│   ├── scroll-dial.js        # Reusable 3D Rotating Scroll Dial ES class
│   ├── surya-namaskara.js    # 12 Asana tracking engine & state coordinator
│   ├── pranayama.js          # Mode A (1:4:2:2) & Mode B (2-Part) breathwork engine
│   ├── app.js                # Modular ES application entry point
│   └── app.bundle.js         # Zero-dependency standalone bundle (file:// ready)
└── src/
    └── ScrollDialReact.jsx   # React wrapper component
```

---

## 🚀 How to Run & Preview

### Option 1: Direct Double-Click (No Server Required)
Double-click `index.html` in Windows Explorer to open directly in Chrome, Edge, Safari, or Firefox. The standalone bundle runs smoothly over `file:///`.

### Option 2: Local Node Server
Run the built-in HTTP server:
```bash
npm start
# or: node server.js
```
Then navigate to:
```
http://localhost:3000
```
