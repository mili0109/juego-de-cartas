import React from 'react';
import { useGame } from '../../hooks/useGame';
import { useSocketContext } from '../../context/SocketContext';

export const TurnControls: React.FC = () => {
  const { room, resolveGuess } = useGame();
  const { socket } = useSocketContext();

  if (!room) return null;

  const isMyTurn = room.currentTurnPlayerId === socket.id;
  const pending = room.pendingGuess;

  if (!isMyTurn) {
    const activePlayer = room.players.find((p) => p.id === room.currentTurnPlayerId);
    return (
      <div className="bg-slate-800 rounded-xl p-4 text-center text-sm text-slate-300">
        {pending
          ? `${activePlayer?.gamertag ?? 'El jugador activo'} está esperando una respuesta...`
          : `Turno de ${activePlayer?.gamertag ?? '...'}`}
      </div>
    );
  }

  if (!pending) {
    return (
      <div className="bg-slate-800 rounded-xl p-4 text-center text-sm text-slate-300">
        Es tu turno — elegí a un oponente arriba para darle una pista o hacerle una pregunta.
      </div>
    );
  }

  const targetPlayer = room.players.find((p) => p.id === pending.targetPlayerId);

  return (
    <div className="bg-slate-800 rounded-xl p-4 space-y-3 text-center">
      <p className="text-sm text-slate-300">
        ¿<strong>{targetPlayer?.gamertag}</strong> adivinó su carta?
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => resolveGuess(pending.targetPlayerId, true)}
          className="rounded-lg bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500"
        >
          ¡Sí Adivinó!
        </button>
        <button
          onClick={() => resolveGuess(pending.targetPlayerId, false)}
          className="rounded-lg bg-rose-600 px-4 py-2 font-medium hover:bg-rose-500"
        >
          No Adivinó
        </button>
      </div>
    </div>
  );
};
