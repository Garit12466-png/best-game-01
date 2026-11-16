// MONSTERWEAVE — Input Handling for Mouse (Drag & Drop, Click-Select) and Keyboard

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config.js';

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.mouse = { x: 0, y: 0, down: false, clicked: false, released: false };
    this.keys = {};
    this.justPressedKeys = {};
    this.selectedPieceIndex = -1;
    this.draggedPieceIndex = -1;
    this.dragOffset = { x: 0, y: 0 };

    this._bindEvents();
  }

  _bindEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    window.addEventListener('mousemove', (e) => {
      const pos = getPos(e);
      this.mouse.x = pos.x;
      this.mouse.y = pos.y;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      const pos = getPos(e);
      this.mouse.x = pos.x;
      this.mouse.y = pos.y;
      this.mouse.down = true;
      this.mouse.clicked = true;
    });

    window.addEventListener('mouseup', () => {
      if (this.mouse.down) {
        this.mouse.released = true;
      }
      this.mouse.down = false;
    });

    // Touch events for mobile/tablet compatibility
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        const pos = getPos(e.touches[0]);
        this.mouse.x = pos.x;
        this.mouse.y = pos.y;
        this.mouse.down = true;
        this.mouse.clicked = true;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const pos = getPos(e.touches[0]);
        this.mouse.x = pos.x;
        this.mouse.y = pos.y;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      if (this.mouse.down) {
        this.mouse.released = true;
      }
      this.mouse.down = false;
    });

    window.addEventListener('keydown', (e) => {
      if (!this.keys[e.key]) {
        this.justPressedKeys[e.key] = true;
      }
      this.keys[e.key] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });
  }

  isKeyJustPressed(key) {
    return !!this.justPressedKeys[key];
  }

  clearPerFrame() {
    this.mouse.clicked = false;
    this.mouse.released = false;
    this.justPressedKeys = {};
  }
}
