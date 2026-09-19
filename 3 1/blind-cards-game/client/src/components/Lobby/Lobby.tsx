import React, { useState } from 'react';
import { useSocketContext } from '../../context/SocketContext';
import { CreateRoomForm } from './CreateRoomForm';
import { JoinRoomForm } from './JoinRoomForm';
import { RoomList } from './RoomList';

type Tab = 'create' | 'join';

export const Lobby: React.FC = () => {
  const { gamertag, setGamertag } = useSocketContext();
  const [tab, setTab] = useState<Tab>('join');
  const [nameInput, setNameInput] = useState(gamertag);

  if (!gamertag) {
    return (
      <div className="max-w-sm mx-auto mt-24 bg-slate-800 p-6 rounded-xl space-y-4 animate-fade-in">
        <h1 className="text-xl font-semibold text-center">Blind Cards</h1>
        <p className="text-sm text-slate-400 text-center">Elegí tu gamertag para continuar</p>
        <input
          className="w-full rounded-lg bg-slate-700 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder="Tu nombre de jugador"
        />
        <button
          onClick={() => nameInput.trim() && setGamertag(nameInput.trim())}
          className="w-full rounded-lg bg-emerald-600 py-2 font-medium hover:bg-emerald-500 transition-colors"
        >
          Continuar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setGamertag('')}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span aria-hidden>←</span> Cambiar gamertag
        </button>
        <h1 className="text-2xl font-semibold">🃏 Blind Cards</h1>
        <span className="text-sm text-slate-400">Jugando como {gamertag}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('create')}
          className={`flex-1 rounded-lg py-2 font-medium transition-colors ${
            tab === 'create' ? 'bg-emerald-600' : 'bg-slate-800'
          }`}
        >
          Crear Sala
        </button>
        <button
          onClick={() => setTab('join')}
          className={`flex-1 rounded-lg py-2 font-medium transition-colors ${
            tab === 'join' ? 'bg-emerald-600' : 'bg-slate-800'
          }`}
        >
          Unirse a Sala
        </button>
      </div>

      {tab === 'create' ? (
        <CreateRoomForm />
      ) : (
        <div className="space-y-4">
          <JoinRoomForm />
          <RoomList />
        </div>
      )}
    </div>
  );
};
