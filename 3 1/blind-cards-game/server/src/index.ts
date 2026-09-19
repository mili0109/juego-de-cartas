import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import multer from 'multer';
import { Server } from 'socket.io';

import { handleDeckUpload } from './controllers/uploadController';
import { generateVoiceToken } from './controllers/voiceController';
import { registerRoomHandlers } from './sockets/roomHandler';
import { registerGameHandlers } from './sockets/gameHandler';
import { registerChatHandlers } from './sockets/chatHandler';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

// CLIENT_ORIGIN admite una o varias URLs separadas por coma
// (útil para permitir localhost en desarrollo + el dominio de producción a la vez)
const ALLOWED_ORIGINS = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'] };

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

// Sirve las imágenes de mazos personalizados ya extraídos
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// --- Rutas HTTP ---
const upload = multer({ dest: path.join(__dirname, '..', 'uploads', 'tmp') });
app.post('/api/decks/upload', upload.single('deck'), handleDeckUpload);
app.post('/api/voice/token', generateVoiceToken);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// --- Servidor HTTP + Socket.io ---
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: corsOptions });

io.on('connection', (socket) => {
  registerRoomHandlers(io, socket);
  registerGameHandlers(io, socket);
  registerChatHandlers(io, socket);
});

httpServer.listen(PORT, () => {
  console.log(`Servidor Blind Cards escuchando en http://localhost:${PORT}`);
});
