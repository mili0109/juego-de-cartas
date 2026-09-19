import { Server, Socket } from 'socket.io';
import { GameEngine } from '../game/GameEngine';

interface TurnActionPayload {
  roomId: string;
  targetPlayerId: string;
}

interface TurnResolvePayload {
  roomId: string;
  targetPlayerId: string;
  guessedCorrectly: boolean;
}

export function registerGameHandlers(io: Server, socket: Socket) {
  // El jugador activo elige a quién preguntarle / darle una pista
  socket.on('turn:action', ({ roomId, targetPlayerId }: TurnActionPayload, ack?: (res: any) => void) => {
    try {
      const room = GameEngine.beginQuestion(roomId, socket.id, targetPlayerId);
      GameEngine.broadcastSanitizedState(io, room.id);
      ack?.({ ok: true });
    } catch (err) {
      const message = errorMessage(err);
      ack?.({ ok: false, message });
      socket.emit('error:game_error', { message });
    }
  });

  // El jugador activo confirma si el oponente acertó o no
  socket.on(
    'turn:resolve',
    ({ roomId, targetPlayerId, guessedCorrectly }: TurnResolvePayload, ack?: (res: any) => void) => {
      try {
        const gameState = GameEngine.getRoom(roomId);
        if (!gameState) throw new Error('Sala no encontrada.');

        if (gameState.currentTurnPlayerId !== socket.id) {
          throw new Error('No es tu turno.');
        }

        const { room, gameOver } = GameEngine.resolveGuess(
          roomId,
          socket.id,
          targetPlayerId,
          guessedCorrectly
        );

        io.to(room.id).emit('game:card_guessed', {
          playerId: targetPlayerId,
          wasCorrect: guessedCorrectly,
          newCardAssigned: guessedCorrectly,
        });

        GameEngine.broadcastSanitizedState(io, room.id);

        if (gameOver) {
          io.to(room.id).emit('game:over', {
            standings: room.players
              .map((p) => ({ id: p.id, gamertag: p.gamertag, guessedCount: p.guessedCount }))
              .sort((a, b) => b.guessedCount - a.guessedCount),
          });
        }

        ack?.({ ok: true });
      } catch (err) {
        const message = errorMessage(err);
        ack?.({ ok: false, message });
        socket.emit('error:game_error', { message });
      }
    }
  );
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Error desconocido.';
}
