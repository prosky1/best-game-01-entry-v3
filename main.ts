// Paper Pilot v3 — a best-game-01 entry (Node 22, standard library only).
// The game is this directory's game/ folder: plain static files a
// desktop browser loads offline (game/index.html and its ES modules,
// no library, no network request). Four themed zones, a level select
// with locked progression, 12 sun shards per zone, a save system, and
// a stats-rich campaign win screen — the same one-button climb/glide
// loop as v1. v3 answers the v2 heat log (74.11% dev, all five losses
// to Mosslight on look and variety): the whole game now renders as
// pixel art at 320x180 scaled up 4x (render.js), with a dithered sky,
// three parallax ridge layers, a pixel sun/moon, stars and fireflies
// (backdrop.js), a custom 5x7 pixel font for every letter on screen
// (font.js), and a new diving enemy — paper hawks, from zone 2 on
// (enemies.js) — so the play is denser and the dossier shows two
// distinct biomes. This program hands it in: it copies game/ and
// screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library.
//
// Play it locally first with `node serve.ts`, then open
// http://localhost:8080. Outside the grader's container,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps: only text_max_bytes shapes the bytes; the
// others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in game/ or
// 48 MiB of game files in all, or a path under game/ over 1000 bytes).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
