import { useCallback } from 'react';
import { useSocketContext } from '../context/SocketContext';
import { useGameContext } from '../context/GameContext';
import { DeckDefinition, DeckType, RoomPrivacy, SanitizedRoomState } from '../types';

interface AckResponse {
  ok: boolean;
  message?: string;
  room?: SanitizedRoomState;
  rooms?: SanitizedRoomState[];
}

export function useGame() {
  const { socket, gamertag } = useSocketContext();
  const { room, setRoom } = useGameContext();

  const createRoom = useCallback(
    (opts: {
      name: string;
      maxPlayers: number;
      privacy: RoomPrivacy;
      deckType: DeckType;
      customDeck?: DeckDefinition;
      winScore?: number;
    }) => {
      return new Promise<AckResponse>((resolve) => {
        socket.emit('room:create', { ...opts, gamertag }, (res: AckResponse) => {
          if (res.ok && res.room) setRoom(res.room);
          resolve(res);
        });
      });
    },
    [socket, gamertag, setRoom]
  );

  const joinRoomByCode = useCallback(
    (code: string) => {
      return new Promise<AckResponse>((resolve) => {
        socket.emit('room:join', { code, gamertag }, (res: AckResponse) => {
          if (res.ok && res.room) setRoom(res.room);
          resolve(res);
        });
      });
    },
    [socket, gamertag, setRoom]
  );

  const joinRoomById = useCallback(
    (roomId: string) => {
      return new Promise<AckResponse>((resolve) => {
        socket.emit('room:join', { roomId, gamertag }, (res: AckResponse) => {
          if (res.ok && res.room) setRoom(res.room);
          resolve(res);
        });
      });
    },
    [socket, gamertag, setRoom]
  );

  const listPublicRooms = useCallback(() => {
    return new Promise<SanitizedRoomState[]>((resolve) => {
      socket.emit('lobby:list_rooms', {}, (res: AckResponse) => {
        resolve(res.rooms || []);
      });
    });
  }, [socket]);

  const startGame = useCallback(() => {
    if (!room) return;
    socket.emit('game:start', { roomId: room.id });
  }, [socket, room]);

  const askOpponent = useCallback(
    (targetPlayerId: string) => {
      if (!room) return;
      socket.emit('turn:action', { roomId: room.id, targetPlayerId });
    },
    [socket, room]
  );

  const resolveGuess = useCallback(
    (targetPlayerId: string, guessedCorrectly: boolean) => {
      if (!room) return;
      socket.emit('turn:resolve', { roomId: room.id, targetPlayerId, guessedCorrectly });
    },
    [socket, room]
  );

  const sendChatMessage = useCallback(
    (text: string) => {
      if (!room) return;
      socket.emit('chat:send_message', { roomId: room.id, text, gamertag });
    },
    [socket, room, gamertag]
  );

  return {
    room,
    createRoom,
    joinRoomByCode,
    joinRoomById,
    listPublicRooms,
    startGame,
    askOpponent,
    resolveGuess,
    sendChatMessage,
  };
}
