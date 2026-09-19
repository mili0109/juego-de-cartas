import React from 'react';
import { useGame } from '../../hooks/useGame';
import { useSocketContext } from '../../context/SocketContext';
import { useGameContext } from '../../context/GameContext';
import { PlayerCard } from './PlayerCard';
import { TurnControls } from './TurnControls';
import { TextChat } from '../Chat/TextChat';
import { VoiceChat } from '../Voice/VoiceChat';

export const GameTable: React.FC = () => {
  const { room, startGame, askOpponent } = useGame();
  const { socket } = useSocketContext();
  const { standings } = useGameContext();

  if (!room) return null;

  const isHost = room.hostId === socket.id;
  const isMyTurn = room.currentTurnPlayerId === socket.id;
  const canSelectTarget = isMyTurn && !room.pendingGuess;

  return (
    <div className="max-w-5xl mx-auto mt-8 space-y-6">
      <div className="flex items-center justify-between bg-slate-800 rounded-xl p-4">
        <div>
          <h1 className="text-xl font-semibold">{room.config.name}</h1>
          <p className="text-xs text-slate-400">
            Código: <span className="font-mono">{room.code}</span> · Mazo restante:{' '}
            {room.cardsRemaining} cartas
          </p>
        </div>
        {room.status === 'lobby' && isHost && (
          <button
            onClick={startGame}
            disabled={room.players.length < 3}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500 disabled:opacity-40"
          >
            Iniciar Partida ({room.players.length}/{room.config.maxPlayers})
          </button>
        )}
        {room.status === 'lobby' && !isHost && (
          <span className="text-sm text-slate-400">Esperando a que el anfitrión inicie...</span>
        )}
      </div>

      {standings && (
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="font-semibold mb-2">🏆 Fin de la partida</h2>
          <ol className="space-y-1 text-sm">
            {standings.map((s, idx) => (
              <li key={s.id}>
                {idx + 1}. {s.gamertag} — {s.guessedCount} aciertos
              </li>
            ))}
          </ol>
        </div>
      )}

      {room.status !== 'lobby' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {room.players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isCurrentTurn={player.id === room.currentTurnPlayerId}
                isSelf={player.id === socket.id}
                isSelectable={canSelectTarget && player.id !== socket.id}
                onSelect={() => askOpponent(player.id)}
              />
            ))}
          </div>

          <TurnControls />
        </>
      )}

      {room.status === 'lobby' && (
        <div className="bg-slate-800 rounded-xl p-4">
          <h3 className="font-semibold mb-2">Jugadores en la sala</h3>
          <ul className="text-sm space-y-1">
            {room.players.map((p) => (
              <li key={p.id}>
                {p.gamertag} {p.isHost && <span className="text-emerald-400">(anfitrión)</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextChat />
        <VoiceChat />
      </div>
    </div>
  );
};
