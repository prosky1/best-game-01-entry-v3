// Paper Pilot v3 — the sprites: everything that flies, floats or
// blocks in the sky, drawn one object at a time. The plane, the
// golden rings, the sun shards, the storm clouds, the birds and the
// zone gate. Colours come from the world's zone palette, so the same
// sprite reads differently in each region's light.

import { VIEW } from './config.js';
import { drawPixelText, drawIcon, textWidth } from './font.js';

// A golden ring: glowing hoop, pale inner line, four sparkle ticks so
// it reads as a target. A missed ring fades to a ghost.
export function paintRing(ctx, ring, scrollX, palette) {
  const sx = ring.x - scrollX;
  if (sx < -90 || sx > VIEW.width + 90) return;
  ctx.save();
  ctx.globalAlpha = ring.missed ? 0.28 : 1;
  ctx.shadowColor = palette.ringGlow;
  ctx.shadowBlur = 22;
  ctx.strokeStyle = palette.ring;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(sx, ring.y, ring.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#fff0b8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sx, ring.y, ring.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#fff6cf';
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + 0.4;
    ctx.beginPath();
    ctx.arc(sx + Math.cos(a) * ring.r, ring.y + Math.sin(a) * ring.r, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// A twinkling sun shard: a four-point star that marks the zone's
// collectible counter. A taken shard is gone.
export function paintShard(ctx, shard, scrollX, time, palette) {
  const sx = shard.x - scrollX;
  if (sx < -30 || sx > VIEW.width + 30 || shard.taken) return;
  const tw = 0.75 + Math.sin(time * 5 + shard.phase) * 0.25;
  ctx.save();
  ctx.translate(sx, shard.y);
  ctx.scale(tw, tw);
  ctx.fillStyle = palette.shard;
  ctx.shadowColor = 'rgba(255, 230, 109, 0.8)';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  // Four-point star: up, right, down, left, pulled tight at the waist.
  ctx.moveTo(0, -16);
  ctx.quadraticCurveTo(4, -4, 16, 0);
  ctx.quadraticCurveTo(4, 4, 0, 16);
  ctx.quadraticCurveTo(-4, 4, -16, 0);
  ctx.quadraticCurveTo(-4, -4, 0, -16);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// A storm cloud: dark puffs, a dark belly, rain streaks, and a
// lightning bolt while it flashes.
export function paintStorm(ctx, cloud, scrollX, palette) {
  const sx = cloud.x - scrollX;
  if (sx < -260 || sx > VIEW.width + 260) return;
  ctx.save();
  ctx.translate(sx, cloud.y);
  if (cloud.flash > 0) {
    ctx.shadowColor = '#b9a7ff';
    ctx.shadowBlur = 40;
  }
  ctx.fillStyle = palette.storm;
  for (const [ox, oy, r] of [[-52, 8, 34], [0, -14, 44], [52, 8, 32], [0, 14, 36]]) {
    ctx.beginPath();
    ctx.arc(ox, oy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = palette.stormDark;
  ctx.beginPath();
  ctx.ellipse(0, 22, 78, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(150, 180, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = -3; i <= 3; i++) {
    const rx = i * 22;
    ctx.moveTo(rx, 30);
    ctx.lineTo(rx - 8, 62);
  }
  ctx.stroke();
  if (cloud.flash > 0) {
    ctx.strokeStyle = '#ffe66d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-6, 34);
    ctx.lineTo(4, 58);
    ctx.lineTo(-4, 58);
    ctx.lineTo(10, 84);
    ctx.stroke();
  }
  ctx.restore();
}

// A bird: dark body, beak, two flapping wings, one gold eye.
export function paintBird(ctx, bird, scrollX, time) {
  const sx = bird.x - scrollX - time * 40;
  if (sx < -60 || sx > VIEW.width + 60) return;
  const flap = Math.sin(bird.flap) * 0.7;
  ctx.save();
  ctx.translate(sx, bird.y);
  ctx.fillStyle = '#2c2647';
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(18, -2);
  ctx.lineTo(30, -6);
  ctx.lineTo(28, 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2c2647';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, -2);
  ctx.quadraticCurveTo(-14, -22 - flap * 14, -30, -18 - flap * 18);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-4, 2);
  ctx.quadraticCurveTo(-12, 14 + flap * 10, -26, 12 + flap * 12);
  ctx.stroke();
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(24, -4, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// The zone gate: a tall golden arch far ahead, pulsing, with its label
// above and its promise below. The fourth zone's gate is the Sun Gate —
// flying through it wins the campaign.
export function paintGate(ctx, world) {
  const gate = world.gate;
  if (gate.passed) return;
  const sx = gate.x - world.scrollX;
  if (sx < -260 || sx > VIEW.width + 260) return;
  const cy = 360;
  const pulse = 0.7 + Math.sin(world.time * 3) * 0.3;
  const palette = world.palette;
  ctx.save();
  ctx.shadowColor = 'rgba(255, 214, 106, 0.9)';
  ctx.shadowBlur = 30 * pulse;
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(sx, cy, 250, -Math.PI / 2 - 1.05, -Math.PI / 2 + 1.05);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#fff3c4';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(sx, cy, 250, -Math.PI / 2 - 1.05, -Math.PI / 2 + 1.05);
  ctx.stroke();
  ctx.fillStyle = '#fff3c4';
  const gateLabel = world.zoneDef.gateLabel;
  const labelW = textWidth(gateLabel, 4) + 2 * (7 * 4 + 12);
  // Keep the label on screen when the arch is only half in frame:
  // clamp its centre so the text never gets cut by the right edge.
  const labelCx = Math.max(labelW / 2 + 16, Math.min(VIEW.width - labelW / 2 - 16, sx));
  const lx = labelCx - labelW / 2;
  drawIcon(ctx, 'sun', lx + (7 * 4) / 2, cy - 265 + (7 * 4) / 2, 4, '#ffd76a');
  drawPixelText(ctx, gateLabel, lx + 7 * 4 + 12, cy - 265, 4, '#fff3c4', 'left');
  drawIcon(ctx, 'sun', lx + labelW - (7 * 4) / 2, cy - 265 + (7 * 4) / 2, 4, '#ffd76a');
  const promise =
    world.zone >= 3 ? 'FLY THROUGH TO WIN - +1000' : 'FLY THROUGH TO CLEAR THE ZONE - +500';
  drawPixelText(ctx, promise, labelCx, cy + 292, 3, '#ffe9a8', 'center');
  ctx.restore();
}

// The paper plane: one folded sheet, white top, shaded underside, red
// stripe so its direction reads at a glance. It blinks while
// invulnerable, and casts a soft shadow on the air beneath it.
export function paintPlane(ctx, world) {
  const plane = world.plane;
  const palette = world.palette;
  const px = VIEW.width * 0.3;
  ctx.save();
  ctx.translate(px, plane.y);
  ctx.rotate(plane.angle);
  if (plane.invulnerable > 0 && Math.floor(world.time * 12) % 2 === 0) ctx.globalAlpha = 0.35;
  ctx.fillStyle = 'rgba(35, 32, 56, 0.18)';
  ctx.beginPath();
  ctx.ellipse(2, 26, 26, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.planeBody;
  ctx.beginPath();
  ctx.moveTo(34, 0);
  ctx.lineTo(-26, -16);
  ctx.lineTo(-12, 0);
  ctx.lineTo(-26, 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = palette.planeShade;
  ctx.beginPath();
  ctx.moveTo(34, 0);
  ctx.lineTo(-12, 0);
  ctx.lineTo(-26, 16);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(35, 32, 56, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(34, 0);
  ctx.lineTo(-12, 0);
  ctx.stroke();
  ctx.fillStyle = palette.planeAccent;
  ctx.beginPath();
  ctx.moveTo(34, 0);
  ctx.lineTo(8, -6);
  ctx.lineTo(8, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
