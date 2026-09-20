import React, { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { uploadCustomDeck } from '../../services/api';
import { DeckDefinition } from '../../types';

const LIVES_OPTIONS = [3, 4, 5, 6, 7, 8, 9];

export const CreateRoomForm: React.FC = () => {
  const { createRoom } = useGame();
  const [name, setName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [isCustomDeck, setIsCustomDeck] = useState(false);
  const [deckFile, setDeckFile] = useState<File | null>(null);
  const [includeFaceCards, setIncludeFaceCards] = useState(true);
  const [livesPerPlayer, setLivesPerPlayer] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let deckToUse: DeckDefinition | undefined;

      if (isCustomDeck) {
        if (!deckFile) {
          throw new Error('Subí un archivo ZIP con tu mazo personalizado o spritesheet de Balatro.');
        }
        const uploaded = await uploadCustomDeck(deckFile);
        deckToUse = uploaded.deck as unknown as DeckDefinition;
      }

      const res = await createRoom({
        name,
        maxPlayers,
        privacy,
        deckType: isCustomDeck ? 'custom' : 'standard',
        customDeck: deckToUse,
        includeFaceCards,
        livesPerPlayer,
      });

      if (!res.ok) {
        throw new Error(res.message || 'No se pudo crear la sala.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando la sala.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleCreate} className="space-y-4 bg-panel p-6 rounded-xl">
      <h2 className="text-lg font-semibold">Crear Sala</h2>

      <div>
        <label className="block text-sm mb-1">Nombre de la Sala</label>
        <input
          className="w-full rounded-lg bg-slate-700 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Mesa de los viernes"
          required
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Capacidad Máxima</label>
        <select
          className="w-full rounded-lg bg-slate-700 px-3 py-2"
          value={maxPlayers}
          onChange={(e) => setMaxPlayers(Number(e.target.value))}
        >
          {[3, 4, 5, 6, 7, 8].map((n) => (
            <option key={n} value={n}>
              {n} jugadores
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm mb-1">
          Vidas por jugador <span className="text-slate-400">(para adivinar su carta)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {LIVES_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setLivesPerPlayer(n)}
              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                livesPerPlayer === n ? 'bg-emerald-600' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Privacidad</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPrivacy('public')}
            className={`flex-1 rounded-lg py-2 transition-colors ${
              privacy === 'public' ? 'bg-emerald-600' : 'bg-slate-700'
            }`}
          >
            Pública
          </button>
          <button
            type="button"
            onClick={() => setPrivacy('private')}
            className={`flex-1 rounded-lg py-2 transition-colors ${
              privacy === 'private' ? 'bg-emerald-600' : 'bg-slate-700'
            }`}
          >
            Privada
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Tipo de Baraja</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsCustomDeck(false)}
            className={`flex-1 rounded-lg py-2 transition-colors ${
              !isCustomDeck ? 'bg-emerald-600' : 'bg-slate-700'
            }`}
          >
            Póquer Regular
          </button>
          <button
            type="button"
            onClick={() => setIsCustomDeck(true)}
            className={`flex-1 rounded-lg py-2 transition-colors ${
              isCustomDeck ? 'bg-emerald-600' : 'bg-slate-700'
            }`}
          >
            Personalizada
          </button>
        </div>

        {isCustomDeck && (
          <div className="mt-2 space-y-2">
            <input
              type="file"
              accept=".zip"
              onChange={(e) => setDeckFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
            <p className="text-xs text-slate-300 leading-relaxed">
              Aceptamos dos formatos de ZIP:{' '}
              <strong className="text-slate-100">deck.json + carpeta cards/</strong> (formato clásico), o{' '}
              <strong className="text-slate-100">un spritesheet PNG estilo Balatro</strong> — subí
              directamente el archivo de textura de tu mod/pack de Balatro (grilla de 13x4, 71x95px por
              carta) y lo recortamos solos. Si tu pack usa otra grilla, incluí un{' '}
              <code className="bg-black/40 px-1 rounded">manifest.json</code> en el ZIP con{' '}
              <code className="bg-black/40 px-1 rounded">columns</code>,{' '}
              <code className="bg-black/40 px-1 rounded">rows</code>,{' '}
              <code className="bg-black/40 px-1 rounded">cardWidth</code> y{' '}
              <code className="bg-black/40 px-1 rounded">cardHeight</code>.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 bg-slate-700/60 rounded-lg px-3 py-2.5">
        <div>
          <p className="text-sm font-medium leading-tight">Jugar con figuras (J, Q, K, A)</p>
          <p className="text-xs text-slate-300 leading-tight">
            Desactivalo para jugar solo con cartas numéricas (2-10)
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={includeFaceCards}
          onClick={() => setIncludeFaceCards((v) => !v)}
          className="relative inline-flex shrink-0 items-center w-12 h-7 rounded-full p-0 border-0 transition-colors duration-200"
          style={{ backgroundColor: includeFaceCards ? '#059669' : '#64748b' }}
        >
          <span
            className="absolute rounded-full bg-white shadow transition-transform duration-200"
            style={{
              width: 20,
              height: 20,
              top: 4,
              left: 4,
              transform: includeFaceCards ? 'translateX(20px)' : 'translateX(0)',
            }}
          />
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 py-2 font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Creando...' : 'Crear Sala'}
      </button>
    </form>
  );
};
