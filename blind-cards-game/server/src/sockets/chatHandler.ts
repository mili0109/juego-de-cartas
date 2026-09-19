import { Server, Socket } from 'socket.io';
import { GameEngine } from '../game/GameEngine';
import { ChatMessage } from '../game/types';

interface SendMessagePayload {
  roomId: string;
  text: string;
  gamertag: string;
}

const MAX_MESSAGE_LENGTH = 300;

export function registerChatHandlers(io: Server, socket: Socket) {
  socket.on('chat:send_message', ({ roomId, text, gamertag }: SendMessagePayload) => {
    const trimmed = (text ?? '').trim();
    if (!trimmed) return;

    const message: ChatMessage = {
      sender: gamertag || 'Anónimo',
      text: trimmed.slice(0, MAX_MESSAGE_LENGTH),
      timestamp: Date.now(),
    };

    GameEngine.broadcastChatMessage(io, roomId, message);
  });
}
