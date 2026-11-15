// Paper Pilot v3 — the four themed zones of the campaign.
// One zone is one flight: 750 m of sky with its own palette, its own
// hazards and its own 12 sun shards. Clearing a zone's gate unlocks
// the next; clearing all four — the last through the Sun Gate — wins
// the campaign. Difficulty (speed, storms, birds, gusts) rises zone
// by zone, so the campaign has visible progression, not just length.

import { RULES } from './config.js';

export const SHARDS_PER_ZONE = RULES.shardsPerZone;
export const TOTAL_SHARDS = SHARDS_PER_ZONE * 4;

export const ZONES = [
  {
    id: 0,
    name: 'Dusk Meadow',
    short: 'MEADOW',
    tagline: 'Golden rings over green hills',
    lengthMetres: RULES.zoneLengthMetres,
    gateLabel: 'ZONE GATE',
    gateBonus: RULES.zoneGateBonus,
    // Dusk palette: the original Paper Pilot sky.
    skyTop: '#2e3a67',
    skyMid: '#7a5f9e',
    skyLow: '#f7a56b',
    horizon: '#ffd9a0',
    sunCore: '#fff3c4',
    sunGlow: '#ffb347',
    mountainFar: '#5d5480',
    mountainNear: '#453a63',
    hill: '#2f6f5e',
    hillDark: '#24584b',
    hillLip: '#3f8f74',
    speedBonus: 0,
    stormBase: 4.2, // storms per minute
    stormPerLevel: 1.4,
    birdBase: 1.6, // birds per minute
    birdPerLevel: 0.9,
    hawkBase: 0, // no hawks in zone 1: the gentle sky stays gentle
    hawkPerLevel: 0,
    stormFirstDelay: 10, // seconds of calm sky before the first storm
    birdFirstDelay: 16, // seconds before the first bird appears
    hawkFirstDelay: Infinity,
    gustMax: 260,
  },
  {
    id: 1,
    name: 'Ember Canyon',
    short: 'CANYON',
    tagline: 'Red rock, hot wind, low sun',
    lengthMetres: RULES.zoneLengthMetres,
    gateLabel: 'ZONE GATE',
    gateBonus: RULES.zoneGateBonus,
    // Ember sunset: deep rust sky, burnt-orange horizon, dark red rock.
    skyTop: '#4a2340',
    skyMid: '#8a3b4d',
    skyLow: '#e2603f',
    horizon: '#ffb347',
    sunCore: '#ffe9a8',
    sunGlow: '#ff7a3c',
    mountainFar: '#6b3049',
    mountainNear: '#542238',
    hill: '#7a3b2e',
    hillDark: '#5c2a20',
    hillLip: '#a85438',
    speedBonus: 26,
    stormBase: 5.6,
    stormPerLevel: 1.4,
    birdBase: 2.5,
    birdPerLevel: 0.9,
    hawkBase: 1.4, // paper hawks per minute, from zone 2 on
    hawkPerLevel: 0.5,
    stormFirstDelay: 8,
    birdFirstDelay: 13,
    hawkFirstDelay: 20,
    gustMax: 290,
  },
  {
    id: 2,
    name: 'Storm Peaks',
    short: 'PEAKS',
    tagline: 'Night ridges and lightning',
    lengthMetres: RULES.zoneLengthMetres,
    gateLabel: 'ZONE GATE',
    gateBonus: RULES.zoneGateBonus,
    // Night: near-black indigo sky, violet ridges, cold slate peaks.
    skyTop: '#0d1030',
    skyMid: '#2c2a5e',
    skyLow: '#5a4a8a',
    horizon: '#8a7ab8',
    sunCore: '#e8ecff',
    sunGlow: '#9aa5ff',
    mountainFar: '#2a2350',
    mountainNear: '#1d1838',
    hill: '#3c4a6b',
    hillDark: '#2b3550',
    hillLip: '#5a6b94',
    speedBonus: 52,
    stormBase: 7.0,
    stormPerLevel: 1.4,
    birdBase: 3.4,
    birdPerLevel: 0.9,
    hawkBase: 2.2,
    hawkPerLevel: 0.6,
    stormFirstDelay: 6,
    birdFirstDelay: 10,
    hawkFirstDelay: 16,
    gustMax: 320,
  },
  {
    id: 3,
    name: 'Sun Gate Summit',
    short: 'SUMMIT',
    tagline: 'Golden dawn - fly the Sun Gate',
    lengthMetres: RULES.zoneLengthMetres,
    gateLabel: 'SUN GATE',
    gateBonus: RULES.winBonus,
    // Golden dawn: bright gold sky, pale ridges, warm sand hills.
    skyTop: '#3a5a8a',
    skyMid: '#7a9ac4',
    skyLow: '#ffcf7a',
    horizon: '#fff3c4',
    sunCore: '#ffffff',
    sunGlow: '#ffd76a',
    mountainFar: '#7a6a9a',
    mountainNear: '#5d4f7d',
    hill: '#8a7a4a',
    hillDark: '#6b5c36',
    hillLip: '#b39a5c',
    speedBonus: 78,
    stormBase: 8.4,
    stormPerLevel: 1.4,
    birdBase: 4.2,
    birdPerLevel: 0.9,
    hawkBase: 3.0,
    hawkPerLevel: 0.7,
    stormFirstDelay: 5,
    birdFirstDelay: 8,
    hawkFirstDelay: 12,
    gustMax: 340,
  },
];

export function zoneDef(id) {
  return ZONES[Math.max(0, Math.min(ZONES.length - 1, id))];
}
