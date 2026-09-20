export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export interface Card {
  id: string;
  suit: Suit;
  value: number;
  file?: string;
}

export interface DeckDefinition {
  name: string;
  author?: string;
  cards: Card[];
}

export type DeckType = 'standard' | 'custom';
export type RoomPrivacy = 'public' | 'private';
export type RoomStatus = 'lobby' | 'in_progress' | 'finished';

export interface SanitizedPlayer {
  id: string;
  gamertag: string;
  isHost: boolean;
  card: Card | 'HIDDEN' | null;
  guessedCount: number;
  connected: boolean;
}

export interface SanitizedRoomState {
  id: string;
  code: string;
  config: {
    name: string;
    maxPlayers: number;
    privacy: RoomPrivacy;
    deckType: DeckType;
    winScore: number;
    includeFaceCards: boolean;
    hasCustomDeck: boolean;
  };
  hostId: string;
  players: SanitizedPlayer[];
  status: RoomStatus;
  currentTurnPlayerId: string | null;
  pendingGuess: { targetPlayerId: string } | null;
  cardsRemaining: number;
}

export interface ChatMessage {
  sender: string;
  text: string;
  timestamp: number;
}

export interface GameOverStanding {
  id: string;
  gamertag: string;
  guessedCount: number;
}
