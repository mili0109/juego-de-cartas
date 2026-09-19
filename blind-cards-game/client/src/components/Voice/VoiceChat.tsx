import React from 'react';
import { LiveKitRoom, AudioConference, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import { useVoiceChat } from '../../hooks/useVoiceChat';
import { useGame } from '../../hooks/useGame';
import { useSocketContext } from '../../context/SocketContext';

export const VoiceChat: React.FC = () => {
  const { room } = useGame();
  const { gamertag } = useSocketContext();
  const { token, serverUrl, connecting, error, connect, disconnect } = useVoiceChat();

  if (!room) return null;

  if (!token || !serverUrl) {
    return (
      <div className="bg-slate-800 rounded-xl p-4 h-72 flex flex-col items-center justify-center gap-3">
        <h3 className="font-semibold self-start">🎙️ Chat de Voz</h3>
        <p className="text-sm text-slate-400 text-center">
          Conectate al canal de voz de la sala para hablar con los demás jugadores.
        </p>
        <button
          onClick={() => connect(room.id, gamertag)}
          disabled={connecting}
          className="rounded-lg bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500 disabled:opacity-50"
        >
          {connecting ? 'Conectando...' : 'Unirse al Chat de Voz'}
        </button>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4 h-72 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">🎙️ Chat de Voz</h3>
        <button onClick={disconnect} className="text-xs text-rose-400 hover:underline">
          Salir
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <LiveKitRoom video={false} audio={true} token={token} serverUrl={serverUrl} data-lk-theme="default">
          <AudioConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
};
