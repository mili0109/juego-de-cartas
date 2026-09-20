export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export interface Card {
  id: string; // ej: "AS", "10H", "KC"
  suit: Suit;
  value: number; // 1-13 (1=As, 11=J, 12=Q, 13=K)
  file?: string; // ruta de imagen si es mazo personalizado
}

export interface DeckDefinition {
  name: string;
  author?: string;
  cards: Card[];
}

export type DeckType = 'standard' | 'custom';

export interface Player {
  id: string; // socket.id
  gamertag: string;
  isHost: boolean;
  card: Card | null; // carta real en el servidor (nunca se envía al dueño)
  guessedCount: number;
  connected: boolean;
}

export type RoomPrivacy = 'public' | 'private';

export type RoomStatus = 'lobby' | 'in_progress' | 'finished';

export interface RoomConfig {
  name: string;
  maxPlayers: number; // 3-8
  privacy: RoomPrivacy;
  deckType: DeckType;
  customDeck?: DeckDefinition;
  winScore: number; // límite de cartas adivinadas para ganar
  includeFaceCards: boolean; // si es false, se excluyen J, Q, K y As del mazo estándar
}

export interface RoomState {
  id: string;
  code: string; // código de acceso de 6 caracteres
  config: RoomConfig;
  hostId: string;
  players: Player[];
  drawPile: Card[];
  discardPile: Card[];
  status: RoomStatus;
  currentTurnPlayerId: string | null;
  pendingGuess: { targetPlayerId: string } | null; // pregunta activa en curso
  createdAt: number;
}

// Estado "sanitizado" que se envía a cada jugador: su propia carta se oculta
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
  config: Omit<RoomConfig, 'customDeck'> & { hasCustomDeck: boolean };
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
