// Paper Pilot v3 — the paper hawks: the new enemy the v2 heat log
// asked for. v2 lost all five matches to Mosslight on look and on
// variety — "enemies, spikes, two distinct themed levels" against our
// one gameplay scene of rings, storms and passive birds. The hawk is
// an active enemy: it cruises in from the right, and when the plane
// comes into range it folds its wings and dives at the plane's
// altitude, telegraphed by the dive itself and a red eye. The pilot
// (and the player) has to steer around it, which makes the moment-to-
// moment play denser: rings to thread, storms to dodge, hawks diving.
// Hawks appear from zone 2 on — zone 1 stays the gentle sky v2 had —
// and get more frequent as the zones get harder.

import { VIEW, PLANE } from './config.js';
import { range, chance } from './random.js';

const PLANE_X = VIEW.width * VIEW.planeX;

// One hawk, cruising in at the plane's height or a little off it, so
// the dive starts from somewhere the player can see coming.
export function layHawk(world, baseX) {
  const nearPlane = chance(world.rng, 0.6);
  const y = nearPlane
    ? Math.max(110, Math.min(560, world.plane.y + range(world.rng, -170, 170)))
    : range(world.rng, 120, 540);
  world.hawks.push({
    x: baseX,
    y,
    vy: 0,
    state: 'cruise', // 'cruise' until the plane is in range, then 'dive'
    flap: world.rng() * 6.28,
    seed: world.rng() * 10,
  });
}

// Hawks fly left faster than the world scrolls, and dive at the
// plane's altitude once it is in range. A dive levels off once the
// hawk has passed the plane, and a hawk that would hit the hills
// pulls up. Returns the hawks that touched the plane this frame.
export function stepHawks(world, dt) {
  const plane = world.plane;
  const hits = [];
  for (const hawk of world.hawks) {
    hawk.flap += dt * (hawk.state === 'dive' ? 16 : 9);
    // Cruise: straight left, a little faster than the scroll.
    hawk.x -= 60 * dt;
    const sx = hawk.x - world.scrollX;
    if (hawk.state === 'cruise' && sx > PLANE_X + 60 && sx < PLANE_X + 520) {
      if (Math.abs(hawk.y - plane.y) < 260) hawk.state = 'dive';
    }
    if (hawk.state === 'dive') {
      // Steer at the plane, but the turn is limited: a sharp climb or
      // dive by the plane still shakes it off.
      const want = (plane.y - hawk.y) * 2.4;
      hawk.vy += Math.max(-900 * dt, Math.min(900 * dt, want - hawk.vy));
      hawk.vy = Math.max(-260, Math.min(260, hawk.vy));
      hawk.y += hawk.vy * dt;
      if (sx < PLANE_X - 120) hawk.state = 'cruise';
    } else {
      hawk.vy *= 0.9;
      hawk.y += Math.sin(world.time * 2 + hawk.seed) * 12 * dt;
    }
    if (Math.hypot(sx - PLANE_X, hawk.y - plane.y) < PLANE.radius + 14) hits.push(hawk);
  }
  return hits;
}

// A paper hawk: a dark folded bird, bigger than the plain birds, with
// swept wings, a hooked beak and a red eye — readable at a glance as
// the thing that hunts the plane, not the thing that drifts past it.
export function paintHawk(ctx, hawk, scrollX, time, palette) {
  const sx = hawk.x - scrollX;
  if (sx < -80 || sx > VIEW.width + 80) return;
  const flap = Math.sin(hawk.flap) * 0.8;
  const diving = hawk.state === 'dive';
  ctx.save();
  ctx.translate(sx, hawk.y);
  ctx.rotate(diving ? Math.max(-0.5, Math.min(0.5, hawk.vy / 500)) : Math.sin(time + hawk.seed) * 0.06);
  // A little bigger than the plain birds, and every shape gets a pale
  // paper edge, so the hawk reads against dark hills as well as sky:
  // a dark bird on a dark ridge is invisible, and the hawk is the
  // thing the player must see coming.
  ctx.scale(1.3, 1.3);
  ctx.strokeStyle = 'rgba(232, 228, 255, 0.85)';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  // Swept wings: two folded-paper triangles, flapping hard in a dive.
  ctx.fillStyle = '#241f38';
  ctx.beginPath();
  ctx.moveTo(-6, -2);
  ctx.lineTo(-34, -30 - flap * 16);
  ctx.lineTo(-20, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-6, 4);
  ctx.lineTo(-30, 22 + flap * 12);
  ctx.lineTo(-16, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Body and tail: a long folded dart, darker underneath.
  ctx.fillStyle = '#2c2647';
  ctx.beginPath();
  ctx.moveTo(30, 0);
  ctx.lineTo(-18, -10);
  ctx.lineTo(-30, 0);
  ctx.lineTo(-18, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1d1838';
  ctx.beginPath();
  ctx.moveTo(30, 0);
  ctx.lineTo(-18, 0);
  ctx.lineTo(-30, 0);
  ctx.lineTo(-18, 10);
  ctx.closePath();
  ctx.fill();
  // Hooked beak, and the red eye that marks it as a hunter.
  ctx.fillStyle = '#2c2647';
  ctx.beginPath();
  ctx.moveTo(28, -4);
  ctx.lineTo(40, 0);
  ctx.lineTo(28, 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff5d5d';
  ctx.fillRect(20, -6, 6, 6);
  ctx.restore();
}
