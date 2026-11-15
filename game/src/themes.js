// Paper Pilot v3 — one job: turn a zone into the palette the
// renderer paints with. The base palette in config.js holds every
// colour shared by all zones (rings, plane, ink, HUD); a zone only
// overrides its sky, sun, ridges and hills, so each region reads as
// a different place while the game stays one coherent game.

import { PALETTE } from './config.js';
import { zoneDef } from './zones.js';

const ZONE_KEYS = [
  'skyTop',
  'skyMid',
  'skyLow',
  'horizon',
  'sunCore',
  'sunGlow',
  'mountainFar',
  'mountainNear',
  'hill',
  'hillDark',
  'hillLip',
];

export function themeForZone(id) {
  const zone = zoneDef(id);
  const theme = { ...PALETTE };
  for (const key of ZONE_KEYS) theme[key] = zone[key];
  return theme;
}
