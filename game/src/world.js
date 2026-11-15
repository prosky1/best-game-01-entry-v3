// Paper Pilot v3 — the simulation: the plane, the sky it flies through,
// and everything it can meet. Pure state plus one step function; no
// drawing and no DOM here, so the same code drives live play and the
// staged screenshots. All randomness comes from the seeded stream in
// random.js, so a seeded run always plays out the same way.
//
// v3: one world is one zone flight. A zone is 750 m of its own themed
// sky (see zones.js); flying through its gate clears the zone, and the
// fourth zone's gate is the Sun Gate, which wins the campaign. Rings
// still pay the combo; sun shards (collectibles.js) are the per-zone
// counters, 12 per zone; paper hawks (enemies.js) dive at the plane
// from zone 2 on.

// World units are pixels of track; 10 px of track is one metre.
export const PX_PER_METRE = 10;

import { VIEW, PLANE, RULES, SPAWN } from './config.js';
import { zoneDef, SHARDS_PER_ZONE } from './zones.js';
import { themeForZone } from './themes.js';
import { makeRng, range, pick, chance } from './random.js';
import { layShardTrail, collectShards, shardsPlaced } from './collectibles.js';
import { layHawk, stepHawks } from './enemies.js';

// A fresh world for one zone: title screen, plane parked mid-sky,
// nothing spawned yet except the decor clouds drifting behind it.
export function createWorld(seed, zoneId = 0) {
  const rng = makeRng(seed);
  const zone = zoneDef(zoneId);
  const world = {
    seed,
    rng,
    zone: zoneId,
    zoneDef: zone,
    palette: themeForZone(zoneId),
    phase: 'title',
    time: 0,
    scrollX: 0,
    speed: PLANE.baseSpeed + zone.speedBonus,
    distance: 0,
    score: 0,
    ringScore: 0,
    shardScore: 0,
    ringsCollected: 0,
    shardsCollected: 0,
    combo: 0,
    maxCombo: 0,
    hearts: RULES.hearts,
    hits: 0, // hits taken this zone run (falls: ground, storm, bird, hawk)
    overReason: null, // 'hearts' or 'gate' — how a lost run ended
    level: 1, // 1, then 2 past the zone's halfway mark
    plane: { y: VIEW.height * 0.45, vy: 0, angle: 0, invulnerable: 0 },
    rings: [],
    shards: [],
    clouds: [],
    birds: [],
    hawks: [], // paper hawks: the diving enemy, from zone 2 on
    particles: [],
    floats: [],
    decorClouds: [],
    spawnTimer: 1.2,
    stormTimer: zone.stormFirstDelay,
    birdTimer: zone.birdFirstDelay,
    hawkTimer: zone.hawkFirstDelay,
    wind: { strength: 0, target: 0, timer: 5, direction: 1, active: 0 },
    gate: { x: zone.lengthMetres * PX_PER_METRE, passed: false, won: false },
    gateBonus: 0,
    banner: null,
    bannerTimer: 0,
    shake: 0,
    flash: 0,
    best: 0, // best score for this zone (from the save)
    save: null, // the campaign save, attached by main.js / shots.js
    campaignStats: null, // per-zone results, filled on a campaign win
    events: [],
    // Seeded phases for the parallax ridges and the rolling hills.
    ridgeFar: [rng() * 6.28, rng() * 6.28, rng() * 6.28],
    ridgeNear: [rng() * 6.28, rng() * 6.28, rng() * 6.28],
    hillPhase: [rng() * 6.28, rng() * 6.28],
  };
  for (let i = 0; i < 9; i++) {
    world.decorClouds.push({
      x: rng() * VIEW.width,
      y: range(rng, 50, 300),
      scale: range(rng, 0.6, 1.5),
      drift: range(rng, 6, 18),
    });
  }
  return world;
}

