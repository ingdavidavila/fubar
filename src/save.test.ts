import { describe, expect, it } from 'vitest';
import { createGame, drawCard, makePlayers, mulberry32 } from './engine/game';
import { decodePrefs, decodeSave, encodePrefs, encodeSave } from './save';

const players = makePlayers([
  { name: 'Ann', group: 'girls' },
  { name: 'Bob', group: 'guys' },
  { name: 'Cy', group: 'other' },
]);

function midGame() {
  let s = createGame(players, mulberry32(3));
  let result = null as ReturnType<typeof drawCard>['result'] | null;
  for (let i = 0; i < 10; i++) {
    const out = drawCard(s, mulberry32(i));
    s = out.state;
    result = out.result;
  }
  return { s, result };
}

describe('save / resume', () => {
  it('round-trips a mid-game state exactly', () => {
    const { s, result } = midGame();
    const back = decodeSave(encodeSave(s, result, 123));
    expect(back).not.toBeNull();
    expect(back!.state).toEqual(s);
    expect(back!.result?.card).toEqual(result!.card);
    expect(back!.savedAt).toBe(123);
  });

  it('a resumed game keeps playing identically', () => {
    const { s } = midGame();
    const back = decodeSave(encodeSave(s, null))!;
    expect(drawCard(back.state, mulberry32(9)).result.card).toEqual(drawCard(s, mulberry32(9)).result.card);
  });

  it('round-trips a fresh game with no result', () => {
    const s = createGame(players, mulberry32(1));
    expect(decodeSave(encodeSave(s, null))?.result).toBeNull();
  });

  it('rejects null, garbage and wrong versions', () => {
    expect(decodeSave(null)).toBeNull();
    expect(decodeSave('')).toBeNull();
    expect(decodeSave('not json')).toBeNull();
    expect(decodeSave('{"version":99}')).toBeNull();
  });

  it('rejects corrupted state', () => {
    const { s } = midGame();
    const tamper = (fn: (o: any) => void) => {
      const o = JSON.parse(encodeSave(s, null));
      fn(o);
      return decodeSave(JSON.stringify(o));
    };
    expect(tamper((o) => (o.state.currentIndex = 99))).toBeNull();
    expect(tamper((o) => (o.state.deck[0].rank = 'Z'))).toBeNull();
    expect(tamper((o) => o.state.deck.push(o.state.deck[0]))).toBeNull(); // duplicate card
    expect(tamper((o) => (o.state.thumbmasterId = 'nobody'))).toBeNull();
    expect(tamper((o) => (o.state.players[0].group = 'alien'))).toBeNull();
    expect(tamper((o) => (o.state.config.kingsToEnd = 0))).toBeNull();
  });

  it('rejects a result whose drawer is not in the game', () => {
    const { s, result } = midGame();
    const o = JSON.parse(encodeSave(s, result));
    o.result.drawer.id = 'ghost';
    expect(decodeSave(JSON.stringify(o))).toBeNull();
  });

  it('prefs round-trip and drop invalid players', () => {
    const raw = encodePrefs({ sound: false, players: [{ name: 'Ann', group: 'girls' }] });
    expect(decodePrefs(raw)).toMatchObject({ sound: false, players: [{ name: 'Ann', group: 'girls' }] });
    const o = JSON.parse(raw);
    o.players.push({ name: 5, group: 'x' });
    expect(decodePrefs(JSON.stringify(o))?.players).toHaveLength(1);
    expect(decodePrefs('garbage')).toBeNull();
  });
});
