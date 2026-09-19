import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { validateAndExtractDeck } from '../utils/deckValidator';

const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

export function handleDeckUpload(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ message: 'No se recibió ningún archivo ZIP.' });
  }

  const deckId = uuidv4();
  const destinationDir = path.join(UPLOADS_ROOT, deckId);

  try {
    const deckData = validateAndExtractDeck(req.file.path, destinationDir);

    // Limpiar el ZIP temporal ya extraído
    fs.unlink(req.file.path, () => {});

    return res.status(200).json({
      deckId,
      deck: deckData,
    });
  } catch (err) {
    // Limpiar restos si la validación falló
    fs.rm(destinationDir, { recursive: true, force: true }, () => {});
    fs.unlink(req.file.path, () => {});

    const message = err instanceof Error ? err.message : 'Error validando el mazo.';
    return res.status(400).json({ message });
  }
}
