import { useCallback, useState } from 'react';
import { fetchVoiceToken } from '../services/api';

export function useVoiceChat() {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async (roomName: string, participantName: string) => {
    setConnecting(true);
    setError(null);
    try {
      const data = await fetchVoiceToken(roomName, participantName);
      setToken(data.token);
      setServerUrl(data.serverUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error conectando al chat de voz.');
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setToken(null);
    setServerUrl(null);
  }, []);

  return { token, serverUrl, connecting, error, connect, disconnect };
}
