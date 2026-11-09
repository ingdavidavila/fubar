import { CARD_RULES, RANKS, SUITS } from './engine/cards';
import type { Card, DrawResult, GameState, Group } from './engine/types';

/** Pure (de)serialisation + validation for saved games and preferences. */
export const SAVE_VERSION = 1;
const GROUPS: Group[] = ['guys', 'girls', 'other'];

export interface SavedGame {
  version: number;
  savedAt: number;
  state: GameState;
  result: DrawResult | null;
}

export interface PlayerPref { name: string; group: Group }
export interface Prefs {
  version: number;
  players: PlayerPref[];
  sound: boolean;
}

const isObj = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isInt = (v: unknown, min = 0): v is number => Number.isInteger(v) && (v as number) >= min;

function isCard(v: unknown): v is Card {
  return isObj(v) && RANKS.includes(v.rank) && SUITS.includes(v.suit);
}

function isPlayer(v: unknown): boolean {
  return isObj(v) && typeof v.id === 'string' && typeof v.name === 'string' && GROUPS.includes(v.group);
}

function validState(s: unknown): s is GameState {
  if (!isObj(s)) return false;
  if (!Array.isArray(s.deck) || !Array.isArray(s.discard) || !Array.isArray(s.players)) return false;
  if (!s.deck.every(isCard) || !s.discard.every(isCard) || !s.players.every(isPlayer)) return false;
  const all = [...s.deck, ...s.discard] as Card[];
  if (all.length > 52 || new Set(all.map((c) => c.rank + c.suit)).size !== all.length) return false;
  if (s.players.length < 2 || new Set(s.players.map((p: any) => p.id)).size !== s.players.length) return false;
  if (!isInt(s.currentIndex) || s.currentIndex >= s.players.length) return false;
  if (s.thumbmasterId !== null && !s.players.some((p: any) => p.id === s.thumbmasterId)) return false;
  if (!isInt(s.kingsDrawn) || typeof s.over !== 'boolean') return false;
  return isObj(s.config) && isInt(s.config.kingsToEnd, 1);
}

function validResult(r: unknown, state: GameState): r is DrawResult {
  if (!isObj(r) || !isCard(r.card) || !isObj(r.drawer)) return false;
  return state.players.some((p) => p.id === r.drawer.id) &&
    Array.isArray(r.drinkers) && Array.isArray(r.waterfallOrder) && typeof r.gameOver === 'boolean';
}

export function encodeSave(state: GameState, result: DrawResult | null, now = Date.now()): string {
  const save: SavedGame = { version: SAVE_VERSION, savedAt: now, state, result };
  return JSON.stringify(save);
}

/** Returns null for anything missing, corrupt, or from an incompatible version. */
export function decodeSave(raw: string | null): SavedGame | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if (!isObj(d) || d.version !== SAVE_VERSION || !isInt(d.savedAt) || !validState(d.state)) return null;
    let result: DrawResult | null = null;
    if (d.result !== null && d.result !== undefined) {
      if (!validResult(d.result, d.state)) return null;
      // Always rebuild the rule from current card data so rule edits apply to old saves.
      result = { ...d.result, rule: CARD_RULES[d.result.card.rank as Card['rank']] };
    }
    return { version: SAVE_VERSION, savedAt: d.savedAt, state: d.state, result };
  } catch {
    return null;
  }
}

export function encodePrefs(prefs: Omit<Prefs, 'version'>): string {
  return JSON.stringify({ version: SAVE_VERSION, ...prefs });
}

export function decodePrefs(raw: string | null): Prefs | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if (!isObj(d) || d.version !== SAVE_VERSION || typeof d.sound !== 'boolean' || !Array.isArray(d.players)) return null;
    const players = d.players
      .filter((p: any) => isObj(p) && typeof p.name === 'string' && GROUPS.includes(p.group))
      .map((p: any) => ({ name: p.name.slice(0, 16), group: p.group as Group }));
    return { version: SAVE_VERSION, players, sound: d.sound };
  } catch {
    return null;
  }
}
