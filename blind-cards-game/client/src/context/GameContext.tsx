import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocketContext } from './SocketContext';
import { ChatMessage, GameOverStanding, SanitizedRoomState } from '../types';

interface GameContextValue {
  room: SanitizedRoomState | null;
  setRoom: (room: SanitizedRoomState | null) => void;
  messages: ChatMessage[];
  standings: GameOverStanding[] | null;
  errorMessage: string | null;
  clearError: () => void;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket } = useSocketContext();
  const [room, setRoom] = useState<SanitizedRoomState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [standings, setStandings] = useState<GameOverStanding[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const onStateUpdate = (state: SanitizedRoomState) => setRoom(state);
    const onNewMessage = (msg: ChatMessage) => setMessages((prev) => [...prev, msg]);
    const onGameOver = ({ standings }: { standings: GameOverStanding[] }) =>
      setStandings(standings);
    const onGameError = ({ message }: { message: string }) => setErrorMessage(message);

    socket.on('room:state_update', onStateUpdate);
    socket.on('chat:new_message', onNewMessage);
    socket.on('game:over', onGameOver);
    socket.on('error:game_error', onGameError);

    return () => {
      socket.off('room:state_update', onStateUpdate);
      socket.off('chat:new_message', onNewMessage);
      socket.off('game:over', onGameOver);
      socket.off('error:game_error', onGameError);
    };
  }, [socket]);

  const clearError = () => setErrorMessage(null);

  return (
    <GameContext.Provider value={{ room, setRoom, messages, standings, errorMessage, clearError }}>
      {children}
    </GameContext.Provider>
  );
};

export function useGameContext(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext debe usarse dentro de <GameProvider>');
  return ctx;
}