// (Re)start a zone run: a fresh world on the next seed, keeping the
// zone's best score, and straight into play. The seed advances so no
// two runs share the same sky.
export function startRun(world, zoneId = world.zone) {
  const keepBest = world.best;
  const keepSave = world.save;
  const keepCampaign = world.campaignStats;
  const fresh = createWorld(world.seed + 1, zoneId);
  Object.assign(world, fresh, { best: keepBest, save: keepSave, campaignStats: keepCampaign });
  world.phase = 'playing';
  world.events.push({ type: 'start' });
}

// The plane's fixed spot on the screen, as a fraction of the width.
function planeScreenX() {
  return VIEW.width * VIEW.planeX;
}

// Rolling hills: the ground the plane must stay above. Two slow sine
// waves make gentle, readable slopes — never a cliff.
export function groundYAt(world, worldX) {
  const [p1, p2] = world.hillPhase;
  const bump =
    Math.sin(worldX * 0.0016 + p1) * 20 + Math.sin(worldX * 0.0042 + p2) * 10;
  return VIEW.height - VIEW.groundHeight + bump;
}

// Cruise speed grows a little past the halfway mark, and with the zone.
function cruiseForLevel(world) {
  return PLANE.baseSpeed + world.zoneDef.speedBonus + (world.level - 1) * PLANE.speedPerLevel;
}

// One ring pattern: a line, an arc, a slalom or a staircase of hoops.
function layRingPattern(world, baseX, baseY) {
  const pattern = pick(world.rng, ['line', 'arc', 'slalom', 'stair']);
  const ys = [];
  if (pattern === 'line') {
    for (let i = 0; i < 3; i++) ys.push(baseY);
  } else if (pattern === 'arc') {
    for (let i = 0; i < 4; i++) ys.push(baseY + Math.sin((i / 3) * Math.PI) * -90);
  } else if (pattern === 'slalom') {
    for (let i = 0; i < 4; i++) ys.push(baseY + (i % 2 === 0 ? -70 : 70));
  } else {
    for (let i = 0; i < 3; i++) ys.push(baseY - i * 70);
  }
  ys.forEach((y, i) => {
    world.rings.push({
      x: baseX + i * 150,
      y: Math.max(90, Math.min(560, y)),
      r: 46,
      collected: false,
      missed: false,
    });
  });
}

// One storm cloud: wide, dark, raining, with a lightning flash timer.
function layStorm(world, baseX) {
  world.clouds.push({
    x: baseX,
    y: range(world.rng, 110, 520),
    w: range(world.rng, 150, 210),
    h: range(world.rng, 70, 100),
    drift: range(world.rng, 8, 22),
    flashTimer: range(world.rng, 0.5, 2.5),
    seed: world.rng() * 10,
  });
}

// One bird, flapping on a sine path.
function layBird(world, baseX) {
  const y = range(world.rng, 120, 520);
  world.birds.push({
    x: baseX,
    y,
    baseY: y,
    phase: world.rng() * 6.28,
    flap: 0,
  });
}

// A spray of particles (ring bursts, hit debris, gate fireworks).
function spray(world, x, y, color, count, speed) {
  for (let i = 0; i < count; i++) {
    const a = world.rng() * Math.PI * 2;
    const v = range(world.rng, speed * 0.4, speed);
    world.particles.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: range(world.rng, 0.4, 0.9),
      maxLife: 0.9,
      size: range(world.rng, 2, 5),
      color,
    });
  }
}

// A floating score popup that rises and fades.
function floatText(world, x, y, text, color) {
  world.floats.push({ x, y, text, color, life: 1.1 });
}

// The plane took a hit: lose a heart, break the combo, flash and
// shake, and go invulnerable for a couple of seconds. At zero hearts
// the run ends and the score is banked.
function damagePlane(world, x, y, reason) {
  const plane = world.plane;
  if (plane.invulnerable > 0 || world.phase !== 'playing') return;
  world.hearts -= 1;
  world.hits += 1;
  world.combo = 0;
  plane.invulnerable = RULES.invulnerableSeconds;
  world.shake = 1;
  world.flash = 0.5;
  spray(world, x, y, '#ff8a8a', 18, 260);
  world.events.push({ type: 'hit', reason, hearts: world.hearts });
  if (world.hearts <= 0) {
    world.phase = 'over';
    world.overReason = 'hearts';
    world.score = totalScore(world);
    if (world.score > world.best) world.best = world.score;
    world.events.push({ type: 'over', score: world.score, best: world.best, reason: 'hearts' });
  }
}

