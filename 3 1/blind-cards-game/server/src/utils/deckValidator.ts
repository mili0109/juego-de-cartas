import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { Card, DeckDefinition, Suit } from '../game/types';

const VALID_SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

/**
 * Valida y extrae un mazo personalizado subido como ZIP.
 * Requiere deck.json en la raíz con exactamente 52 cartas y sus imágenes en cards/.
 */
export function validateAndExtractDeck(
  zipFilePath: string,
  destinationDir: string
): DeckDefinition {
  const zip = new AdmZip(zipFilePath);
  const zipEntries = zip.getEntries();

  // 1. Buscar deck.json en la raíz
  const deckJsonEntry = zipEntries.find((entry) => entry.entryName === 'deck.json');
  if (!deckJsonEntry) {
    throw new Error('El archivo ZIP debe contener un deck.json en la raíz.');
  }

  // 2. Parsear JSON
  let deckData: DeckDefinition;
  try {
    deckData = JSON.parse(deckJsonEntry.getData().toString('utf8'));
  } catch {
    throw new Error('deck.json no es un JSON válido.');
  }

  if (!deckData.name || typeof deckData.name !== 'string') {
    throw new Error('deck.json debe incluir un "name" de mazo.');
  }

  // 3. Validar cantidad exacta de 52 cartas
  if (!Array.isArray(deckData.cards) || deckData.cards.length !== 52) {
    throw new Error('El mazo debe contener exactamente 52 cartas definidas.');
  }

  // 4. Validar que cada carta tenga palo/valor válidos y no haya duplicados
  const seen = new Set<string>();
  for (const card of deckData.cards) {
    validateCardShape(card);
    const key = `${card.suit}-${card.value}`;
    if (seen.has(key)) {
      throw new Error(`Carta duplicada detectada: ${card.suit} ${card.value}.`);
    }
    seen.add(key);

    // Verificar que el archivo de imagen referenciado exista dentro del ZIP
    const fileEntry = zipEntries.find((e) => e.entryName === card.file);
    if (!fileEntry) {
      throw new Error(`Falta la imagen referenciada: ${card.file}`);
    }
  }

  // Debe haber exactamente 13 cartas por cada uno de los 4 palos
  for (const suit of VALID_SUITS) {
    const count = deckData.cards.filter((c) => c.suit === suit).length;
    if (count !== 13) {
      throw new Error(`El palo "${suit}" debe tener 13 cartas (tiene ${count}).`);
    }
  }

  // 5. Extraer a la carpeta final de almacenamiento estático
  fs.mkdirSync(destinationDir, { recursive: true });
  zip.extractAllTo(destinationDir, true);

  // Reescribir la ruta "file" de cada carta como ruta accesible públicamente
  const publicDeckData: DeckDefinition = {
    ...deckData,
    cards: deckData.cards.map((c) => ({
      ...c,
      file: c.file ? path.posix.join(path.basename(destinationDir), c.file) : c.file,
    })),
  };

  return publicDeckData;
}

function validateCardShape(card: Partial<Card>) {
  if (!card.id || typeof card.id !== 'string') {
    throw new Error('Cada carta necesita un "id".');
  }
  if (!card.suit || !VALID_SUITS.includes(card.suit as Suit)) {
    throw new Error(`Palo inválido en la carta ${card.id}: ${card.suit}`);
  }
  if (!card.value || card.value < 1 || card.value > 13) {
    throw new Error(`Valor inválido en la carta ${card.id}: ${card.value}`);
  }
  if (!card.file || typeof card.file !== 'string') {
    throw new Error(`Falta la ruta de imagen ("file") en la carta ${card.id}.`);
  }
}
