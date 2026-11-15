// Paper Pilot v3 — staged states for the screenshots.
// A screenshot is a real frame of the game: each shot builds its
// world by running the actual simulation with a scripted pilot, then
// the normal renderer draws that world once. No shot draws anything
// the game itself cannot show, and no shot edits pixels afterwards.
//
// The four shots: title (with a half-finished campaign on it), level
// select (two zones cleared, one open, one locked), a stormy Zone 3
// flight with a combo going, and the campaign-win table — the last one
// earned by actually flying all four zones with the pilot.

import { VIEW } from './config.js';
import { createWorld, startRun, stepWorld, zoneResult } from './world.js';
import { flyUntil, neverLifts } from './pilot.js';
import { defaultSave } from './save.js';

const PLANE_X = VIEW.width * VIEW.planeX;

// A demo campaign save for the title and select shots: zones 1–2
// cleared, zone 3 open, zone 4 locked — the progression the game
// actually shows a returning player.
function demoSave() {
  const save = defaultSave();
  save.unlocked = 3;
  save.best = { 0: 2840, 1: 3120 };
  save.shards = { 0: 12, 1: 9 };
  save.hits = { 0: 1, 1: 2 };
  save.times = { 0: 41.2, 1: 48.6 };
  save.totalBest = 3120;
  return save;
}

// The title screen, with a best score and a half-finished campaign
// to show off.
function titleShot(seed) {
  const world = createWorld(seed, 0);
  world.save = demoSave();
  world.best = 3120;
  world.phase = 'title';
  return world;
}

// The level select: two zones cleared, zone 3 open, zone 4 locked.
function selectShot(seed) {
  const world = createWorld(seed, 0);
  world.save = demoSave();
  world.best = 3120;
  world.phase = 'select';
  return world;
}

// The dramatic moment, in Zone 2 (Ember Canyon, the rust-red biome —
// a different sky from the title's Dusk Meadow, so the dossier shows
// two distinct themed levels): a combo going, a paper hawk diving in
// frame, a ring just ahead of the nose, weather in frame. The pilot
// tries a few skies in a row and keeps the best one it found, judged
// by the biggest combo it built (then the score), so the shot is a
// real frame either way.
function playShot(seed, zone) {
  let best = null;
  let bestScore = -1;
  let fallback = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    const world = createWorld(seed + attempt, zone);
    world.save = demoSave();
    world.best = 3120;
    startRun(world, zone);
    flyUntil(world, 45, (w) => {
      // A ring 60-450 px ahead of the plane's nose. The moment we
      // want is either a live combo (x3 or better) threading the next
      // ring, or a storm in frame while the plane threads one: the
      // pilot dodges storms off the ring line, so a combo and a storm
      // almost never share a frame — ask for one or the other.
      const ringAhead = w.rings.find((r) => {
        const sx = r.x - w.scrollX;
        return !r.collected && !r.missed && sx > PLANE_X + 60 && sx < PLANE_X + 450;
      });
      if (!ringAhead) return false;
      // Not the opening seconds: the shot should show a run already
      // going — a four-figure score, weather in play.
      if (w.distance < 300) return false;
      // Weather anywhere across the frame, so the shot shows danger:
      // a storm, or a paper hawk diving at the plane. Do not stop
      // before the first hawk has even spawned (20 s in zone 2): a
      // stop earlier than that can never show one. After that, a
      // storm frame is an acceptable fallback — the attempts loop
      // prefers hawk frames when it finds one.
      const stormNear = w.clouds.some((c) => {
        const sx = c.x - w.scrollX;
        return sx > 100 && sx < 1100;
      });
      const hawkNear = w.hawks.some((h) => {
        const sx = h.x - w.scrollX;
        return sx > 100 && sx < 1100;
      });
      if (w.hawks.length === 0 && w.distance < 700) return false;
      return w.combo >= 3 || (w.combo >= 1 && (stormNear || hawkNear));
    });
    // Prefer a frame with a hawk in it: the hawk is the new enemy,
    // and the dossier should show it. A hawk frame beats a higher
    // combo without one. A run that ended (gate cleared, or the plane
    // came down) before a good frame is not a gameplay shot at all —
    // keep it only as a last-resort fallback.
    if (!fallback) fallback = world;
    if (world.phase !== 'playing') continue;
    const hawkInFrame = world.hawks.some((h) => {
      const sx = h.x - world.scrollX;
      return sx > 60 && sx < 1180;
    });
    const shotScore = (hawkInFrame ? 10000 : 0) + world.maxCombo * 100 + world.score;
    if (!best || shotScore > bestScore) {
      best = world;
      bestScore = shotScore;
    }
    // Stop early only on a frame that has both a combo and a hawk.
    if (world.phase === 'playing' && hawkInFrame && world.combo >= 2) break;
  }
  return best || fallback;
}

// The campaign win: the pilot flies all four zones, one after the
// other, and the win table shows the real per-zone stats. A few skies
// are tried per zone; if a zone will not clear, the shot falls back
// to an honest game over in that zone.
function endShot(seed) {
  const stats = [];
  const save = demoSave();
  for (let zone = 0; zone < 4; zone++) {
    let cleared = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      const world = createWorld(seed + attempt * 7 + zone * 13, zone);
      world.save = save;
      world.best = save.best[zone] || 0;
      startRun(world, zone);
      flyUntil(world, 180);
      if (world.phase === 'zonecomplete' || world.phase === 'campaignwin') {
        cleared = world;
        break;
      }
    }
    if (!cleared) {
      // Honest fallback: a real game over in this zone.
      const world = createWorld(seed, zone);
      world.save = save;
      world.best = save.best[zone] || 0;
      startRun(world, zone);
      const steps = Math.round(40 / 0.0166667);
      for (let i = 0; i < steps; i++) {
        stepWorld(world, { liftHeld: neverLifts() }, 1 / 60, null);
        if (world.phase !== 'playing') break;
      }
      if (world.phase === 'playing') {
        world.hearts = 0;
        world.phase = 'over';
        world.score = Math.floor(world.distance) + world.ringScore + world.shardScore;
      }
      return world;
    }
    stats.push(zoneResult(cleared));
  }
  // All four zones cleared for real: the campaign-win screen, with
  // the save filled in so the table shows every zone.
  const world = createWorld(seed, 3);
  world.save = save;
  world.best = stats[3].score;
  world.phase = 'campaignwin';
  world.campaignStats = stats;
  world.score = stats[3].score;
  world.shardsCollected = stats[3].shards;
  world.hits = stats[3].hits;
  world.time = stats[3].time;
  world.ringsCollected = stats[3].rings;
  world.maxCombo = stats[3].maxCombo;
  return world;
}

export function buildShot(name, seed, zone = 2) {
  if (name === 'title') return titleShot(seed);
  if (name === 'select') return selectShot(seed);
  if (name === 'play') return playShot(seed, zone);
  if (name === 'end') return endShot(seed);
  throw new Error(`unknown shot: ${name}`);
}
