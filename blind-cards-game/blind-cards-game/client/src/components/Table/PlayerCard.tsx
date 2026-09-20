import React, { useEffect, useState } from 'react';
import { SanitizedPlayer } from '../../types';

interface Props {
  player: SanitizedPlayer;
  isCurrentTurn: boolean;
  isSelf: boolean;
  isSelectable: boolean;
  justLostLife: number | null; // timestamp del último golpe, o null
  onSelect?: () => void;
}

function cardLabel(card: SanitizedPlayer['card']): string {
  if (card === 'HIDDEN' || card === null) return '?';
  const suitSymbols: Record<string, string> = {
    spades: '♠',
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
  };
  const valueLabel =
    card.value === 1 ? 'A' : card.value === 11 ? 'J' : card.value === 12 ? 'Q' : card.value === 13 ? 'K' : String(card.value);
  return `${valueLabel}${suitSymbols[card.suit]}`;
}

export const PlayerCard: React.FC<Props> = ({
  player,
  isCurrentTurn,
  isSelf,
  isSelectable,
  justLostLife,
  onSelect,
}) => {
  const [shaking, setShaking] = useState(false);
  const hidden = player.card === 'HIDDEN' || player.card === null;
  const imageUrl = !hidden && player.card !== null && (player.card as any).file
    ? `${import.meta.env.VITE_SERVER_URL || 'http://localhost:4000'}/uploads/${(player.card as any).file}`
    : null;

  useEffect(() => {
    if (justLostLife === null) return;
    setShaking(true);
    const timeout = setTimeout(() => setShaking(false), 500);
    return () => clearTimeout(timeout);
  }, [justLostLife]);

  return (
    <button
      type="button"
      disabled={!isSelectable}
      onClick={onSelect}
      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 ease-out animate-deal-in bg-panel ${
        isCurrentTurn ? 'ring-2 ring-yellow-400 animate-turn-pulse' : ''
      } ${shaking ? 'animate-life-lost' : ''} ${
        isSelectable ? 'hover:-translate-y-1 hover:shadow-lg hover:shadow-black/40 cursor-pointer' : ''
      } ${player.eliminated ? 'opacity-40 grayscale' : ''}`}
    >
      <div
        className={`w-16 h-24 rounded-lg flex items-center justify-center text-2xl font-bold border-2 overflow-hidden transition-transform duration-300 animate-card-float ${
          hidden
            ? 'bg-gradient-to-br from-indigo-700 to-indigo-900 border-indigo-500'
            : 'bg-white text-slate-900 border-slate-300'
        }`}
      >
        {hidden ? (
          '🂠'
        ) : imageUrl ? (
          <img src={imageUrl} alt={cardLabel(player.card)} className="w-full h-full object-cover" />
        ) : (
          cardLabel(player.card)
        )}
      </div>

      <div className="text-center">
        <p className="text-sm font-medium flex items-center justify-center gap-1">
          <span aria-hidden>{player.avatar}</span>
          {player.gamertag} {isSelf && <span className="text-emerald-400">(vos)</span>}
        </p>
        <p className="text-xs text-slate-300">Aciertos: {player.guessedCount}</p>
        <div className="flex items-center justify-center gap-0.5 mt-1" title={`${player.lives} vidas`}>
          {Array.from({ length: player.lives }).map((_, i) => (
            <span key={i} className="text-xs" aria-hidden>
              ❤️
            </span>
          ))}
          {player.eliminated && <span className="text-xs text-red-400 ml-1">Eliminado</span>}
        </div>
        {!player.connected && <p className="text-xs text-red-400">Desconectado</p>}
      </div>
    </button>
  );
};
