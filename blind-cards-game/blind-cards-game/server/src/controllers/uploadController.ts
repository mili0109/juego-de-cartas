import AdmZip from 'adm-zip';
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { validateAndExtractDeck } from '../utils/deckValidator';
import { importBalatroSpriteSheet, isBalatroStyleZip } from '../utils/balatroImporter';

const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

/**
 * Sube un mazo personalizado. Detecta automáticamente el formato del ZIP:
 * - Si tiene deck.json en la raíz → formato "clásico" (deck.json + cards/).
 * - Si tiene una imagen PNG sin deck.json → se interpreta como spritesheet
 *   estilo Balatro (texturas/mods de Balatro) y se recorta automáticamente.
 */
export async function handleDeckUpload(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ message: 'No se recibió ningún archivo ZIP.' });
  }

  const deckId = uuidv4();
  const destinationDir = path.join(UPLOADS_ROOT, deckId);

  try {
    const zip = new AdmZip(req.file.path);
    const deckData = isBalatroStyleZip(zip)
      ? await importBalatroSpriteSheet(req.file.path, destinationDir)
      : validateAndExtractDeck(req.file.path, destinationDir);

    fs.unlink(req.file.path, () => {});

    return res.status(200).json({ deckId, deck: deckData });
  } catch (err) {
    fs.rm(destinationDir, { recursive: true, force: true }, () => {});
    fs.unlink(req.file.path, () => {});

    const message = err instanceof Error ? err.message : 'Error validando el mazo.';
    return res.status(400).json({ message });
  }
}
