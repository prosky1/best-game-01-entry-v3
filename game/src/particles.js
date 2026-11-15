// Paper Pilot v3 — the small moving marks: particle bursts and the
// floating score popups. One job: turn the world's particle and float
// lists into pixels, and nothing else. At the 320x180 pixel
// resolution the renderer paints at, round particles smear into grey
// blobs, so bursts are square pixels now — chunky, bright, readable —
// and the floating scores use the pixel font.

import { drawPixelText } from './font.js';

export function paintParticles(ctx, world) {
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    const s = Math.max(4, p.size * 2);
    ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
  }
  ctx.globalAlpha = 1;
}

export function paintFloats(ctx, world) {
  for (const f of world.floats) {
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
    drawPixelText(ctx, f.text, f.x, f.y - 21, 3, f.color, 'center');
  }
  ctx.globalAlpha = 1;
}
