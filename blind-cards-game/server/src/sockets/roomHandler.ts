import { Server, Socket } from 'socket.io';
import { GameEngine } from '../game/GameEngine';
import { DeckDefinition, RoomConfig } from '../game/types';

interface CreateRoomPayload {
  name: string;
  maxPlayers: number;
  privacy: 'public' | 'private';
  deckType: 'standard' | 'custom';
  customDeck?: DeckDefinition;
  winScore?: number;
  gamertag: string;
}

interface JoinRoomPayload {
  roomId?: string;
  code?: string;
  gamertag: string;
}

export function registerRoomHandlers(io: Server, socket: Socket) {
  socket.on('room:create', (payload: CreateRoomPayload, ack?: (res: any) => void) => {
    try {
      const config: RoomConfig = {
        name: payload.name?.trim() || 'Sala sin nombre',
        maxPlayers: clamp(payload.maxPlayers ?? 6, 3, 8),
        privacy: payload.privacy === 'private' ? 'private' : 'public',
        deckType: payload.deckType === 'custom' ? 'custom' : 'standard',
        customDeck: payload.deckType === 'custom' ? payload.customDeck : undefined,
        winScore: payload.winScore ?? 5,
      };

      const room = GameEngine.createRoom(config, socket.id, payload.gamertag || 'Jugador');
      socket.join(room.id);

      const state = GameEngine.sanitizeForPlayer(room, socket.id);
      ack?.({ ok: true, room: state });
      io.emit('lobby:rooms_update', GameEngine.listPublicRooms().map((r) =>
        GameEngine.sanitizeForPlayer(r, '')
      ));
    } catch (err) {
      ack?.({ ok: false, message: errorMessage(err) });
    }
  });

  socket.on('room:join', (payload: JoinRoomPayload, ack?: (res: any) => void) => {
    try {
      const room = payload.code
        ? GameEngine.findRoomByCode(payload.code)
        : payload.roomId
        ? GameEngine.getRoom(payload.roomId)
        : undefined;

      if (!room) {
        throw new Error('Sala no encontrada. Revisá el código o el ID.');
      }

      const updated = GameEngine.joinRoom(room.id, socket.id, payload.gamertag || 'Jugador');
      socket.join(updated.id);

      GameEngine.broadcastSanitizedState(io, updated.id);
      const state = GameEngine.sanitizeForPlayer(updated, socket.id);
      ack?.({ ok: true, room: state });

      io.emit('lobby:rooms_update', GameEngine.listPublicRooms().map((r) =>
        GameEngine.sanitizeForPlayer(r, '')
      ));
    } catch (err) {
      ack?.({ ok: false, message: errorMessage(err) });
    }
  });

  socket.on('lobby:list_rooms', (_payload, ack?: (res: any) => void) => {
    const rooms = GameEngine.listPublicRooms().map((r) => GameEngine.sanitizeForPlayer(r, ''));
    ack?.({ ok: true, rooms });
  });

  socket.on('game:start', ({ roomId }: { roomId: string }, ack?: (res: any) => void) => {
    try {
      const room = GameEngine.startGame(roomId);
      GameEngine.broadcastSanitizedState(io, room.id);
      io.to(room.id).emit('game:deck_dealt', { message: 'Las cartas fueron repartidas.' });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, message: errorMessage(err) });
      socket.emit('error:game_error', { message: errorMessage(err) });
    }
  });

  socket.on('disconnect', () => {
    const result = GameEngine.removePlayer(socket.id);
    if (result) {
      GameEngine.broadcastSanitizedState(io, result.room.id);
      io.emit('lobby:rooms_update', GameEngine.listPublicRooms().map((r) =>
        GameEngine.sanitizeForPlayer(r, '')
      ));
    }
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Error desconocido.';
}
