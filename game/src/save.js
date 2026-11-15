// Paper Pilot v3 — the save system: progress that survives the tab
// closing. One localStorage key holds the whole campaign record:
// which zones are unlocked, the best score / shards / fewest hits /
// best time per zone, and how many campaigns the player has won.
// Zone N+1 unlocks only when zone N is cleared, so the level select
// can show locked progression honestly. In Node (tests, screenshots)
// there is no localStorage, so a memory store stands in instead.

import { ZONES, TOTAL_SHARDS } from './zones.js';

export const SAVE_KEY = 'paper-pilot-save-v2';

const memoryStore = new Map();

function storage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch {
    // Private mode or no storage: fall through to memory.
  }
  return null;
}

function readRaw() {
  const store = storage();
  try {
    if (store) return store.getItem(SAVE_KEY);
  } catch {
    // Unreadable storage reads as no save.
  }
  return memoryStore.has(SAVE_KEY) ? memoryStore.get(SAVE_KEY) : null;
}

function writeRaw(text) {
  const store = storage();
  try {
    if (store) {
      store.setItem(SAVE_KEY, text);
      return;
    }
  } catch {
    // Unwritable storage keeps the save for the session only.
  }
  memoryStore.set(SAVE_KEY, text);
}

export function defaultSave() {
  return {
    v: 2,
    unlocked: 1, // zones unlocked (zone 1 open from the start)
    best: {}, // zone id -> best score
    shards: {}, // zone id -> best shards collected (of 12)
    hits: {}, // zone id -> fewest hits taken on a clear
    times: {}, // zone id -> best clear time, seconds
    campaigns: 0, // campaigns won (all four zones cleared)
    totalBest: 0, // best single-zone score anywhere
  };
}

// Load, tolerating a missing, corrupt or older save: anything unreadable
// becomes a fresh save rather than crashing the title screen.
export function loadSave() {
  const raw = readRaw();
  if (!raw) return defaultSave();
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return defaultSave();
    const save = defaultSave();
    if (Number.isInteger(data.unlocked)) save.unlocked = Math.max(1, Math.min(4, data.unlocked));
    for (const key of ['best', 'shards', 'hits', 'times']) {
      if (data[key] && typeof data[key] === 'object') save[key] = data[key];
    }
    if (Number.isInteger(data.campaigns)) save.campaigns = Math.max(0, data.campaigns);
    if (Number.isFinite(data.totalBest)) save.totalBest = Math.max(0, data.totalBest);
    return save;
  } catch {
    return defaultSave();
  }
}

export function storeSave(save) {
  try {
    writeRaw(JSON.stringify(save));
  } catch {
    // A save that cannot be written is simply not persisted.
  }
}

export function isUnlocked(save, zoneId) {
  return zoneId < save.unlocked;
}

// Total shards across the player's best per-zone hauls, of 48.
export function totalShards(save) {
  return ZONES.reduce((sum, z) => sum + (save.shards[z.id] || 0), 0);
}

export function totalShardsText(save) {
  return `${totalShards(save)}/${TOTAL_SHARDS}`;
}

// Record a zone clear: unlock the next zone, keep the best score,
// shards, fewest hits and best time for the zone. Returns true when
// any record was beaten.
export function recordZoneClear(save, zoneId, result) {
  let beaten = false;
  if (result.score > (save.best[zoneId] || 0)) {
    save.best[zoneId] = result.score;
    beaten = true;
  }
  if (result.shards > (save.shards[zoneId] || 0)) {
    save.shards[zoneId] = result.shards;
    beaten = true;
  }
  if (result.hits < (save.hits[zoneId] ?? Infinity)) {
    save.hits[zoneId] = result.hits;
    beaten = true;
  }
  if (result.time < (save.times[zoneId] ?? Infinity)) {
    save.times[zoneId] = result.time;
    beaten = true;
  }
  if (result.score > save.totalBest) save.totalBest = result.score;
  if (zoneId + 1 < ZONES.length && save.unlocked < zoneId + 2) {
    save.unlocked = zoneId + 2;
  }
  storeSave(save);
  return beaten;
}

// Record a failed run's best score only — a crash still counts toward
// the zone's best, it just unlocks nothing.
export function recordZoneAttempt(save, zoneId, score) {
  if (score > (save.best[zoneId] || 0)) {
    save.best[zoneId] = score;
    if (score > save.totalBest) save.totalBest = score;
    storeSave(save);
    return true;
  }
  return false;
}

// Record a finished campaign: all four zones cleared in one sitting.
export function recordCampaignWin(save) {
  save.campaigns += 1;
  storeSave(save);
  return save.campaigns;
}
