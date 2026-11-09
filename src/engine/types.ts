export type Suit = 'S' | 'H' | 'D' | 'C';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export type Group = 'guys' | 'girls' | 'other';

export interface Player {
  id: string;
  name: string;
  group: Group;
}

export type MiniGame = 'questions' | 'categories' | 'rhyme' | 'neverHaveIEver';

export type Effect =
  | { type: 'everyone' }
  | { type: 'drawerDrinks'; amount: number }
  | { type: 'give'; amount: number }
  | { type: 'miniGame'; game: MiniGame }
  | { type: 'thumbmaster' }
  | { type: 'group'; group: 'guys' | 'girls' }
  | { type: 'waterfall' };

export interface CardRule {
  rank: Rank;
  name: string;
  description: string;
  effect: Effect;
}

export interface GameConfig {
  /** Game ends when this many Kings have been drawn. */
  kingsToEnd: number;
}

export interface GameState {
  deck: Card[];
  discard: Card[];
  players: Player[];
  currentIndex: number;
  thumbmasterId: string | null;
  kingsDrawn: number;
  over: boolean;
  config: GameConfig;
}

/** Plain description of what a draw did; the UI just renders this. */
export interface DrawResult {
  card: Card;
  rule: CardRule;
  drawer: Player;
  /** Players who drink automatically because of this card. */
  drinkers: Player[];
  /** Number of drinks each listed drinker takes. */
  drinksEach: number;
  /** Drinks the drawer may hand out (Give card). */
  toGive: number;
  /** Order of drinking for Waterfall, starting with the drawer. */
  waterfallOrder: Player[];
  /** Player who starts the circle for mini-games. */
  starter: Player | null;
  /** Suggested prompt for mini-games. */
  prompt: string | null;
  /** The Thumbmaster after this draw. */
  thumbmaster: Player | null;
  gameOver: boolean;
}

export type Rng = () => number;
