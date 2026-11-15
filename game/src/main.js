// Paper Pilot v3 — boot, the frame loop and the screen state machine.
// The simulation lives in world.js and the pixels in render.js; this
// file only wires them to the canvas, the clock and the player, plus
// the campaign save: which zones are unlocked, and the per-zone bests
// the level select shows.
//
// Flow: title → level select → zone flight → zone complete (or game
// over) → next zone / level select. Clearing zone 4's Sun Gate wins
// the campaign and shows the stats table.

import { VIEW } from './config.js';
import { createWorld, startRun, stepWorld, zoneResult } from './world.js';
import { drawFrame } from './render.js';
import {
  titleButtons,
  selectCards,
  overButtons,
  zoneCompleteButtons,
  campaignWinButtons,
} from './screens.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { buildShot } from './shots.js';
import { loadSave, storeSave, recordZoneClear, recordZoneAttempt, recordCampaignWin, isUnlocked } from './save.js';
import { ZONES } from './zones.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number(params.get('seed') || '7');
const zoneParam = Number(params.get('zone') || '2');

const sounds = new SoundBank();
const input = new Input(canvas);
let lastHit = null;

const save = loadSave();
let world = createWorld(Number.isFinite(seedParam) ? seedParam : 7, 0);
world.save = save;
world.best = save.best[0] || 0;

// Read-only hook for play-testing (and for anyone curious): the live
// phase, score, distance, hearts and plane height, plus what last
// hurt the plane. Nothing here is writable.
window.__paperPilot = {
  get phase() {
    return world.phase;
  },
  get zone() {
    return world.zone;
  },
  get score() {
    return world.score;
  },
  get distance() {
    return Math.floor(world.distance);
  },
  get hearts() {
    return world.hearts;
  },
  get rings() {
    return world.ringsCollected;
  },
  get shards() {
    return world.shardsCollected;
  },
  get level() {
    return world.level;
  },
  get planeY() {
    return Math.round(world.plane.y);
  },
  get lastHit() {
    return lastHit;
  },
  get unlocked() {
    return save.unlocked;
  },
};

// The canvas keeps the game's 1280x720 logical frame and scales it to
// the window, crisp on hidpi screens (capped at 2x for performance).
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.width = Math.round(VIEW.width * scale * dpr);
  canvas.height = Math.round(VIEW.height * scale * dpr);
  canvas.style.width = `${Math.round(VIEW.width * scale)}px`;
  canvas.style.height = `${Math.round(VIEW.height * scale)}px`;
  ctx.setTransform(canvas.width / VIEW.width, 0, 0, canvas.height / VIEW.height, 0, 0);
}
window.addEventListener('resize', resize);
resize();

// Which menu button, if any, sits under a pointer tap.
function buttonAt(buttons, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * VIEW.width;
  const y = ((clientY - rect.top) / rect.height) * VIEW.height;
  return buttons.find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) || null;
}

// Back to the title on a fresh sky, keeping the save.
function backToTitle() {
  sounds.click();
  const seed = (Date.now() % 2147483647) >>> 0;
  world = createWorld(seed, 0);
  world.save = save;
  world.best = save.best[0] || 0;
  world.phase = 'title';
}

// To the level select: the campaign's hub.
function goToSelect() {
  sounds.click();
  world.phase = 'select';
}

// Start a zone flight from the select screen (or a retry).
function beginZone(zoneId) {
  if (!isUnlocked(save, zoneId)) return;
  sounds.unlock();
  sounds.click();
  lastHit = null;
  world.best = save.best[zoneId] || 0;
  startRun(world, zoneId);
}

