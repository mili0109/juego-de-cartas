import React, { useEffect, useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { useSocketContext } from '../../context/SocketContext';
import { SanitizedRoomState } from '../../types';

export const RoomList: React.FC = () => {
  const { listPublicRooms, joinRoomById } = useGame();
  const { socket } = useSocketContext();
  const [rooms, setRooms] = useState<SanitizedRoomState[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const list = await listPublicRooms();
    setRooms(list);
  };

  useEffect(() => {
    refresh();
    const onUpdate = (list: SanitizedRoomState[]) => setRooms(list);
    socket.on('lobby:rooms_update', onUpdate);
    return () => {
      socket.off('lobby:rooms_update', onUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJoin = async (roomId: string) => {
    setError(null);
    const res = await joinRoomById(roomId);
    if (!res.ok) setError(res.message || 'No se pudo unir a la sala.');
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Salas Públicas</h3>
        <button onClick={refresh} className="text-xs text-emerald-400 hover:underline">
          Actualizar
        </button>
      </div>

      {rooms.length === 0 && (
        <p className="text-sm text-slate-400">No hay salas públicas disponibles ahora mismo.</p>
      )}

      <ul className="space-y-2">
        {rooms.map((room) => (
          <li
            key={room.id}
            className="flex items-center justify-between bg-slate-700 rounded-lg px-3 py-2"
          >
            <div>
              <p className="font-medium">{room.config.name}</p>
              <p className="text-xs text-slate-400">
                Anfitrión: {room.players.find((p) => p.isHost)?.gamertag ?? '—'} ·{' '}
                {room.config.deckType === 'custom' ? 'Baraja personalizada' : 'Póquer regular'} ·{' '}
                {room.players.length}/{room.config.maxPlayers} jugadores
              </p>
            </div>
            <button
              onClick={() => handleJoin(room.id)}
              className="rounded-lg bg-emerald-600 px-3 py-1 text-sm hover:bg-emerald-500"
            >
              Unirse
            </button>
          </li>
        ))}
      </ul>

      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
};
