// Paper Pilot v3 — every number the game balances on, in one place.
// Tuning lives here and nowhere else, so a balance change is one edit
// and the simulation, the renderer and the screenshots all agree.
// The plane: hold to climb, release to glide. The sky: rings to thread,
// sun shards to collect, storms and birds to dodge, a zone gate to fly
// through — four themed zones, one campaign, one Sun Gate at the end.

export const VIEW = {
  width: 1280, // logical frame the canvas scales to the window
  height: 720,
  planeX: 0.3, // the plane sits at 30% of the screen width
  groundHeight: 96, // hills rise this far from the bottom
  ceiling: 40, // highest the plane may climb
};

export const PLANE = {
  liftAccel: -1900, // climb thrust while the player holds
  gravity: 780, // pull while gliding (and always, underneath the lift)
  maxFall: 460, // fastest the plane may sink
  maxClimb: -520, // fastest the plane may rise
  baseSpeed: 260, // world scroll at zone 1, px per second
  speedPerLevel: 13, // extra scroll per half-zone step
  radius: 22, // collision radius of the paper plane
};

export const RULES = {
  hearts: 3, // hits the run survives before it ends
  zoneLengthMetres: 750, // metres of sky in one zone
  zoneGateBonus: 500, // added to the score for clearing a zone gate
  winBonus: 1000, // added to the score for passing the Sun Gate
  shardsPerZone: 12, // sun shards hidden in each zone
  shardPoints: 25, // points per sun shard
  ringPoints: 100, // points per ring, times the combo
  invulnerableSeconds: 2, // grace after a hit, during which nothing hurts
  maxCombo: 5, // combo multiplier caps at x5
  missSlack: 60, // a ring counts as missed this far past the plane
};

export const SPAWN = {
  interval: 1.15, // seconds between ring/shard spawn attempts
  intervalMin: 0.62, // fastest the spawner may run at high levels
  starChance: 0.55, // (reserved) share of spawns that are shard trails
};

// Dusk palette (zone 1, the original Paper Pilot sky): indigo sky
// melting into peach at the horizon, teal hills below, gold rings and
// a low sun. Zones 2–4 override the sky/hill colours in zones.js;
// every other colour the game draws comes from here.
export const PALETTE = {
  skyTop: '#2e3a67', // deep indigo at the top of the sky
  skyMid: '#7a5f9e', // lavender through the middle
  skyLow: '#f7a56b', // warm peach low down
  horizon: '#ffd9a0', // pale gold at the horizon line
  sunCore: '#fff3c4', // the sun's bright centre
  sunGlow: '#ffb347', // the sun's warm halo
  mountainFar: '#5d5480', // far ridge, hazy purple
  mountainNear: '#453a63', // near ridge, deeper purple
  hill: '#2f6f5e', // rolling green hills the plane must clear
  hillDark: '#24584b', // shaded side of the hills
  hillLip: '#3f8f74', // lighter grass lip along the crest
  cloud: 'rgba(255, 244, 230, 0.92)', // soft white decor clouds
  cloudShade: 'rgba(226, 205, 235, 0.85)', // their lavender underside
  storm: '#3a3355', // storm cloud body
  stormDark: '#241f38', // storm cloud belly
  ring: '#ffc93c', // golden ring
  ringGlow: 'rgba(255, 201, 60, 0.55)', // the ring's halo
  shard: '#ffe66d', // collectible sun shard
  planeBody: '#fdfdf8', // white paper top
  planeShade: '#cdd8ea', // shaded paper underside
  planeAccent: '#ff6b6b', // red stripe so the plane's nose reads
  ink: '#232038', // dark text on panels
  inkSoft: '#4a4560', // softer dark text
  hudPanel: 'rgba(24, 20, 48, 0.55)', // translucent HUD backing
  good: '#7dffb0', // green for good news (new best)
  danger: '#ff5d5d', // red for danger (lost hearts)
};