// One event per frame: the matching sound, and the save updated when
// a zone ends, win or lose.
function playEvents(events) {
  for (const event of events) {
    if (event.type === 'ring') sounds.ring(event.combo);
    else if (event.type === 'shard') sounds.shard();
    else if (event.type === 'hit') {
      sounds.hit();
      lastHit = event.reason;
    } else if (event.type === 'level') sounds.levelUp();
    else if (event.type === 'zonecomplete') {
      sounds.zoneComplete();
      const result = zoneResult(world);
      world.zoneResult = result;
      recordZoneClear(save, world.zone, result);
    } else if (event.type === 'campaignwin') {
      sounds.win();
      const result = zoneResult(world);
      world.zoneResult = result;
      recordZoneClear(save, world.zone, result);
      // The win table reads the save, so it shows all four zones even
      // when they were cleared in earlier sittings.
      world.campaignStats = ZONES.map((z, i) => ({
        zone: i,
        score: save.best[i] || 0,
        shards: save.shards[i] || 0,
        hits: save.hits[i] ?? 0,
        time: save.times[i] || 0,
      }));
      recordCampaignWin(save);
    } else if (event.type === 'over') {
      recordZoneAttempt(save, world.zone, event.score);
      storeSave(save);
    }
  }
}

// Menu input, by phase: the title starts on any press or tap (into the
// level select), the select opens a zone on click or keys 1–4, play
// pauses on P or Escape, pause resumes the same way, and the end
// screens restart on R, Space or Enter, or on their buttons.
function handlePhaseInput() {
  const clicks = input.takeClicks();
  if (world.phase === 'title') {
    if (input.wasPressed('Space') || input.wasPressed('Enter') || clicks.length > 0) {
      goToSelect();
    }
    return;
  }
  if (world.phase === 'select') {
    for (let i = 0; i < ZONES.length; i++) {
      if (input.wasPressed(`Digit${i + 1}`) || input.wasPressed(`Numpad${i + 1}`)) {
        beginZone(i);
        return;
      }
    }
    if (input.wasPressed('Escape')) {
      backToTitle();
      return;
    }
    for (const click of clicks) {
      const card = buttonAt(selectCards(), click.x, click.y);
      if (card) {
        beginZone(card.zone);
        return;
      }
      backToTitle();
      return;
    }
    return;
  }
  if (world.phase === 'playing') {
    if (input.wasPressed('KeyP') || input.wasPressed('Escape')) {
      world.phase = 'paused';
      sounds.click();
    }
    if (input.wasPressed('KeyM')) sounds.toggleMute();
    return;
  }
  if (world.phase === 'paused') {
    if (input.wasPressed('KeyP') || input.wasPressed('Escape') || clicks.length > 0) {
      world.phase = 'playing';
      sounds.click();
    }
    return;
  }
  if (world.phase === 'zonecomplete') {
    if (input.wasPressed('Space') || input.wasPressed('Enter')) {
      if (world.zone + 1 < ZONES.length) beginZone(world.zone + 1);
      else goToSelect();
      return;
    }
    for (const click of clicks) {
      const hit = buttonAt(zoneCompleteButtons(world.zone + 1), click.x, click.y);
      if (hit && hit.id === 'next') beginZone(world.zone + 1);
      else if (hit && hit.id === 'menu') goToSelect();
      else if (hit) goToSelect();
    }
    return;
  }
  // over / campaignwin
  if (input.wasPressed('KeyR') || input.wasPressed('Space') || input.wasPressed('Enter')) {
    beginZone(world.zone);
    return;
  }
  for (const click of clicks) {
    const buttons = world.phase === 'over' ? overButtons() : campaignWinButtons();
    const hit = buttonAt(buttons, click.x, click.y);
    if (hit && hit.id === 'menu') goToSelect();
    else beginZone(world.zone);
  }
}

// Hiding the tab pauses a run in progress, so the plane never dies
// while the player is looking elsewhere.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && world.phase === 'playing') world.phase = 'paused';
});

// --- Screenshot mode: ?shot=title|select|play|end&seed=N renders one
// staged frame of the real game and stops. The page signals readiness
// for the screenshot tool through window.__shotReady.
if (shotName) {
  world = buildShot(shotName, Number.isFinite(seedParam) ? seedParam : 7, zoneParam);
  drawFrame(ctx, world);
  window.__shotReady = true;
  document.title = `Paper Pilot — ${shotName}`;
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    handlePhaseInput();
    if (world.phase === 'playing' || world.phase === 'title') {
      sounds.unlock();
    }
    const events = stepWorld(world, input, dt, sounds);
    playEvents(events);
    sounds.updateMusic(dt, world.phase === 'playing');
    drawFrame(ctx, world);
    input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
