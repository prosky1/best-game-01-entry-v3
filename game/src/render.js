// Paper Pilot v3 — the frame: the world first, then the HUD, then
// the screen that belongs to the current phase, then the hit flash on
// top. The same renderer draws live play and the staged screenshots,
// so a screenshot is always a real frame of the game. The world and
// sprite painting live in their own files; this file only assembles
// the frame — and, since v3, paints it as pixel art.
//
// THE PIXEL PIPELINE: everything is drawn onto a 320x180 offscreen
// canvas — one backdrop pixel per 4x4 block of the 1280x720 frame —
// and that canvas is blitted up with smoothing off, so every edge
// lands on the pixel grid. All painting code works in the usual
// 1280x720 VIEW coordinates; the offscreen context carries a 0.25
// scale, so nothing else had to change. Text never goes through the
// canvas font at this resolution (it would smear): every letter is
// drawn by the pixel font in font.js, one block at a time.

import { VIEW } from './config.js';
import { groundYAt } from './world.js';
import { paintBackdrop } from './backdrop.js';
import { paintRing, paintShard, paintStorm, paintBird, paintGate, paintPlane } from './sprites.js';
import { paintHawk } from './enemies.js';
import { paintParticles, paintFloats } from './particles.js';
import { paintHud } from './hud.js';
import {
  paintTitle,
  paintSelect,
  paintPaused,
  paintZoneComplete,
  paintCampaignWin,
  paintOver,
} from './screens.js';

// One pixel of the pixel-art frame is this many VIEW px across.
export const PIXEL = 4;
const PIXEL_W = VIEW.width / PIXEL; // 320
const PIXEL_H = VIEW.height / PIXEL; // 180

let pixelCanvas = null;
let pixelCtx = null;

// The offscreen 320x180 canvas, made once. In Node (where the game
// never renders) there is no document, so the caller falls back to
// drawing straight onto the given context.
function getPixelCtx() {
  if (typeof document === 'undefined') return null;
  if (!pixelCanvas) {
    pixelCanvas = document.createElement('canvas');
    pixelCanvas.width = PIXEL_W;
    pixelCanvas.height = PIXEL_H;
    pixelCtx = pixelCanvas.getContext('2d');
  }
  return pixelCtx;
}

// The hills the plane flies over: the ground, a lighter grass lip
// along the crest, and tiny flowers dotted on the slope. Drawn after
// the backdrop's near ridge, in front of it.
function paintHills(ctx, world) {
  const palette = world.palette;
  ctx.fillStyle = palette.hill;
  ctx.beginPath();
  ctx.moveTo(0, VIEW.height);
  for (let x = 0; x <= VIEW.width; x += 12) {
    ctx.lineTo(x, groundYAt(world, world.scrollX + x));
  }
  ctx.lineTo(VIEW.width, VIEW.height);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = palette.hillLip;
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let x = 0; x <= VIEW.width; x += 12) {
    const y = groundYAt(world, world.scrollX + x);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#ffd76a';
  for (let i = 0; i < 14; i++) {
    const wx = Math.floor(world.scrollX / 90) * 90 + i * 97;
    const sx = wx - world.scrollX;
    if (sx < -10 || sx > VIEW.width + 10) continue;
    const y = groundYAt(world, wx) + 14 + ((i * 37) % 26);
    ctx.fillRect(sx - 3, y - 3, 6, 6);
  }
}

// One soft white decor cloud: four puffs and a lavender underside.
function paintPuff(ctx, c, palette) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(c.scale, c.scale);
  ctx.fillStyle = palette.cloud;
  for (const [ox, oy, r] of [[-38, 6, 26], [0, -8, 32], [38, 6, 24], [0, 10, 26]]) {
    ctx.beginPath();
    ctx.arc(ox, oy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = palette.cloudShade;
  ctx.beginPath();
  ctx.ellipse(0, 16, 52, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// One frame, painted at pixel resolution and scaled up: the world
// first, then the HUD, then the screen that belongs to the current
// phase, then the hit flash on top.
export function drawFrame(ctx, world) {
  const off = getPixelCtx();
  // No offscreen canvas (Node): paint straight onto the given context.
  const g = off || ctx;
  if (off) {
    off.setTransform(1 / PIXEL, 0, 0, 1 / PIXEL, 0, 0);
    off.imageSmoothingEnabled = false;
  }
  g.save();
  if (world.shake > 0) {
    const s = world.shake * 9;
    g.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }
  // Dithered pixel sky, stars/fireflies, pixel sun, parallax ridges.
  paintBackdrop(g, world);
  for (const c of world.decorClouds) paintPuff(g, c, world.palette);
  paintGate(g, world);
  for (const ring of world.rings) paintRing(g, ring, world.scrollX, world.palette);
  for (const shard of world.shards) paintShard(g, shard, world.scrollX, world.time, world.palette);
  for (const cloud of world.clouds) paintStorm(g, cloud, world.scrollX, world.palette);
  for (const bird of world.birds) paintBird(g, bird, world.scrollX, world.time);
  for (const hawk of world.hawks) paintHawk(g, hawk, world.scrollX, world.time, world.palette);
  paintHills(g, world);
  paintPlane(g, world);
  paintParticles(g, world);
  paintFloats(g, world);
  g.restore();

  if (world.phase === 'playing' || world.phase === 'paused') paintHud(g, world);
  if (world.phase === 'title') paintTitle(g, world);
  if (world.phase === 'select') paintSelect(g, world);
  if (world.phase === 'paused') paintPaused(g);
  if (world.phase === 'over') paintOver(g, world);
  if (world.phase === 'zonecomplete') paintZoneComplete(g, world);
  if (world.phase === 'campaignwin') paintCampaignWin(g, world);

  if (world.flash > 0) {
    g.fillStyle = `rgba(255, 240, 200, ${world.flash * 0.5})`;
    g.fillRect(0, 0, VIEW.width, VIEW.height);
  }

  if (!off) return;
  // Scale the 320x180 frame up 4x onto the real canvas, smoothing
  // off, so the pixels stay square and crisp.
  ctx.save();
  const c = ctx.canvas;
  ctx.setTransform(c.width / VIEW.width, 0, 0, c.height / VIEW.height, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(pixelCanvas, 0, 0, VIEW.width, VIEW.height);
  ctx.restore();
}
