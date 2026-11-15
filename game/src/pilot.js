// Paper Pilot v3 — the scripted pilot: good enough to play the game
// the way a careful player does. It looks ahead before it dives: it
// climbs early when the hills are coming up under it (judging by where
// the plane will be, not where it is), steers around storms and birds,
// and otherwise threads the nearest ring ahead, or cruises mid-sky.
// The same pilot drives the staged screenshots and the headless win
// checks, so a screenshot is a real frame of a real run.

import { VIEW } from './config.js';
import { stepWorld, groundYAt } from './world.js';

const DT = 1 / 60;
const PLANE_X = VIEW.width * VIEW.planeX;

export function pilotPlane(world) {
  const y = world.plane.y;
  const vy = world.plane.vy;
  const ground = groundYAt(world, world.scrollX + PLANE_X);
  // Climb while there is still room to stop the fall: the plane needs
  // roughly vy squared over twice its climb authority to level out.
  if (y + vy * 0.35 > ground - 70) return true;
  if (y < 80) return false;
  // The zone gate is near: aim for the middle of the arch (y 360) so
  // the run clears instead of flying past it above or below.
  const gateSx = world.gate.x - world.scrollX;
  if (!world.gate.passed && gateSx > PLANE_X && gateSx < PLANE_X + 450) {
    return y > 370;
  }
  for (const cloud of world.clouds) {
    const sx = cloud.x - world.scrollX;
    if (sx > PLANE_X - 60 && sx < PLANE_X + 300) {
      const dy = cloud.y - y;
      if (Math.abs(dy) < cloud.h / 2 + 70) return dy > 0;
    }
  }
  for (const hawk of world.hawks) {
    const sx = hawk.x - world.scrollX;
    if (sx > PLANE_X - 40 && sx < PLANE_X + 460) {
      // A diving hawk steers at the plane, so give it a wider berth
      // than a drifting bird — and a bigger one still while it dives.
      const margin = hawk.state === 'dive' ? 130 : 80;
      if (Math.abs(hawk.y - y) < margin) return hawk.y > y;
    }
  }
  for (const bird of world.birds) {
    const sx = bird.x - world.scrollX - world.time * 40;
    if (sx > PLANE_X && sx < PLANE_X + 220 && Math.abs(bird.y - y) < 80) {
      return bird.y > y;
    }
  }
  const ahead = world.rings.filter(
    (r) => !r.collected && !r.missed && r.x - world.scrollX > 40,
  );
  if (ahead.length) return y > ahead[0].y + 6;
  return y > VIEW.height * 0.45;
}

// Step a world forward with the pilot until the stop condition says
// enough, or the run ends, or the step budget runs out.
export function flyUntil(world, seconds, stop) {
  const steps = Math.round(seconds / DT);
  for (let i = 0; i < steps; i++) {
    stepWorld(world, { liftHeld: pilotPlane(world) }, DT, null);
    if (world.phase !== 'playing') break;
    if (stop && stop(world)) break;
  }
  return world;
}

// A doomed pilot that never lifts: the plane sinks onto the hills
// until its hearts run out and the run ends for real.
export function neverLifts() {
  return false;
}
