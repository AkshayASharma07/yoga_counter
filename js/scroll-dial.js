/**
 * Reusable 3D Rotating Scroll Dial Component
 * Replicates the iOS / Android alarm clock cylindrical wheel picker
 * with authentic 3D barrel perspective, inertia momentum physics,
 * tactile tick sound feedback, and multi-column digit support.
 * 100% Robust, Touch-Optimized, Bug-Free.
 */

import { zenAudio } from './audio-feedback.js';

export class ScrollDial {
  /**
   * @param {HTMLElement|string} container - Target DOM element or selector
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!this.container) {
      throw new Error(`ScrollDial: Container element not found.`);
    }

    this.options = Object.assign({
      columns: 1,           // Number of columns or array of column configs
      value: null,          // Initial value(s)
      itemHeight: 48,       // Height of each item in pixels
      stepAngle: 22.5,      // Rotation angle between items in degrees
      radius: 125,          // Cylindrical projection radius in pixels
      perspective: 750,     // 3D perspective distance
      separator: '',        // Optional separator string between columns (e.g. ":")
      showSteppers: false,  // Optional chevron buttons above/below columns
      haptic: true,         // Play subtle zen click sound
      className: '',        // Extra CSS classes
      onChange: null        // Callback (values, formattedString, colIndex)
    }, options);

    this.columnsData = this.normalizeColumns(this.options.columns);
    this.states = [];
    this.isDestroyed = false;
    this.isNotifying = false;

    this.init();
  }

  normalizeColumns(config) {
    if (typeof config === 'number') {
      const count = Math.max(1, Math.min(10, Math.floor(config)));
      const cols = [];
      const defaultLabels = count === 3
        ? ['Hundreds', 'Tens', 'Units']
        : count === 2
          ? ['Tens', 'Units']
          : count === 1
            ? ['Value']
            : Array.from({ length: count }, (_, i) => `Col ${i + 1}`);

      for (let i = 0; i < count; i++) {
        cols.push({
          min: 0,
          max: 9,
          step: 1,
          pad: 1,
          loop: true,
          label: defaultLabels[i] || `Col ${i + 1}`,
          value: 0
        });
      }
      return cols;
    }

    if (Array.isArray(config)) {
      return config.map((col, idx) => {
        if (col.items && Array.isArray(col.items)) {
          return {
            items: col.items,
            loop: col.loop !== undefined ? col.loop : false,
            label: col.label || `Col ${idx + 1}`,
            value: col.value !== undefined ? col.value : col.items[0]
          };
        }

        const min = col.min !== undefined ? col.min : 0;
        const max = col.max !== undefined ? col.max : 9;
        const step = col.step || 1;
        const pad = col.pad || 1;
        const loop = col.loop !== undefined ? col.loop : true;
        const label = col.label || `Col ${idx + 1}`;

        const items = [];
        for (let v = min; v <= max; v += step) {
          items.push(pad > 1 ? String(v).padStart(pad, '0') : String(v));
        }

        return {
          min,
          max,
          step,
          pad,
          loop,
          label,
          items,
          value: col.value !== undefined ? col.value : items[0]
        };
      });
    }

    return [{ min: 0, max: 9, step: 1, pad: 1, loop: true, label: 'Value', value: 0 }];
  }

  init() {
    this.container.innerHTML = '';
    this.container.classList.add('zen-scroll-dial');
    if (this.options.className) {
      this.container.classList.add(...this.options.className.split(' ').filter(Boolean));
    }

    const columnsContainer = document.createElement('div');
    columnsContainer.className = 'zen-dial-columns';
    this.container.appendChild(columnsContainer);

    this.columnsData.forEach((colDef, colIdx) => {
      if (!colDef.items) {
        colDef.items = [];
        const min = colDef.min !== undefined ? colDef.min : 0;
        const max = colDef.max !== undefined ? colDef.max : 9;
        const step = colDef.step || 1;
        const pad = colDef.pad || 1;
        for (let v = min; v <= max; v += step) {
          colDef.items.push(pad > 1 ? String(v).padStart(pad, '0') : String(v));
        }
      }

      let initialIdx = 0;
      if (this.options.value !== null && this.options.value !== undefined) {
        if (Array.isArray(this.options.value) && this.options.value[colIdx] !== undefined) {
          initialIdx = this.findClosestIndex(colDef.items, this.options.value[colIdx]);
        } else if (typeof this.options.value === 'number' || typeof this.options.value === 'string') {
          if (this.columnsData.length > 1 && !isNaN(Number(this.options.value))) {
            const strVal = String(this.options.value).padStart(this.columnsData.length, '0');
            const digit = strVal.slice(-this.columnsData.length)[colIdx];
            initialIdx = this.findClosestIndex(colDef.items, digit);
          } else {
            initialIdx = this.findClosestIndex(colDef.items, this.options.value);
          }
        }
      } else if (colDef.value !== undefined) {
        initialIdx = this.findClosestIndex(colDef.items, colDef.value);
      }

      const colEl = this.buildColumnDOM(colDef, colIdx);
      columnsContainer.appendChild(colEl.wrapper);

      const state = {
        colIdx,
        def: colDef,
        items: colDef.items,
        total: colDef.items.length,
        currentPos: initialIdx,
        targetPos: initialIdx,
        lastSnappedIdx: initialIdx,
        dom: colEl,
        isDragging: false,
        pointerId: null,
        startY: 0,
        startPos: 0,
        lastY: 0,
        lastTime: 0,
        velocity: 0,
        samples: [],
        animating: false
      };

      this.states.push(state);
      this.attachColumnEvents(state);
      this.renderColumn(state);

      if (this.options.separator && colIdx < this.columnsData.length - 1) {
        const sep = document.createElement('div');
        sep.className = 'zen-dial-separator';
        sep.textContent = this.options.separator;
        columnsContainer.appendChild(sep);
      }
    });

    this.notifyChange(-1);
  }

  findClosestIndex(items, val) {
    if (val === null || val === undefined) return 0;
    const strVal = String(val).trim();

    // 1. Exact string match
    const exactIdx = items.findIndex(item => String(item).trim() === strVal);
    if (exactIdx !== -1) return exactIdx;

    // 2. Numeric match (stripping units like 's', padding, etc.)
    const numVal = parseFloat(strVal.replace(/[^0-9.-]/g, ''));
    if (!isNaN(numVal)) {
      let closestIdx = 0;
      let minDiff = Infinity;
      items.forEach((item, i) => {
        const itemNum = parseFloat(String(item).replace(/[^0-9.-]/g, ''));
        if (!isNaN(itemNum)) {
          const diff = Math.abs(itemNum - numVal);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = i;
          }
        }
      });
      return closestIdx;
    }

    return 0;
  }

  buildColumnDOM(colDef, colIdx) {
    const wrapper = document.createElement('div');
    wrapper.className = 'zen-dial-column-wrapper';

    if (colDef.label) {
      const label = document.createElement('div');
      label.className = 'zen-dial-column-label';
      label.textContent = colDef.label;
      wrapper.appendChild(label);
    }

    let topStepper = null;
    if (this.options.showSteppers) {
      topStepper = document.createElement('button');
      topStepper.type = 'button';
      topStepper.className = 'zen-dial-stepper-btn stepper-up';
      topStepper.setAttribute('aria-label', `Previous item for ${colDef.label || 'value'}`);
      topStepper.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      `;
      wrapper.appendChild(topStepper);
    }

    const column = document.createElement('div');
    column.className = 'zen-dial-column';
    column.tabIndex = 0;
    column.style.touchAction = 'none';
    column.setAttribute('role', 'spinbutton');
    column.setAttribute('aria-label', colDef.label || `Column ${colIdx + 1}`);

    const lens = document.createElement('div');
    lens.className = 'zen-dial-lens';

    const vignette = document.createElement('div');
    vignette.className = 'zen-dial-vignette';

    const drum = document.createElement('div');
    drum.className = 'zen-dial-drum';

    const itemElements = [];
    colDef.items.forEach((val, i) => {
      const item = document.createElement('div');
      item.className = 'zen-dial-item';
      item.dataset.index = i;
      item.textContent = val;
      drum.appendChild(item);
      itemElements.push(item);
    });

    column.appendChild(lens);
    column.appendChild(vignette);
    column.appendChild(drum);
    wrapper.appendChild(column);

    let bottomStepper = null;
    if (this.options.showSteppers) {
      bottomStepper = document.createElement('button');
      bottomStepper.type = 'button';
      bottomStepper.className = 'zen-dial-stepper-btn stepper-down';
      bottomStepper.setAttribute('aria-label', `Next item for ${colDef.label || 'value'}`);
      bottomStepper.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      `;
      wrapper.appendChild(bottomStepper);
    }

    return {
      wrapper,
      column,
      drum,
      items: itemElements,
      topStepper,
      bottomStepper
    };
  }

  attachColumnEvents(state) {
    const { column, topStepper, bottomStepper } = state.dom;

    const onPointerDown = (e) => {
      if (this.isDestroyed) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      state.isDragging = true;
      state.pointerId = e.pointerId;
      state.startY = e.clientY;
      state.lastY = e.clientY;
      state.startPos = state.currentPos;
      state.lastTime = performance.now();
      state.velocity = 0;
      state.samples = [{ y: e.clientY, time: state.lastTime }];
      state.hasMoved = false;

      try {
        column.setPointerCapture(e.pointerId);
      } catch (err) {}

      this.stopAnimation(state);
    };

    const onPointerMove = (e) => {
      if (!state.isDragging || e.pointerId !== state.pointerId) return;
      if (e.cancelable) e.preventDefault();

      const clientY = e.clientY;
      const now = performance.now();
      const deltaY = clientY - state.startY;

      if (Math.abs(deltaY) > 4) {
        state.hasMoved = true;
      }

      state.samples.push({ y: clientY, time: now });
      while (state.samples.length > 5) {
        state.samples.shift();
      }

      const indexDelta = -(deltaY / this.options.itemHeight);
      let newPos = state.startPos + indexDelta;

      if (!state.def.loop) {
        if (newPos < 0) {
          newPos = newPos * 0.35;
        } else if (newPos > state.total - 1) {
          const over = newPos - (state.total - 1);
          newPos = (state.total - 1) + (over * 0.35);
        }
      }

      this.updatePosition(state, newPos);
    };

    const onPointerUp = (e) => {
      if (!state.isDragging || e.pointerId !== state.pointerId) return;
      state.isDragging = false;
      try {
        column.releasePointerCapture(e.pointerId);
      } catch (err) {}

      if (!state.hasMoved) {
        const rect = column.getBoundingClientRect();
        const clickOffsetY = e.clientY - (rect.top + rect.height / 2);
        const itemStep = Math.round(clickOffsetY / this.options.itemHeight);
        if (itemStep !== 0) {
          this.stepBy(state, itemStep);
          return;
        }
      }

      let velocity = 0;
      if (state.samples.length >= 2) {
        const first = state.samples[0];
        const last = state.samples[state.samples.length - 1];
        const dt = (last.time - first.time) / 1000;
        if (dt > 0.01) {
          const dy = last.y - first.y;
          velocity = -(dy / this.options.itemHeight) / dt;
        }
      }

      velocity = Math.max(-28, Math.min(28, velocity));

      if (Math.abs(velocity) > 0.6) {
        this.animateMomentum(state, velocity);
      } else {
        this.snapToNearest(state);
      }
    };

    column.addEventListener('pointerdown', onPointerDown);
    column.addEventListener('pointermove', onPointerMove);
    column.addEventListener('pointerup', onPointerUp);
    column.addEventListener('pointercancel', onPointerUp);
    column.addEventListener('lostpointercapture', () => {
      if (state.isDragging) {
        state.isDragging = false;
        this.snapToNearest(state);
      }
    });

    let wheelTimeout = null;

    column.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.stopAnimation(state);

      const delta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 40);
      let newPos = state.currentPos + (delta * 0.003);

      if (!state.def.loop) {
        newPos = Math.max(-0.4, Math.min(state.total - 0.6, newPos));
      }

      this.updatePosition(state, newPos);

      clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => {
        this.snapToNearest(state);
      }, 90);
    }, { passive: false });

    column.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          this.stepBy(state, -1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.stepBy(state, 1);
          break;
        case 'PageUp':
          e.preventDefault();
          this.stepBy(state, -5);
          break;
        case 'PageDown':
          e.preventDefault();
          this.stepBy(state, 5);
          break;
        case 'Home':
          e.preventDefault();
          this.animateTo(state, 0);
          break;
        case 'End':
          e.preventDefault();
          this.animateTo(state, state.total - 1);
          break;
      }
    });

    if (topStepper) {
      topStepper.addEventListener('click', (e) => {
        e.stopPropagation();
        this.stepBy(state, -1);
      });
    }
    if (bottomStepper) {
      bottomStepper.addEventListener('click', (e) => {
        e.stopPropagation();
        this.stepBy(state, 1);
      });
    }
  }

  updatePosition(state, pos) {
    state.currentPos = pos;

    const snapped = this.normalizeIndex(Math.round(pos), state.total, state.def.loop);
    if (snapped !== state.lastSnappedIdx) {
      state.lastSnappedIdx = snapped;
      if (this.options.haptic) {
        const pitch = 0.95 + (state.colIdx * 0.08);
        zenAudio.playTick({ pitch, volume: 0.045 });
      }
    }

    this.renderColumn(state);
  }

  normalizeIndex(index, total, loop) {
    if (total <= 0) return 0;
    if (loop) {
      return ((index % total) + total) % total;
    }
    return Math.max(0, Math.min(total - 1, index));
  }

  renderColumn(state) {
    const { items, column } = state.dom;
    const { stepAngle, radius } = this.options;
    const pos = state.currentPos;
    const total = state.total;
    const loop = state.def.loop;

    const centerIdx = this.normalizeIndex(Math.round(pos), total, loop);

    column.setAttribute('aria-valuenow', state.items[centerIdx]);
    column.setAttribute('aria-valuetext', String(state.items[centerIdx]));

    items.forEach((itemEl, idx) => {
      let diff = idx - pos;

      if (loop) {
        diff = ((diff + total / 2) % total + total) % total - (total / 2);
      }

      const angle = diff * stepAngle;
      const absAngle = Math.abs(angle);

      if (absAngle > 85) {
        itemEl.style.display = 'none';
        itemEl.classList.remove('is-selected');
        return;
      }

      itemEl.style.display = 'flex';

      const rad = (angle * Math.PI) / 180;
      const y = radius * Math.sin(rad);
      const z = radius * (Math.cos(rad) - 1);
      const rotX = -angle;

      const cosVal = Math.cos(rad);
      const scale = 0.88 + 0.12 * Math.pow(cosVal, 2);
      const opacity = Math.max(0.06, Math.pow(cosVal, 2.2));

      itemEl.style.transform = `translate3d(0, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateX(${rotX.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      itemEl.style.opacity = opacity.toFixed(3);

      if (Math.abs(diff) < 0.45) {
        itemEl.classList.add('is-selected');
      } else {
        itemEl.classList.remove('is-selected');
      }
    });
  }

  animateMomentum(state, initialVelocity) {
    this.stopAnimation(state);
    state.animating = true;

    let v = initialVelocity;
    const friction = 0.92;
    let lastTime = performance.now();

    const frame = (now) => {
      if (!state.animating || this.isDestroyed) return;

      const dt = Math.min(0.032, (now - lastTime) / 1000);
      lastTime = now;

      state.currentPos += v * dt;
      v *= Math.pow(friction, dt * 60);

      if (!state.def.loop) {
        if (state.currentPos < 0) {
          state.currentPos = 0;
          v = 0;
        } else if (state.currentPos > state.total - 1) {
          state.currentPos = state.total - 1;
          v = 0;
        }
      }

      this.updatePosition(state, state.currentPos);

      if (Math.abs(v) < 0.18) {
        state.animating = false;
        this.snapToNearest(state);
      } else {
        state.rafId = requestAnimationFrame(frame);
      }
    };

    state.rafId = requestAnimationFrame(frame);
  }

  snapToNearest(state) {
    this.stopAnimation(state);

    let target = Math.round(state.currentPos);
    if (!state.def.loop) {
      target = Math.max(0, Math.min(state.total - 1, target));
    }

    this.animateTo(state, target);
  }

  animateTo(state, targetPos) {
    this.stopAnimation(state);
    state.animating = true;

    const startPos = state.currentPos;
    const delta = targetPos - startPos;
    const duration = Math.min(380, Math.max(180, Math.abs(delta) * 120));
    const startTime = performance.now();

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const frame = (now) => {
      if (!state.animating || this.isDestroyed) return;

      const progress = Math.min(1, (now - startTime) / duration);
      const eased = easeOutCubic(progress);

      const newPos = startPos + (delta * eased);
      this.updatePosition(state, newPos);

      if (progress < 1) {
        state.rafId = requestAnimationFrame(frame);
      } else {
        state.animating = false;
        if (state.def.loop) {
          state.currentPos = this.normalizeIndex(targetPos, state.total, true);
          this.renderColumn(state);
        }
        this.notifyChange(state.colIdx);
      }
    };

    state.rafId = requestAnimationFrame(frame);
  }

  stepBy(state, delta) {
    let next = Math.round(state.currentPos) + delta;
    if (!state.def.loop) {
      next = Math.max(0, Math.min(state.total - 1, next));
    }
    this.animateTo(state, next);
  }

  stopAnimation(state) {
    state.animating = false;
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
  }

  notifyChange(changedColIdx) {
    if (this.isNotifying) return;
    this.isNotifying = true;

    try {
      const values = this.getValues();
      const formatted = this.getFormattedValue();

      if (typeof this.options.onChange === 'function') {
        try {
          this.options.onChange(values, formatted, changedColIdx);
        } catch (e) {
          console.error('ScrollDial onChange error:', e);
        }
      }

      const event = new CustomEvent('zen-change', {
        detail: { values, formatted, changedColIdx },
        bubbles: true
      });
      this.container.dispatchEvent(event);
    } finally {
      this.isNotifying = false;
    }
  }

  getValue() {
    const vals = this.getValues();
    return vals.length === 1 ? vals[0] : vals;
  }

  getValues() {
    return this.states.map(state => {
      const idx = this.normalizeIndex(Math.round(state.currentPos), state.total, state.def.loop);
      return state.items[idx];
    });
  }

  getFormattedValue() {
    const vals = this.getValues();
    if (this.options.separator) {
      return vals.join(this.options.separator);
    }
    return vals.join('');
  }

  setValue(colIdx, value, animate = true) {
    const state = this.states[colIdx];
    if (!state) return;
    const targetIdx = this.findClosestIndex(state.items, value);
    if (animate) {
      this.animateTo(state, targetIdx);
    } else {
      this.updatePosition(state, targetIdx);
      this.notifyChange(colIdx);
    }
  }

  setValues(values, animate = true) {
    if (values === null || values === undefined) return;

    if (!Array.isArray(values)) {
      if (this.states.length > 1 && (typeof values === 'number' || (typeof values === 'string' && !isNaN(Number(values))))) {
        const strVal = String(values).padStart(this.states.length, '0');
        values = strVal.slice(-this.states.length).split('');
      } else {
        values = [values];
      }
    }

    values.forEach((val, idx) => {
      if (this.states[idx]) {
        this.setValue(idx, val, animate);
      }
    });
  }

  destroy() {
    this.isDestroyed = true;
    this.states.forEach(state => this.stopAnimation(state));
    this.container.innerHTML = '';
  }
}
