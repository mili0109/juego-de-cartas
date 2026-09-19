import React from 'react';
import { SanitizedPlayer } from '../../types';

interface Props {
  player: SanitizedPlayer;
  isCurrentTurn: boolean;
  isSelf: boolean;
  isSelectable: boolean;
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

export const PlayerCard: React.FC<Props> = ({ player, isCurrentTurn, isSelf, isSelectable, onSelect }) => {
  const hidden = player.card === 'HIDDEN' || player.card === null;
  const imageUrl = !hidden && player.card !== null && (player.card as any).file
    ? `${import.meta.env.VITE_SERVER_URL || 'http://localhost:4000'}/uploads/${(player.card as any).file}`
    : null;

  return (
    <button
      type="button"
      disabled={!isSelectable}
      onClick={onSelect}
      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 ease-out animate-deal-in ${
        isCurrentTurn ? 'ring-2 ring-yellow-400 animate-turn-pulse' : ''
      } ${isSelectable ? 'hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-900/40 hover:bg-slate-700 cursor-pointer' : ''} bg-slate-800`}
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
        <p className="text-sm font-medium">
          {player.gamertag} {isSelf && <span className="text-emerald-400">(vos)</span>}
        </p>
        <p className="text-xs text-slate-400">Aciertos: {player.guessedCount}</p>
        {!player.connected && <p className="text-xs text-red-400">Desconectado</p>}
      </div>
    </button>
  );
};
