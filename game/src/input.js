// Paper Pilot — keyboard, mouse and touch input in one place.
// The game only ever asks three questions: is lift held right now,
// was a key pressed since the last frame, and where did the pointer tap?

export class Input {
  constructor(canvas) {
    this.liftHeld = false;
    this.pointerY = null;
    this.pressed = new Set();
    this.queuedClicks = [];
    this.keys = new Set();

    window.addEventListener('keydown', (event) => {
      if (['Space', 'ArrowUp', 'ArrowDown'].includes(event.code)) event.preventDefault();
      if (!event.repeat) this.pressed.add(event.code);
      this.keys.add(event.code);
      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
        this.liftHeld = true;
      }
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
        this.liftHeld = this.keys.has('Space') || this.keys.has('ArrowUp') || this.keys.has('KeyW');
      }
    });
    // Losing the window must never leave the plane climbing forever.
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.liftHeld = false;
    });

    canvas.addEventListener('pointerdown', (event) => {
      this.liftHeld = true;
      this.pointerY = event.clientY;
      this.queuedClicks.push({ x: event.clientX, y: event.clientY });
    });
    window.addEventListener('pointerup', () => {
      this.liftHeld = this.keys.has('Space') || this.keys.has('ArrowUp') || this.keys.has('KeyW');
    });
    canvas.addEventListener('pointermove', (event) => {
      this.pointerY = event.clientY;
    });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  // Edge-triggered: true once per physical press, then cleared at the
  // end of the frame, so a held key never re-triggers a menu action.
  wasPressed(code) {
    return this.pressed.has(code);
  }

  // Pointer taps since the last frame, in CSS pixels relative to the
  // viewport; the caller maps them onto canvas coordinates.
  takeClicks() {
    const clicks = this.queuedClicks;
    this.queuedClicks = [];
    return clicks;
  }

  endFrame() {
    this.pressed.clear();
  }
}
