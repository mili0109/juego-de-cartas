import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocketContext } from './SocketContext';
import { ChatMessage, GameOverStanding, SanitizedRoomState } from '../types';
import { playLifeLostSound } from '../services/sound';

interface LifeLostEvent {
  playerId: string;
  livesRemaining: number;
  eliminated: boolean;
  ts: number;
}

interface GameOverInfo {
  winnerId: string | null;
  winnerGamertag: string | null;
  standings: GameOverStanding[];
}

interface GameContextValue {
  room: SanitizedRoomState | null;
  setRoom: (room: SanitizedRoomState | null) => void;
  messages: ChatMessage[];
  gameOver: GameOverInfo | null;
  lastLifeLost: LifeLostEvent | null;
  errorMessage: string | null;
  clearError: () => void;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket } = useSocketContext();
  const [room, setRoom] = useState<SanitizedRoomState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [gameOver, setGameOver] = useState<GameOverInfo | null>(null);
  const [lastLifeLost, setLastLifeLost] = useState<LifeLostEvent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const onStateUpdate = (state: SanitizedRoomState) => setRoom(state);
    const onNewMessage = (msg: ChatMessage) => setMessages((prev) => [...prev, msg]);
    const onGameOver = (info: GameOverInfo) => setGameOver(info);
    const onGameError = ({ message }: { message: string }) => setErrorMessage(message);
    const onLifeLost = (payload: { playerId: string; livesRemaining: number; eliminated: boolean }) => {
      setLastLifeLost({ ...payload, ts: Date.now() });
      playLifeLostSound();
    };

    socket.on('room:state_update', onStateUpdate);
    socket.on('chat:new_message', onNewMessage);
    socket.on('game:over', onGameOver);
    socket.on('error:game_error', onGameError);
    socket.on('game:life_lost', onLifeLost);

    return () => {
      socket.off('room:state_update', onStateUpdate);
      socket.off('chat:new_message', onNewMessage);
      socket.off('game:over', onGameOver);
      socket.off('error:game_error', onGameError);
      socket.off('game:life_lost', onLifeLost);
    };
  }, [socket]);

  const clearError = () => setErrorMessage(null);

  return (
    <GameContext.Provider
      value={{ room, setRoom, messages, gameOver, lastLifeLost, errorMessage, clearError }}
    >
      {children}
    </GameContext.Provider>
  );
};

export function useGameContext(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext debe usarse dentro de <GameProvider>');
  return ctx;
}
