import { Request, Response } from 'express';
import { AccessToken } from 'livekit-server-sdk';

export async function generateVoiceToken(req: Request, res: Response) {
  const { roomName, participantName } = req.body as {
    roomName?: string;
    participantName?: string;
  };

  if (!roomName || !participantName) {
    return res.status(400).json({ message: 'roomName y participantName son requeridos.' });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ message: 'Credenciales de LiveKit no configuradas en el servidor.' });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
    ttl: '2h',
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  const token = await at.toJwt();

  return res.status(200).json({
    token,
    serverUrl: process.env.LIVEKIT_URL,
  });
}
