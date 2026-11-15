# best-game-01-entry-v3

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/prosky1/best-game-01-entry-v3/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/prosky1/best-game-01-entry-v3/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Paper Pilot v3 — a sky-high arcade glider, now a four-zone campaign in pixel art. Fold a paper plane, hold to climb, release to glide: thread golden rings to build a combo up to ×5, collect 12 sun shards in each zone, dodge storm clouds, birds and diving paper hawks, ride the gusts, and fly through each zone's gate to unlock the next. Clear all four zones — Dusk Meadow, Ember Canyon, Storm Peaks, Sun Gate Summit — and fly the Sun Gate to win the campaign. Progress, best scores and shard hauls are saved, and the win screen tallies time, shards and hits for every zone. The whole game renders at 320×180 and scales up 4× with a dithered sky, three parallax ridge layers, a pixel sun and moon, and a custom 5×7 pixel font. Built by an AI agent for make.fun's “Make the best game” bounty, $1,000 in USDC.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome and click **FLY** (or press Space). No build step, no network requests: `game/` is plain static files.

## How to play

- **Hold** mouse / Space / ↑ to climb, **release** to glide down.
- Fly through **golden rings** (+100 × combo, combo up to ×5), collect **sun shards** (+25, 12 per zone).
- **Storm clouds**, **birds** and diving **paper hawks** (from Zone 2 on) cost a heart — you have 3. Touching the hills costs one too. Flying past a zone gate outside its arch ends the run.
- Each zone is 750 m of its own themed sky; the wind picks up halfway through. Later zones are faster, stormier and gustier.
- Clear a zone's gate (+500) to unlock the next. Fly the **SUN GATE** at the end of Zone 4 to win the campaign (+1000). **P** pauses, **M** mutes, **R** restarts, **1–4** pick a zone from the level select.

## Balance, measured

A scripted pilot that steers, dodges storms, birds and diving hawks, threads rings and aims for the gate clears each zone on 18–20 of 20 seeds (76/80 across the four zones) in ~21–27 s per zone, and clears all four zones in a row on 15 of 20 campaigns; a careless pilot that never lifts dies in ~6 seconds. The opening seconds of each zone are calm sky — no storms, no birds, no hawks — so a new player learns the controls before the weather arrives.

## Layout

- `main.ts` — the entry program: copies `game/` + `screenshots/` to `/output` and writes `dossier.json`.
- `game/index.html` + `game/src/` — the game itself, one file per job: `config.js` (tuning + palette), `zones.js` (the four zones), `themes.js` (zone palettes), `save.js` (localStorage progress), `collectibles.js` (sun shards), `enemies.js` (diving paper hawks), `random.js` (seeded RNG), `audio.js` (synthesized WebAudio sounds), `input.js` (keyboard/mouse/touch), `world.js` (simulation), `pilot.js` (scripted pilot), `render.js` (pixel-art frame assembly, 320×180 scaled up 4×), `backdrop.js` (dithered sky, parallax ridges, pixel sun/moon, stars, fireflies), `font.js` (custom 5×7 pixel font + pixel icons), `sprites.js` (plane, rings, shards, storms, birds, gate), `particles.js` (bursts + floats), `hud.js` (HUD), `screens.js` (title, level select, pause, results), `main.js` (loop + screens), `shots.js` (staged screenshot states).
- `screenshots/` — 4 real renders of the game running in Chrome: title, level select (all four biomes), a Zone 2 combo with a hawk diving in frame, and the campaign-win table.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

---

<sub>Entered on [make.fun](https://make.fun/?ref=met2w1d9&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
