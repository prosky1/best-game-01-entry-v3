// Paper Pilot v3 — the collectibles: sun shards, the per-zone
// counters the campaign is scored on. Each zone hides 12 shards in
// short trails; a shard is worth 25 points and one tick of the zone's
// "✦ n/12" counter, shown in the HUD, the level select and the win
// screen. Rings stay the combo mechanic; shards are the collection
// mechanic. All randomness comes from the world's seeded stream.

import { RULES } from './config.js';
import { range } from './random.js';

// A short trail of shards, arcing gently — the same shape the old
// star trails had, so the pilot's steering still works.
export function layShardTrail(world, baseX, baseY) {
  for (let i = 0; i < 5; i++) {
    world.shards.push({
      x: baseX + i * 46,
      y: baseY + Math.sin(i * 0.9) * 26,
      taken: false,
      phase: world.rng() * 6.28,
    });
  }
}

// Fly through a shard to take it: +25 points, one tick of the counter.
// Returns the shards taken this frame, so the caller can play the
// float text, the burst and the sound for each one.
export function collectShards(world, planeScreenX) {
  const taken = [];
  for (const shard of world.shards) {
    const sx = shard.x - world.scrollX;
    if (shard.taken) continue;
    if (Math.hypot(sx - planeScreenX, shard.y - world.plane.y) < 42) {
      shard.taken = true;
      world.shardsCollected += 1;
      world.shardScore += RULES.shardPoints;
      world.events.push({ type: 'shard' });
      taken.push({ shard, sx });
    }
  }
  return taken;
}

// Shards still out in the world, for the spawn budget: a zone hides
// exactly 12, so stop laying trails once all 12 are placed.
export function shardsPlaced(world) {
  return world.shards.length;
}
