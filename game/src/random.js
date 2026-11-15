// Paper Pilot — one small seeded random stream for the whole game.
// A seeded run always plays out the same way, so a screenshot staged
// with a seed renders the same sky every time and a replay of the same
// inputs always flies the same run. Nothing here reads Math.random.

// mulberry32: a tiny, well-behaved 32-bit generator. The seed is kept
// as an unsigned 32-bit integer and advanced by a fixed odd constant.
export function makeRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

// A float in [min, max): the workhorse for positions and sizes.
export function range(rng, min, max) {
  return min + rng() * (max - min);
}

// One item from a list, uniformly: used for the ring patterns.
export function pick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}

// True with probability p: used for the wind's coin flips.
export function chance(rng, p) {
  return rng() < p;
}
