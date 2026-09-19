import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { Card, DeckDefinition, Suit } from '../game/types';

/**
 * Manifiesto opcional (manifest.json) que puede incluirse en el ZIP para ajustar
 * la grilla del spritesheet. Si no se incluye, se usan los valores por defecto,
 * que coinciden con la convención más común de los packs de textura de Balatro:
 * 13 columnas (rangos 2..A) x 4 filas (palos), tamaño de carta 71x95px (o el doble
 * a escala 2x, que se detecta automáticamente según el tamaño real de la imagen).
 */
interface BalatroManifest {
  name?: string;
  author?: string;
  columns?: number;
  rows?: number;
  cardWidth?: number;
  cardHeight?: number;
  marginX?: number;
  marginY?: number;
  // Orden de rangos por columna, de izquierda a derecha
  rankOrder?: string[];
  // Orden de palos por fila, de arriba hacia abajo
  suitOrder?: Suit[];
}

const DEFAULT_RANK_ORDER = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const DEFAULT_SUIT_ORDER: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];

function rankToValue(rank: string): number {
  if (rank === 'A') return 1;
  if (rank === 'J') return 11;
  if (rank === 'Q') return 12;
  if (rank === 'K') return 13;
  return Number(rank);
}

/**
 * Detecta si el ZIP subido es un spritesheet estilo Balatro (una sola imagen PNG,
 * sin deck.json) en lugar del formato de mazo personalizado "clásico" (deck.json + cards/).
 */
export function isBalatroStyleZip(zip: AdmZip): boolean {
  const entries = zip.getEntries();
  const hasDeckJson = entries.some((e) => e.entryName === 'deck.json');
  const pngEntries = entries.filter((e) => e.entryName.toLowerCase().endsWith('.png') && !e.isDirectory);
  return !hasDeckJson && pngEntries.length >= 1;
}

export async function importBalatroSpriteSheet(
  zipFilePath: string,
  destinationDir: string
): Promise<DeckDefinition> {
  const zip = new AdmZip(zipFilePath);
  const entries = zip.getEntries();

  const manifestEntry = entries.find((e) => e.entryName === 'manifest.json');
  const manifest: BalatroManifest = manifestEntry
    ? JSON.parse(manifestEntry.getData().toString('utf8'))
    : {};

  const pngEntries = entries.filter((e) => e.entryName.toLowerCase().endsWith('.png') && !e.isDirectory);
  if (pngEntries.length === 0) {
    throw new Error('El ZIP debe contener al menos una imagen PNG (el spritesheet).');
  }
  // Si hay varias imágenes, se usa la más grande (asumida como la hoja principal a 1x o 2x)
  const sheetEntry = pngEntries.reduce((largest, current) =>
    current.header.size > largest.header.size ? current : largest
  );

  const columns = manifest.columns ?? 13;
  const rows = manifest.rows ?? 4;
  const rankOrder = manifest.rankOrder ?? DEFAULT_RANK_ORDER;
  const suitOrder = manifest.suitOrder ?? DEFAULT_SUIT_ORDER;

  if (rankOrder.length !== columns) {
    throw new Error(`rankOrder debe tener ${columns} elementos (uno por columna).`);
  }
  if (suitOrder.length !== rows) {
    throw new Error(`suitOrder debe tener ${rows} elementos (uno por fila).`);
  }

  const sheetBuffer = sheetEntry.getData();
  const sheetImage = sharp(sheetBuffer);
  const metadata = await sheetImage.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error('No se pudo leer el tamaño de la imagen del spritesheet.');
  }

  // Si no se especifica el tamaño de carta, se calcula dividiendo la imagen en la grilla
  // (esto detecta automáticamente si el pack está a escala 1x o 2x).
  const cardWidth = manifest.cardWidth ?? Math.floor(metadata.width / columns);
  const cardHeight = manifest.cardHeight ?? Math.floor(metadata.height / rows);
  const marginX = manifest.marginX ?? 0;
  const marginY = manifest.marginY ?? 0;

  const expectedWidth = columns * cardWidth;
  const expectedHeight = rows * cardHeight;
  if (expectedWidth > metadata.width || expectedHeight > metadata.height) {
    throw new Error(
      `La grilla configurada (${columns}x${rows} de ${cardWidth}x${cardHeight}px) no entra en la imagen (${metadata.width}x${metadata.height}px). Ajustá manifest.json.`
    );
  }

  const cardsDir = path.join(destinationDir, 'cards');
  fs.mkdirSync(cardsDir, { recursive: true });

  const cards: Card[] = [];

  for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
    const suit = suitOrder[rowIdx];
    for (let colIdx = 0; colIdx < columns; colIdx++) {
      const rank = rankOrder[colIdx];
      const value = rankToValue(rank);
      const fileName = `${rank}${suit[0].toUpperCase()}.png`;
      const left = marginX + colIdx * cardWidth;
      const top = marginY + rowIdx * cardHeight;

      // eslint-disable-next-line no-await-in-loop
      await sharp(sheetBuffer)
        .extract({ left, top, width: cardWidth, height: cardHeight })
        .toFile(path.join(cardsDir, fileName));

      cards.push({
        id: `${rank}${suit[0].toUpperCase()}`,
        suit,
        value,
        file: path.posix.join('cards', fileName),
      });
    }
  }

  const publicCards = cards.map((c) => ({
    ...c,
    file: path.posix.join(path.basename(destinationDir), c.file as string),
  }));

  return {
    name: manifest.name || 'Mazo importado de Balatro',
    author: manifest.author,
    cards: publicCards,
  };
}
