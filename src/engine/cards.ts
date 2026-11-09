import type { Card, CardRule, Rank, Suit } from './types';

export const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const SUIT_SYMBOL: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };

/** Card rules are data: change the game by editing this table. */
export const CARD_RULES: Record<Rank, CardRule> = {
  A: { rank: 'A', name: 'Social', description: 'Everyone takes a drink.', effect: { type: 'everyone' } },
  '2': { rank: '2', name: 'You Drink', description: 'You take 2 drinks.', effect: { type: 'drawerDrinks', amount: 2 } },
  '3': { rank: '3', name: 'You Drink', description: 'You take 3 drinks.', effect: { type: 'drawerDrinks', amount: 3 } },
  '4': {
    rank: '4',
    name: 'Questions',
    description:
      'Ask someone a question. They must ask someone else a question. First to stutter, answer, or stall drinks.',
    effect: { type: 'miniGame', game: 'questions' },
  },
  '5': { rank: '5', name: 'Give 5', description: 'Hand out 5 drinks however you like.', effect: { type: 'give', amount: 5 } },
  '6': {
    rank: '6',
    name: 'Never Have I Ever',
    description: 'Say something you have never done. Anyone who has done it drinks.',
    effect: { type: 'miniGame', game: 'neverHaveIEver' },
  },
  '7': {
    rank: '7',
    name: 'Thumbmaster',
    description:
      'You are the Thumbmaster. Whenever you like, quietly put your thumb on the table. Last to notice drinks.',
    effect: { type: 'thumbmaster' },
  },
  '8': {
    rank: '8',
    name: 'Categories',
    description: 'Pick a category. Go around naming things in it. First to stall or repeat drinks.',
    effect: { type: 'miniGame', game: 'categories' },
  },
  '9': {
    rank: '9',
    name: 'Rhyme',
    description: 'Say a word. Go around rhyming with it. First to hesitate or fail drinks.',
    effect: { type: 'miniGame', game: 'rhyme' },
  },
  '10': { rank: '10', name: 'Social', description: 'Everyone takes a drink.', effect: { type: 'everyone' } },
  J: { rank: 'J', name: 'Guys Drink', description: 'All the guys take a drink.', effect: { type: 'group', group: 'guys' } },
  Q: { rank: 'Q', name: 'Girls Drink', description: 'All the girls take a drink.', effect: { type: 'group', group: 'girls' } },
  K: {
    rank: 'K',
    name: 'Waterfall',
    description:
      'Start drinking. The next player starts when you do, and nobody stops until the player before them stops.',
    effect: { type: 'waterfall' },
  },
};

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit });
  return deck;
}

export const CATEGORIES = [
  'Car brands', 'Beer brands', 'Cocktails', 'Pizza toppings', 'Superheroes', 'Countries in Europe',
  'Fast food chains', 'Movie titles with a number', 'Things in a kitchen', 'Famous Johns',
  'Types of dogs', 'Candy bars', 'Video game characters', 'Board games', 'Things that are red',
  'Sports teams', 'Reasons to be late', 'Things you find at a bar', 'Disney movies', 'Cereals',
];

export const RHYME_WORDS = [
  'cat', 'beer', 'night', 'shot', 'drink', 'wine', 'floor', 'door', 'game', 'cheers',
  'tequila', 'party', 'dance', 'friend', 'lose', 'blue', 'spin', 'round', 'light', 'chair',
];

export const NEVER_HAVE_I_EVER = [
  'Never have I ever sent a text to the wrong person.',
  'Never have I ever fallen asleep at a party.',
  'Never have I ever lied about my age.',
  'Never have I ever been kicked out of a place.',
  'Never have I ever forgotten a friend’s birthday.',
  'Never have I ever missed a flight.',
  'Never have I ever danced on a table.',
  'Never have I ever pretended to be sick to skip something.',
  'Never have I ever eaten food off the floor.',
  'Never have I ever sung karaoke.',
];