// Distance flown plus rings plus shards plus the gate bonus, if won.
export function totalScore(world) {
  return (
    Math.floor(world.distance) +
    world.ringScore +
    world.shardScore +
    world.gateBonus
  );
}

// The zone run's result, for the save and the results screens.
export function zoneResult(world) {
  return {
    zone: world.zone,
    score: totalScore(world),
    shards: world.shardsCollected,
    hits: world.hits,
    time: Math.round(world.time * 10) / 10,
    rings: world.ringsCollected,
    maxCombo: world.maxCombo,
  };
}

// One frame of the game. Returns the events of this frame (rings,
// shards, hits, level-ups, gate clears, win/over) so the caller can
// play sounds.
export function stepWorld(world, input, dt, sounds) {
  world.time += dt;
  world.events.length = 0;
  if (world.phase === 'paused') return world.events;
  if (world.phase === 'title' || world.phase === 'select') {
    driftScenery(world, dt);
    return world.events;
  }
  if (world.phase === 'over' || world.phase === 'zonecomplete' || world.phase === 'campaignwin') {
    driftScenery(world, dt);
    ageParticles(world, dt);
    ageFloats(world, dt);
    if (world.shake > 0) world.shake = Math.max(0, world.shake - dt * 1.6);
    if (world.flash > 0) world.flash = Math.max(0, world.flash - dt * 1.4);
    return world.events;
  }

  // --- playing ---
  const plane = world.plane;
  // Halfway through the zone the wind picks up: faster, busier.
  const level = Math.floor(world.distance / (world.zoneDef.lengthMetres / 2)) + 1;
  if (level !== world.level) {
    world.level = level;
    world.speed = cruiseForLevel(world);
    world.banner = `LEVEL ${level} — WIND PICKS UP`;
    world.bannerTimer = 2.2;
    world.events.push({ type: 'level', level });
  }
  if (world.bannerTimer > 0) world.bannerTimer -= dt;

  // Wind gusts: a telegraphed push up or down, announced in the HUD.
  const wind = world.wind;
  wind.timer -= dt;
  if (wind.timer <= 0) {
    wind.direction = chance(world.rng, 0.5) ? 1 : -1;
    wind.target = range(world.rng, 130, world.zoneDef.gustMax);
    wind.active = range(world.rng, 1.4, 2.4);
    wind.timer = range(world.rng, 6, 11);
    world.events.push({ type: 'gust', direction: wind.direction });
  }
  if (wind.active > 0) {
    wind.active -= dt;
    wind.strength = wind.target * wind.direction;
  } else {
    wind.strength *= 0.92;
  }

  // Plane physics: hold to climb, release to glide. A gust pushes too.
  const lift = input.liftHeld;
  plane.vy += PLANE.gravity * dt;
  if (lift) plane.vy += PLANE.liftAccel * dt;
  plane.vy += wind.strength * dt;
  plane.vy = Math.max(PLANE.maxClimb, Math.min(PLANE.maxFall, plane.vy));
  plane.y += plane.vy * dt;
  if (plane.y < VIEW.ceiling) {
    plane.y = VIEW.ceiling;
    plane.vy = Math.max(0, plane.vy);
  }
  const ground = groundYAt(world, world.scrollX + planeScreenX());
  if (plane.y + PLANE.radius > ground) {
    plane.y = ground - PLANE.radius;
    plane.vy = -320;
    damagePlane(world, planeScreenX(), plane.y, 'ground');
  }
  plane.angle = Math.max(-0.55, Math.min(0.6, plane.vy / 700));
  if (plane.invulnerable > 0) plane.invulnerable -= dt;

  world.scrollX += world.speed * dt;
  world.distance = world.scrollX / PX_PER_METRE;
  world.score = totalScore(world);

  // Spawning ahead of the plane, just off the right edge.
  const ahead = world.scrollX + VIEW.width + 140;
  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0) {
    world.spawnTimer = Math.max(SPAWN.intervalMin, SPAWN.interval - world.level * 0.05);
    const roll = world.rng();
    const y = range(world.rng, 130, 520);
    if (roll < 0.5) layRingPattern(world, ahead, y);
    // Shard trails only while the zone still has shards to hide:
    // exactly 12 per zone, no more.
    else if (roll < 0.78 && shardsPlaced(world) < SHARDS_PER_ZONE) layShardTrail(world, ahead, y);
    else layRingPattern(world, ahead, y);
  }
  world.stormTimer -= dt * (1 + world.level * 0.12);
  if (world.stormTimer <= 0) {
    world.stormTimer = 60 / (world.zoneDef.stormBase + world.level * world.zoneDef.stormPerLevel);
    layStorm(world, ahead + range(world.rng, 0, 300));
  }
  world.birdTimer -= dt;
  if (world.birdTimer <= 0) {
    world.birdTimer = 60 / (world.zoneDef.birdBase + world.level * world.zoneDef.birdPerLevel);
    layBird(world, ahead + range(world.rng, 0, 200));
  }
  // Paper hawks, from zone 2 on: an active enemy that dives at the
  // plane, so the sky has something hunting back.
  world.hawkTimer -= dt;
  if (world.hawkTimer <= 0 && world.zoneDef.hawkBase > 0) {
    world.hawkTimer = 60 / (world.zoneDef.hawkBase + world.level * world.zoneDef.hawkPerLevel);
    layHawk(world, ahead + range(world.rng, 0, 200));
  }

  // The zone gate: crossing its arch clears the zone; the fourth
  // zone's gate is the Sun Gate, and crossing it wins the campaign.
  // Flying past the gate outside its arch misses it — the zone run
  // ends there, instead of dragging on with no win left in it.
  const gate = world.gate;
  if (!gate.passed && world.scrollX + planeScreenX() >= gate.x) {
    gate.passed = true;
    if (plane.y > 70 && plane.y < 650) {
      gate.won = true;
      world.gateBonus = world.zoneDef.gateBonus;
      world.score = totalScore(world);
      if (world.score > world.best) world.best = world.score;
      if (world.zone >= 3) {
        world.phase = 'campaignwin';
        world.events.push({ type: 'campaignwin', score: world.score, best: world.best });
      } else {
        world.phase = 'zonecomplete';
        world.events.push({ type: 'zonecomplete', score: world.score, best: world.best });
      }
      spray(world, planeScreenX(), plane.y, '#ffd76a', 40, 320);
    } else {
      world.phase = 'over';
      world.overReason = 'gate';
      world.score = totalScore(world);
      if (world.score > world.best) world.best = world.score;
      world.events.push({ type: 'over', score: world.score, best: world.best, reason: 'gate' });
    }
  }

  const px = planeScreenX();
  // Rings: fly through the hoop. Each one grows the combo (up to x5)
  // and pays ring points times the combo.
  for (const ring of world.rings) {
    const sx = ring.x - world.scrollX;
    if (ring.collected || ring.missed) continue;
    const dx = sx - px;
    const dy = ring.y - plane.y;
    if (Math.hypot(dx, dy) < ring.r - 8) {
      ring.collected = true;
      world.ringsCollected += 1;
      world.combo = Math.min(world.combo + 1, RULES.maxCombo);
      world.maxCombo = Math.max(world.maxCombo, world.combo);
      const points = RULES.ringPoints * world.combo;
      world.ringScore += points;
      floatText(world, sx, ring.y - 30, `+${points}`, '#ffc93c');
      spray(world, sx, ring.y, '#ffd76a', 14, 200);
      world.events.push({ type: 'ring', combo: world.combo, points });
    } else if (sx < px - RULES.missSlack) {
      ring.missed = true;
      if (world.combo > 0) floatText(world, sx, ring.y - 30, 'COMBO LOST', '#ff8a8a');
      world.combo = 0;
    }
  }
  // Sun shards: small, quick points and one tick of the zone counter.
  for (const { shard, sx } of collectShards(world, px)) {
    floatText(world, sx, shard.y - 24, `+${RULES.shardPoints}`, '#ffe66d');
    spray(world, sx, shard.y, '#ffe66d', 8, 140);
  }
  // Storm clouds: a soft ellipse; flying into one costs a heart.
  for (const cloud of world.clouds) {
    const sx = cloud.x - world.scrollX;
    cloud.flashTimer -= dt;
    if (cloud.flashTimer <= 0) {
      cloud.flashTimer = range(world.rng, 1.2, 3.2);
      cloud.flash = 0.18;
    }
    if (cloud.flash > 0) cloud.flash -= dt;
    const dx = (sx - px) / (cloud.w / 2);
    const dy = (cloud.y - plane.y) / (cloud.h / 2);
    if (dx * dx + dy * dy < 1) damagePlane(world, px, plane.y, 'storm');
  }
  // Birds drift left on their own and bob up and down.
  for (const bird of world.birds) {
    bird.phase += dt * 2.2;
    bird.flap += dt * 9;
    bird.y = bird.baseY + Math.sin(bird.phase) * 34;
    const sx = bird.x - world.scrollX - world.time * 40;
    if (Math.hypot(sx - px, bird.y - plane.y) < 40) damagePlane(world, px, bird.y, 'bird');
  }
  // Paper hawks: dive at the plane when it is in range, and cost a
  // heart on contact like every other hazard.
  for (const hawk of stepHawks(world, dt)) {
    damagePlane(world, px, hawk.y, 'hawk');
  }

  // Cull what drifted behind the left edge.
  const behind = world.scrollX - 260;
  world.rings = world.rings.filter((r) => r.x > behind && !(r.collected && r.x < world.scrollX - 100));
  world.shards = world.shards.filter((s) => s.x > behind);
  world.clouds = world.clouds.filter((c) => c.x > behind);
  world.birds = world.birds.filter((b) => b.x - world.time * 40 > behind);
  world.hawks = world.hawks.filter((h) => h.x > behind);

  // Trail puffs behind the plane, and gust streaks in a gust.
  if (world.time - (world.lastTrail || 0) > 0.03) {
    world.lastTrail = world.time;
    world.particles.push({
      x: px - 34,
      y: plane.y + 4,
      vx: -70,
      vy: range(world.rng, -8, 8),
      life: 0.5,
      maxLife: 0.5,
      size: range(world.rng, 2, 4),
      color: 'rgba(255,255,255,0.7)',
    });
  }
  if (wind.active > 0 && world.rng() < 0.5) {
    world.particles.push({
      x: range(world.rng, 0, VIEW.width),
      y: range(world.rng, 60, 640),
      vx: -420,
      vy: wind.direction * 120,
      life: 0.5,
      maxLife: 0.5,
      size: 2,
      color: 'rgba(255,255,255,0.45)',
    });
  }

  driftScenery(world, dt);
  ageParticles(world, dt);
  ageFloats(world, dt);
  if (world.shake > 0) world.shake = Math.max(0, world.shake - dt * 1.6);
  if (world.flash > 0) world.flash = Math.max(0, world.flash - dt * 1.4);
  if (sounds) sounds.setWind(Math.min(1, world.speed / 420));
  return world.events;
}

// Decor clouds drift left and wrap around.
function driftScenery(world, dt) {
  for (const c of world.decorClouds) {
    c.x -= (c.drift + world.speed * 0.04) * dt;
    if (c.x < -180) {
      c.x = VIEW.width + 120;
      c.y = range(world.rng, 50, 300);
    }
  }
}

// Particles move, age and die.
function ageParticles(world, dt) {
  for (const p of world.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  world.particles = world.particles.filter((p) => p.life > 0);
}

// Floating texts rise and fade.
function ageFloats(world, dt) {
  for (const f of world.floats) {
    f.y -= 34 * dt;
    f.life -= dt;
  }
  world.floats = world.floats.filter((f) => f.life > 0);
}
