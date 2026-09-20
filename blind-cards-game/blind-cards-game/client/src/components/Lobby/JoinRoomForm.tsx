import React, { useState } from 'react';
import { useGame } from '../../hooks/useGame';

export const JoinRoomForm: React.FC = () => {
  const { joinRoomByCode } = useGame();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await joinRoomByCode(code);
    setLoading(false);
    if (!res.ok) setError(res.message || 'No se pudo unir a la sala.');
  };

  return (
    <form onSubmit={handleJoin} className="bg-slate-800 p-6 rounded-xl space-y-3">
      <h3 className="font-semibold">Sala Privada</h3>
      <input
        className="w-full rounded-lg bg-slate-700 px-3 py-2 uppercase tracking-widest text-center outline-none focus:ring-2 focus:ring-emerald-500"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="X7B9A2"
        maxLength={6}
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 py-2 font-medium hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? 'Uniendo...' : 'Unirse con Código'}
      </button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </form>
  );
};
