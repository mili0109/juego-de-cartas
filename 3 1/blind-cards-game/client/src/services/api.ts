const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export async function uploadCustomDeck(file: File) {
  const formData = new FormData();
  formData.append('deck', file);

  const res = await fetch(`${SERVER_URL}/api/decks/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Error subiendo el mazo.');
  }
  return data as { deckId: string; deck: { name: string; author?: string; cards: any[] } };
}

export async function fetchVoiceToken(roomName: string, participantName: string) {
  const res = await fetch(`${SERVER_URL}/api/voice/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomName, participantName }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Error obteniendo el token de voz.');
  }
  return data as { token: string; serverUrl: string };
}
