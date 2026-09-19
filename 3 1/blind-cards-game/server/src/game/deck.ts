import { Card, DeckDefinition, Suit } from './types';

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

/** Genera la baraja estándar de póquer (52 cartas), o solo numéricas (2-10) si se excluyen figuras. */
export function buildStandardDeck(includeFaceCards: boolean = true): Card[] {
  const cards: Card[] = [];
  for (const suit of SUITS) {
    for (let value = 1; value <= 13; value++) {
      const isFaceOrAce = value === 1 || value >= 11; // As, J, Q, K
      if (!includeFaceCards && isFaceOrAce) continue;
      cards.push({
        id: `${cardValueLabel(value)}${suit[0].toUpperCase()}`,
        suit,
        value,
      });
    }
  }
  return cards;
}

/** Construye la baraja a partir de una definición de mazo personalizado ya validada. */
export function buildDeckFromDefinition(def: DeckDefinition): Card[] {
  return def.cards.map((c) => ({ ...c }));
}

function cardValueLabel(value: number): string {
  if (value === 1) return 'A';
  if (value === 11) return 'J';
  if (value === 12) return 'Q';
  if (value === 13) return 'K';
  return String(value);
}

/** Fisher-Yates shuffle, no muta el arreglo original. */
export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
