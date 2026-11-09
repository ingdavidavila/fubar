import { CARD_RULES, CATEGORIES, NEVER_HAVE_I_EVER, RHYME_WORDS, createDeck } from './cards';
import type { DrawResult, GameConfig, GameState, Group, Player, Rng } from './types';

export const DEFAULT_CONFIG: GameConfig = { kingsToEnd: 4 };
export const RECOMMENDED_MIN_PLAYERS = 6;

/** Small seedable RNG so games are reproducible in tests. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates; returns a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function makePlayers(entries: { name: string; group: Group }[]): Player[] {
  return entries.map((e, i) => ({ id: `p${i + 1}`, name: e.name.trim() || `Player ${i + 1}`, group: e.group }));
}

export function createGame(
  players: Player[],
  rng: Rng = Math.random,
  config: Partial<GameConfig> = {},
): GameState {
  if (players.length < 2) throw new Error('Need at least 2 players');
  return {
    deck: shuffle(createDeck(), rng),
    discard: [],
    players,
    currentIndex: 0,
    thumbmasterId: null,
    kingsDrawn: 0,
    over: false,
    config: { ...DEFAULT_CONFIG, ...config },
  };
}

export function currentPlayer(state: GameState): Player {
  return state.players[state.currentIndex];
}

/** Players in turn order, starting with the player at `startIndex`. */
export function turnOrderFrom(state: GameState, startIndex: number): Player[] {
  const n = state.players.length;
  return Array.from({ length: n }, (_, i) => state.players[(startIndex + i) % n]);
}

function pick<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

/**
 * Draw the top card for the current player. Pure: returns the new state and a
 * description of the outcome. Throws if the game is already over.
 */
export function drawCard(state: GameState, rng: Rng = Math.random): { state: GameState; result: DrawResult } {
  if (state.over) throw new Error('Game is over');
  const [card, ...deck] = state.deck;
  const rule = CARD_RULES[card.rank];
  const drawer = currentPlayer(state);
  const effect = rule.effect;

  let drinkers: Player[] = [];
  let drinksEach = 1;
  let toGive = 0;
  let waterfallOrder: Player[] = [];
  let starter: Player | null = null;
  let prompt: string | null = null;
  let thumbmasterId = state.thumbmasterId;

  switch (effect.type) {
    case 'everyone':
      drinkers = state.players;
      break;
    case 'drawerDrinks':
      drinkers = [drawer];
      drinksEach = effect.amount;
      break;
    case 'give':
      toGive = effect.amount;
      break;
    case 'group':
      drinkers = state.players.filter((p) => p.group === effect.group);
      break;
    case 'thumbmaster':
      thumbmasterId = drawer.id;
      break;
    case 'waterfall':
      waterfallOrder = turnOrderFrom(state, state.currentIndex);
      drinkers = waterfallOrder;
      break;
    case 'miniGame':
      starter = drawer;
      if (effect.game === 'categories') prompt = pick(CATEGORIES, rng);
      else if (effect.game === 'rhyme') prompt = pick(RHYME_WORDS, rng);
      else if (effect.game === 'neverHaveIEver') prompt = pick(NEVER_HAVE_I_EVER, rng);
      break;
  }

  const kingsDrawn = state.kingsDrawn + (card.rank === 'K' ? 1 : 0);
  const gameOver = kingsDrawn >= state.config.kingsToEnd || deck.length === 0;

  const next: GameState = {
    ...state,
    deck,
    discard: [card, ...state.discard],
    currentIndex: (state.currentIndex + 1) % state.players.length,
    thumbmasterId,
    kingsDrawn,
    over: gameOver,
  };

  const result: DrawResult = {
    card,
    rule,
    drawer,
    drinkers,
    drinksEach,
    toGive,
    waterfallOrder,
    starter,
    prompt,
    thumbmaster: state.players.find((p) => p.id === thumbmasterId) ?? null,
    gameOver,
  };
  return { state: next, result };
}
