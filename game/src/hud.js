// Paper Pilot v3 — the HUD: everything the player needs mid-flight,
// and nothing they don't. Two short bars, in the pixel font, so the
// frame stays readable at 320x180: score, zone and distance top-left;
// hearts and best top-right; the combo badge by the plane; gust
// warnings, level banners and the early-run hint across the middle.
// The v2 heat log called the old gameplay shot "busier and less
// legible", so v3 cut the HUD down: two lines per bar, no third line,
// no overlapping pills. The shard counter ("n/12") is the zone's
// collectible tally — the number the campaign is scored on.

import { VIEW } from './config.js';
import { SHARDS_PER_ZONE } from './zones.js';
import { drawPixelText, drawIcon, textWidth } from './font.js';

// A rounded rectangle path, reused by the HUD panels.
function pill(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function paintHud(ctx, world) {
  const palette = world.palette;
  // Left bar: the score, big, on the first line; zone and distance on
  // the second; rings and the shard tally on the first line's right.
  // The score line and the zone line get a full gap between them: at
  // scale 5 the score's cap is 35 px tall, and the first v3 play
  // screenshot showed the two lines touching.
  ctx.fillStyle = palette.hudPanel;
  pill(ctx, 18, 16, 480, 88, 14);
  ctx.fill();
  drawPixelText(ctx, String(world.score).padStart(6, '0'), 34, 24, 5, '#ffffff', 'left');
  drawPixelText(
    ctx,
    `ZONE ${world.zone + 1} ${world.zoneDef.short} - ${Math.floor(world.distance)}/${world.zoneDef.lengthMetres}M`,
    34,
    70,
    2.5,
    '#ffe9a8',
    'left',
  );
  // Rings + shard tally, right-aligned on the score line: "RINGS 12"
  // then a shard icon and "5/12", ending at the panel's right edge.
  const ringsText = `RINGS ${world.ringsCollected}`;
  const shardText = `${world.shardsCollected}/${SHARDS_PER_ZONE}`;
  const unitW =
    textWidth(ringsText, 2.5) + 16 + 7 * 2.5 + 8 + textWidth(shardText, 2.5);
  let rx = 482 - unitW;
  drawPixelText(ctx, ringsText, rx, 34, 2.5, '#cfe3ff', 'left');
  rx += textWidth(ringsText, 2.5) + 16;
  drawIcon(ctx, 'shard', rx + (7 * 2.5) / 2, 34 + (7 * 2.5) / 2, 2.5, '#ffe66d');
  rx += 7 * 2.5 + 8;
  drawPixelText(ctx, shardText, rx, 34, 2.5, '#ffe66d', 'left');

  // Right bar: three pixel hearts, and the best score under them.
  ctx.fillStyle = palette.hudPanel;
  pill(ctx, VIEW.width - 248, 16, 230, 88, 14);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    drawIcon(
      ctx,
      'heart',
      VIEW.width - 216 + i * 36,
      48,
      2.5,
      i < world.hearts ? '#ff5d7a' : 'rgba(255,255,255,0.25)',
    );
  }
  drawPixelText(ctx, `BEST ${Math.max(world.best, world.score)}`, VIEW.width - 34, 66, 2.5, '#ffffff', 'right');

  // The combo badge by the plane: a gold pill, sized to its text.
  if (world.combo >= 2) {
    const px = VIEW.width * 0.3;
    const label = `COMBO X${world.combo}`;
    const w = textWidth(label, 4) + 28;
    ctx.save();
    ctx.translate(px + 70, world.plane.y - 64);
    ctx.fillStyle = 'rgba(255, 201, 60, 0.92)';
    pill(ctx, -w / 2, -20, w, 36, 18);
    ctx.fill();
    drawPixelText(ctx, label, 0, -12, 4, '#232038', 'center');
    ctx.restore();
  }

  // Gust warning: a pixel arrow and the direction, centred.
  if (world.wind.active > 0) {
    const down = world.wind.direction > 0;
    const label = down ? 'GUST DOWN' : 'GUST UP';
    const w = textWidth(label, 4) + 7 * 4 + 12;
    const x0 = VIEW.width / 2 - w / 2;
    drawIcon(ctx, down ? 'down' : 'up', x0 + (7 * 4) / 2, 132, 4, '#ffffff');
    drawPixelText(ctx, label, x0 + 7 * 4 + 12, 118, 4, '#ffffff', 'left');
  }

  // Level banner, centred, in the pixel font.
  if (world.bannerTimer > 0) {
    ctx.globalAlpha = Math.min(1, world.bannerTimer);
    drawPixelText(ctx, world.banner, VIEW.width / 2, 176, 5, '#ffffff', 'center');
    ctx.globalAlpha = 1;
  }

  // The early-run hint, one short line near the bottom.
  if (world.phase === 'playing' && world.distance < 60) {
    drawPixelText(ctx, 'HOLD MOUSE / SPACE TO CLIMB - RELEASE TO GLIDE', VIEW.width / 2, VIEW.height - 120, 3, 'rgba(255,255,255,0.95)', 'center');
  }
}
