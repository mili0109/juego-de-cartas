import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { socket } from '../services/socket';

interface SocketContextValue {
  socket: Socket;
  connected: boolean;
  gamertag: string;
  setGamertag: (name: string) => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

const GAMERTAG_KEY = 'blind_cards_gamertag';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(socket.connected);
  const [gamertag, setGamertagState] = useState<string>(
    () => localStorage.getItem(GAMERTAG_KEY) || ''
  );

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const setGamertag = (name: string) => {
    localStorage.setItem(GAMERTAG_KEY, name);
    setGamertagState(name);
  };

  return (
    <SocketContext.Provider value={{ socket, connected, gamertag, setGamertag }}>
      {children}
    </SocketContext.Provider>
  );
};

export function useSocketContext(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocketContext debe usarse dentro de <SocketProvider>');
  return ctx;
}
