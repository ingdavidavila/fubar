import { describe, expect, it } from 'vitest';
import { createDeck } from './cards';
import { createGame, drawCard, makePlayers, mulberry32, shuffle } from './game';
import type { Card, GameState, Rank } from './types';

const players = makePlayers([
  { name: 'Ann', group: 'girls' },
  { name: 'Bob', group: 'guys' },
  { name: 'Cy', group: 'guys' },
  { name: 'Di', group: 'girls' },
  { name: 'Ed', group: 'other' },
  { name: 'Flo', group: 'girls' },
]);

/** Build a game whose deck starts with the given ranks (then the rest of a fresh deck). */
function rigged(ranks: Rank[], extra = {}): GameState {
  const base = createGame(players, mulberry32(1), extra);
  const used: Card[] = [];
  const rest = createDeck();
  for (const r of ranks) {
    const i = rest.findIndex((c) => c.rank === r);
    used.push(rest.splice(i, 1)[0]);
  }
  return { ...base, deck: [...used, ...rest] };
}

describe('deck', () => {
  it('has 52 unique cards', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map((c) => c.rank + c.suit)).size).toBe(52);
  });
  it('shuffle keeps every card and is reproducible with a seed', () => {
    const a = shuffle(createDeck(), mulberry32(7));
    const b = shuffle(createDeck(), mulberry32(7));
    expect(a).toEqual(b);
    expect(new Set(a.map((c) => c.rank + c.suit)).size).toBe(52);
  });
});

describe('turns', () => {
  it('rotates through players and wraps', () => {
    let s = rigged(['2', '2', '2', '2', '2', '2', '2']);
    const drawers: string[] = [];
    for (let i = 0; i < 7; i++) {
      const r = drawCard(s);
      drawers.push(r.result.drawer.name);
      s = r.state;
    }
    expect(drawers).toEqual(['Ann', 'Bob', 'Cy', 'Di', 'Ed', 'Flo', 'Ann']);
  });
  it('moves drawn cards to discard', () => {
    const s = rigged(['A']);
    const { state } = drawCard(s);
    expect(state.deck).toHaveLength(51);
    expect(state.discard).toHaveLength(1);
  });
});

describe('card effects', () => {
  it('Ace and 10: everyone drinks', () => {
    for (const r of ['A', '10'] as Rank[]) {
      const { result } = drawCard(rigged([r]));
      expect(result.drinkers).toHaveLength(6);
    }
  });
  it('2 and 3: drawer drinks that many', () => {
    const two = drawCard(rigged(['2'])).result;
    expect(two.drinkers.map((p) => p.name)).toEqual(['Ann']);
    expect(two.drinksEach).toBe(2);
    expect(drawCard(rigged(['3'])).result.drinksEach).toBe(3);
  });
  it('5: drawer gives 5', () => {
    const { result } = drawCard(rigged(['5']));
    expect(result.toGive).toBe(5);
    expect(result.drinkers).toHaveLength(0);
  });
  it('Jack: guys drink; Queen: girls drink; others never', () => {
    const j = drawCard(rigged(['J'])).result;
    expect(j.drinkers.map((p) => p.name)).toEqual(['Bob', 'Cy']);
    const q = drawCard(rigged(['Q'])).result;
    expect(q.drinkers.map((p) => p.name)).toEqual(['Ann', 'Di', 'Flo']);
  });
  it('7: Thumbmaster is set and replaced by the next 7', () => {
    const a = drawCard(rigged(['7', '2', '7']));
    expect(a.result.thumbmaster?.name).toBe('Ann');
    const b = drawCard(a.state);
    expect(b.result.thumbmaster?.name).toBe('Ann');
    const c = drawCard(b.state);
    expect(c.result.thumbmaster?.name).toBe('Cy');
    expect(c.state.thumbmasterId).toBe('p3');
  });
  it('King: waterfall starts with drawer in turn order', () => {
    const s = rigged(['2', '2', 'K']);
    const s2 = drawCard(drawCard(drawCard(s).state).state);
    expect(s2.result.waterfallOrder.map((p) => p.name)).toEqual(['Cy', 'Di', 'Ed', 'Flo', 'Ann', 'Bob']);
  });
  it('4/6/8/9: mini-games name a starter; 6/8/9 give a prompt', () => {
    for (const r of ['4', '6', '8', '9'] as Rank[]) {
      const { result } = drawCard(rigged([r]));
      expect(result.starter?.name).toBe('Ann');
      expect(result.prompt === null).toBe(r === '4');
    }
  });
});

describe('game end', () => {
  it('ends on the 4th King', () => {
    let s = rigged(['K', 'K', 'K', 'K', '2']);
    for (let i = 0; i < 3; i++) {
      const r = drawCard(s);
      expect(r.result.gameOver).toBe(false);
      s = r.state;
    }
    const last = drawCard(s);
    expect(last.result.gameOver).toBe(true);
    expect(last.state.over).toBe(true);
    expect(() => drawCard(last.state)).toThrow();
  });
  it('kingsToEnd is configurable', () => {
    const r = drawCard(rigged(['K'], { kingsToEnd: 1 }));
    expect(r.result.gameOver).toBe(true);
  });
  it('ends when the deck runs out', () => {
    let s = rigged([], { kingsToEnd: 99 });
    s = { ...s, deck: s.deck.filter((c) => c.rank !== 'K').slice(0, 2) };
    s = drawCard(s).state;
    expect(drawCard(s).result.gameOver).toBe(true);
  });
});
