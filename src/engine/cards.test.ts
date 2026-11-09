import { describe, expect, it } from 'vitest';
import { CARD_RULES, RANKS } from './cards';

describe('card rules table', () => {
  it('has a rule for every rank, keyed correctly', () => {
    expect(Object.keys(CARD_RULES).sort()).toEqual([...RANKS].sort());
    for (const rank of RANKS) {
      expect(CARD_RULES[rank].rank).toBe(rank);
      expect(CARD_RULES[rank].name.length).toBeGreaterThan(0);
      expect(CARD_RULES[rank].description.length).toBeGreaterThan(0);
    }
  });
});
