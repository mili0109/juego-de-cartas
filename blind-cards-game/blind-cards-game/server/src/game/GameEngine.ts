import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  Card,
  ChatMessage,
  Player,
  RoomConfig,
  RoomState,
  SanitizedPlayer,
  SanitizedRoomState,
} from './types';
import { buildDeckFromDefinition, buildStandardDeck, shuffle } from './deck';

/** Genera un código de acceso alfanumérico de 6 caracteres (mayúsculas). */
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin caracteres ambiguos (0,O,1,I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export interface ResolveGuessResult {
  room: RoomState;
  newCard: Card | null;
  lifeLost: boolean;
  targetLivesRemaining: number;
  eliminated: boolean;
  gameOver: boolean;
  winnerId: string | null;
}

class GameEngineClass {
  private rooms: Map<string, RoomState> = new Map();

  createRoom(config: RoomConfig, hostId: string, hostGamertag: string, hostAvatar: string): RoomState {
    const id = uuidv4();
    const code = generateRoomCode();

    const host: Player = {
      id: hostId,
      gamertag: hostGamertag,
      avatar: hostAvatar || '🙂',
      isHost: true,
      card: null,
      guessedCount: 0,
      lives: config.livesPerPlayer,
      eliminated: false,
      connected: true,
    };

    const room: RoomState = {
      id,
      code,
      config,
      hostId,
      players: [host],
      drawPile: [],
      discardPile: [],
      status: 'lobby',
      currentTurnPlayerId: null,
      pendingGuess: null,
      createdAt: Date.now(),
    };

    this.rooms.set(id, room);
    return room;
  }

  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  findRoomByCode(code: string): RoomState | undefined {
    return [...this.rooms.values()].find((r) => r.code === code.toUpperCase());
  }

  listPublicRooms(): RoomState[] {
    return [...this.rooms.values()].filter(
      (r) => r.config.privacy === 'public' && r.status === 'lobby'
    );
  }

  joinRoom(roomId: string, playerId: string, gamertag: string, avatar: string): RoomState {
    const room = this.mustGetRoom(roomId);
    if (room.status !== 'lobby') {
      throw new Error('La partida ya comenzó.');
    }
    if (room.players.length >= room.config.maxPlayers) {
      throw new Error('La sala está llena.');
    }
    const existing = room.players.find((p) => p.id === playerId);
    if (existing) {
      existing.connected = true;
      return room;
    }
    room.players.push({
      id: playerId,
      gamertag,
      avatar: avatar || '🙂',
      isHost: false,
      card: null,
      guessedCount: 0,
      lives: room.config.livesPerPlayer,
      eliminated: false,
      connected: true,
    });
    return room;
  }

  removePlayer(playerId: string): { room: RoomState; wasHost: boolean } | null {
    for (const room of this.rooms.values()) {
      const idx = room.players.findIndex((p) => p.id === playerId);
      if (idx === -1) continue;

      if (room.status === 'lobby') {
        room.players.splice(idx, 1);
      } else {
        room.players[idx].connected = false;
      }

      const wasHost = room.hostId === playerId;
      if (wasHost && room.players.length > 0) {
        const newHost = room.players.find((p) => p.connected) ?? room.players[0];
        newHost.isHost = true;
        room.hostId = newHost.id;
      }

      if (room.players.length === 0) {
        this.rooms.delete(room.id);
      }

      return { room, wasHost };
    }
    return null;
  }

  /** Inicia la partida: construye/baraja el mazo y reparte una carta a cada jugador. */
  startGame(roomId: string): RoomState {
    const room = this.mustGetRoom(roomId);
    if (room.players.length < 3) {
      throw new Error('Se necesitan al menos 3 jugadores para iniciar.');
    }

    const baseDeck =
      room.config.deckType === 'custom' && room.config.customDeck
        ? buildDeckFromDefinition(room.config.customDeck)
        : buildStandardDeck(room.config.includeFaceCards);

    room.drawPile = shuffle(baseDeck);
    room.discardPile = [];

    for (const player of room.players) {
      player.card = this.drawFromPile(room);
      player.guessedCount = 0;
      player.lives = room.config.livesPerPlayer;
      player.eliminated = false;
    }

    room.status = 'in_progress';
    room.currentTurnPlayerId = room.players[0].id;
    room.pendingGuess = null;

    return room;
  }

  /** El jugador activo selecciona un objetivo para preguntarle/darle pista. */
  beginQuestion(roomId: string, activePlayerId: string, targetPlayerId: string): RoomState {
    const room = this.mustGetRoom(roomId);
    this.assertTurn(room, activePlayerId);
    const target = room.players.find((p) => p.id === targetPlayerId);
    if (!target) {
      throw new Error('Jugador objetivo inválido.');
    }
    if (target.eliminated) {
      throw new Error('Ese jugador ya fue eliminado.');
    }
    if (targetPlayerId === activePlayerId) {
      throw new Error('No podés preguntarte a vos mismo.');
    }
    room.pendingGuess = { targetPlayerId };
    return room;
  }

  /**
   * El jugador activo resuelve si el oponente adivinó o no.
   * - Adivinó: se descarta su carta, roba una nueva, el turno sigue en su definición de variante (por defecto, retiene el jugador activo).
   * - No adivinó: pierde una vida. Si llega a 0, queda eliminado. El turno pasa a quien intentó adivinar (o al siguiente jugador vivo si fue eliminado).
   */
  resolveGuess(
    roomId: string,
    activePlayerId: string,
    targetPlayerId: string,
    guessedCorrectly: boolean
  ): ResolveGuessResult {
    const room = this.mustGetRoom(roomId);
    this.assertTurn(room, activePlayerId);

    if (!room.pendingGuess || room.pendingGuess.targetPlayerId !== targetPlayerId) {
      throw new Error('No hay una adivinanza pendiente para ese jugador.');
    }

    const targetPlayer = room.players.find((p) => p.id === targetPlayerId);
    if (!targetPlayer) throw new Error('Jugador objetivo no encontrado.');

    let newCard: Card | null = null;
    let lifeLost = false;
    let eliminated = false;

    if (guessedCorrectly) {
      if (targetPlayer.card) {
        room.discardPile.push(targetPlayer.card);
      }
      newCard = this.drawFromPile(room);
      targetPlayer.card = newCard;
      targetPlayer.guessedCount += 1;
      room.currentTurnPlayerId = activePlayerId; // el activo retiene el turno
    } else {
      targetPlayer.lives = Math.max(0, targetPlayer.lives - 1);
      lifeLost = true;
      if (targetPlayer.lives === 0) {
        targetPlayer.eliminated = true;
        eliminated = true;
      }
      // El turno pasa a quien intentó adivinar; si quedó eliminado, pasa al siguiente jugador vivo.
      room.currentTurnPlayerId = targetPlayer.eliminated
        ? this.getNextAlivePlayerId(room, targetPlayerId)
        : targetPlayerId;
    }

    room.pendingGuess = null;

    const { gameOver, winnerId } = this.checkGameOver(room);
    if (gameOver) {
      room.status = 'finished';
    }

    return {
      room,
      newCard,
      lifeLost,
      targetLivesRemaining: targetPlayer.lives,
      eliminated,
      gameOver,
      winnerId,
    };
  }

  /** Busca, en orden, al siguiente jugador conectado y no eliminado a partir de uno dado. */
  private getNextAlivePlayerId(room: RoomState, fromPlayerId: string): string | null {
    const order = room.players;
    const startIdx = order.findIndex((p) => p.id === fromPlayerId);
    for (let step = 1; step <= order.length; step++) {
      const candidate = order[(startIdx + step) % order.length];
      if (candidate && !candidate.eliminated && candidate.connected) {
        return candidate.id;
      }
    }
    return null;
  }

  private checkGameOver(room: RoomState): { gameOver: boolean; winnerId: string | null } {
    if (room.drawPile.length === 0) {
      const leader = [...room.players].sort((a, b) => b.guessedCount - a.guessedCount)[0];
      return { gameOver: true, winnerId: leader?.id ?? null };
    }

    const winnerByScore = room.players.find((p) => p.guessedCount >= room.config.winScore);
    if (winnerByScore) {
      return { gameOver: true, winnerId: winnerByScore.id };
    }

    const alivePlayers = room.players.filter((p) => !p.eliminated);
    if (alivePlayers.length <= 1) {
      return { gameOver: true, winnerId: alivePlayers[0]?.id ?? null };
    }

    return { gameOver: false, winnerId: null };
  }

  private drawFromPile(room: RoomState): Card | null {
    if (room.drawPile.length === 0) return null;
    return room.drawPile.shift() ?? null;
  }

  private assertTurn(room: RoomState, playerId: string) {
    if (room.status !== 'in_progress') {
      throw new Error('La partida no está en curso.');
    }
    if (room.currentTurnPlayerId !== playerId) {
      throw new Error('No es tu turno.');
    }
  }

  private mustGetRoom(roomId: string): RoomState {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Sala no encontrada.');
    return room;
  }

  /** Construye el estado sanitizado para un destinatario específico (oculta su propia carta). */
  sanitizeForPlayer(room: RoomState, viewerId: string): SanitizedRoomState {
    const players: SanitizedPlayer[] = room.players.map((p) => ({
      id: p.id,
      gamertag: p.gamertag,
      avatar: p.avatar,
      isHost: p.isHost,
      guessedCount: p.guessedCount,
      lives: p.lives,
      eliminated: p.eliminated,
      connected: p.connected,
      card: p.id === viewerId ? (p.card ? 'HIDDEN' : null) : p.card,
    }));

    return {
      id: room.id,
      code: room.code,
      config: {
        name: room.config.name,
        maxPlayers: room.config.maxPlayers,
        privacy: room.config.privacy,
        deckType: room.config.deckType,
        winScore: room.config.winScore,
        includeFaceCards: room.config.includeFaceCards,
        livesPerPlayer: room.config.livesPerPlayer,
        hasCustomDeck: !!room.config.customDeck,
      },
      hostId: room.hostId,
      players,
      status: room.status,
      currentTurnPlayerId: room.currentTurnPlayerId,
      pendingGuess: room.pendingGuess,
      cardsRemaining: room.drawPile.length,
    };
  }

  /** Emite a cada jugador de la sala su propia versión sanitizada del estado. */
  broadcastSanitizedState(io: Server, roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    for (const player of room.players) {
      const payload = this.sanitizeForPlayer(room, player.id);
      io.to(player.id).emit('room:state_update', payload);
    }
  }

  broadcastChatMessage(io: Server, roomId: string, message: ChatMessage) {
    io.to(roomId).emit('chat:new_message', message);
  }
}

export const GameEngine = new GameEngineClass();
