/**
 * Memory Battle WebSocket Server
 * @version 1.0.0
 *
 * WebSocket 即時對戰伺服器
 * 支援房間配對、遊戲狀態同步、回合管理
 */

import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const PORT = process.env.PORT || 3001;
const VERSION = '1.0.0';

// ============================================
// Game Constants
// ============================================

const CARD_SYMBOLS = [
  { id: 0, symbol: '🦊', name: 'Fox' },
  { id: 1, symbol: '🐺', name: 'Wolf' },
  { id: 2, symbol: '🦁', name: 'Lion' },
  { id: 3, symbol: '🐯', name: 'Tiger' },
  { id: 4, symbol: '🦋', name: 'Butterfly' },
  { id: 5, symbol: '🌸', name: 'Cherry Blossom' },
  { id: 6, symbol: '🌙', name: 'Moon' },
  { id: 7, symbol: '⭐', name: 'Star' },
  { id: 8, symbol: '🔮', name: 'Crystal Ball' },
  { id: 9, symbol: '🗡️', name: 'Sword' },
  { id: 10, symbol: '🛡️', name: 'Shield' },
  { id: 11, symbol: '🏰', name: 'Castle' },
  { id: 12, symbol: '🐉', name: 'Dragon' },
  { id: 13, symbol: '🧙', name: 'Wizard' },
  { id: 14, symbol: '👑', name: 'Crown' },
  { id: 15, symbol: '💎', name: 'Gem' },
  { id: 16, symbol: '🔥', name: 'Fire' },
  { id: 17, symbol: '💧', name: 'Water' },
];

const GRID_CONFIGS = {
  '4x4': { rows: 4, cols: 4, totalCards: 16, totalPairs: 8 },
  '4x6': { rows: 4, cols: 6, totalCards: 24, totalPairs: 12 },
  '6x6': { rows: 6, cols: 6, totalCards: 36, totalPairs: 18 },
};

const TURN_TIME_LIMIT = 30; // seconds

// ============================================
// State Management
// ============================================

/** @type {Map<string, Room>} */
const rooms = new Map();

/** @type {Map<WebSocket, string>} */
const clientRooms = new Map();

/** @type {Map<WebSocket, Player>} */
const clientPlayers = new Map();

// ============================================
// Data Types
// ============================================

/**
 * @typedef {Object} Card
 * @property {number} id - Card unique ID
 * @property {number} symbolId - Symbol ID for matching
 * @property {string} symbol - Emoji symbol
 * @property {boolean} isFlipped - Is card face up
 * @property {boolean} isMatched - Has been matched
 */

/**
 * @typedef {Object} Player
 * @property {string} id - Player unique ID
 * @property {string} name - Display name
 * @property {string} avatar - Avatar emoji
 * @property {number} score - Current score
 * @property {WebSocket} ws - WebSocket connection
 * @property {boolean} isReady - Ready to start
 */

/**
 * @typedef {Object} Room
 * @property {string} id - Room unique ID
 * @property {string} gridSize - Grid configuration key
 * @property {Player[]} players - Players in room
 * @property {Card[]} cards - Game cards
 * @property {number} currentPlayerIndex - Current turn
 * @property {number[]} flippedIndices - Currently flipped card indices
 * @property {number} matchedPairs - Pairs matched so far
 * @property {'waiting'|'playing'|'finished'} status - Room status
 * @property {number} turnTimer - Turn countdown timer ID
 * @property {number} turnTimeLeft - Seconds left in turn
 */

// ============================================
// Utility Functions
// ============================================

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateCards(gridSize) {
  const config = GRID_CONFIGS[gridSize];
  if (!config) throw new Error(`Invalid grid size: ${gridSize}`);

  const numPairs = config.totalPairs;
  const selectedSymbols = shuffleArray(CARD_SYMBOLS).slice(0, numPairs);

  const cards = [];
  selectedSymbols.forEach((symbol, index) => {
    // Create pair of cards
    cards.push({
      id: index * 2,
      symbolId: symbol.id,
      symbol: symbol.symbol,
      isFlipped: false,
      isMatched: false,
    });
    cards.push({
      id: index * 2 + 1,
      symbolId: symbol.id,
      symbol: symbol.symbol,
      isFlipped: false,
      isMatched: false,
    });
  });

  return shuffleArray(cards);
}

function broadcast(room, message, excludeWs = null) {
  const data = JSON.stringify(message);
  room.players.forEach(player => {
    if (player.ws !== excludeWs && player.ws.readyState === 1) {
      player.ws.send(data);
    }
  });
}

function sendToPlayer(player, message) {
  if (player.ws.readyState === 1) {
    player.ws.send(JSON.stringify(message));
  }
}

function getPublicRoomState(room) {
  return {
    id: room.id,
    gridSize: room.gridSize,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      isReady: p.isReady,
    })),
    cards: room.cards.map(c => ({
      id: c.id,
      isFlipped: c.isFlipped,
      isMatched: c.isMatched,
      // Only reveal symbol if flipped or matched
      symbol: (c.isFlipped || c.isMatched) ? c.symbol : null,
      symbolId: (c.isFlipped || c.isMatched) ? c.symbolId : null,
    })),
    currentPlayerIndex: room.currentPlayerIndex,
    matchedPairs: room.matchedPairs,
    totalPairs: GRID_CONFIGS[room.gridSize].totalPairs,
    status: room.status,
    turnTimeLeft: room.turnTimeLeft,
  };
}

// ============================================
// Room Management
// ============================================

function createRoom(gridSize = '4x4') {
  const roomId = uuidv4().slice(0, 8).toUpperCase();
  const room = {
    id: roomId,
    gridSize,
    players: [],
    cards: generateCards(gridSize),
    currentPlayerIndex: 0,
    flippedIndices: [],
    matchedPairs: 0,
    status: 'waiting',
    turnTimer: null,
    turnTimeLeft: TURN_TIME_LIMIT,
  };
  rooms.set(roomId, room);
  console.log(`[Room] Created room ${roomId} with grid ${gridSize}`);
  return room;
}

function findAvailableRoom(gridSize) {
  for (const [, room] of rooms) {
    if (room.gridSize === gridSize &&
        room.status === 'waiting' &&
        room.players.length < 2) {
      return room;
    }
  }
  return null;
}

function joinRoom(room, player) {
  if (room.players.length >= 2) {
    return false;
  }

  room.players.push(player);
  clientRooms.set(player.ws, room.id);
  clientPlayers.set(player.ws, player);

  console.log(`[Room] Player ${player.name} joined room ${room.id}`);

  // Notify all players
  broadcast(room, {
    type: 'PLAYER_JOINED',
    player: {
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      score: 0,
      isReady: false,
    },
    roomState: getPublicRoomState(room),
  });

  return true;
}

function leaveRoom(ws) {
  const roomId = clientRooms.get(ws);
  const player = clientPlayers.get(ws);

  if (!roomId || !player) return;

  const room = rooms.get(roomId);
  if (!room) return;

  // Remove player from room
  room.players = room.players.filter(p => p.id !== player.id);
  clientRooms.delete(ws);
  clientPlayers.delete(ws);

  console.log(`[Room] Player ${player.name} left room ${roomId}`);

  // Stop timer if running
  if (room.turnTimer) {
    clearInterval(room.turnTimer);
    room.turnTimer = null;
  }

  if (room.players.length === 0) {
    // Delete empty room
    rooms.delete(roomId);
    console.log(`[Room] Deleted empty room ${roomId}`);
  } else {
    // Notify remaining players
    room.status = 'waiting';
    broadcast(room, {
      type: 'PLAYER_LEFT',
      playerId: player.id,
      roomState: getPublicRoomState(room),
    });
  }
}

// ============================================
// Game Logic
// ============================================

function startGame(room) {
  if (room.players.length !== 2) return;

  room.status = 'playing';
  room.currentPlayerIndex = 0;
  room.flippedIndices = [];
  room.matchedPairs = 0;
  room.turnTimeLeft = TURN_TIME_LIMIT;

  // Reset cards
  room.cards = generateCards(room.gridSize);

  // Reset scores
  room.players.forEach(p => p.score = 0);

  console.log(`[Game] Started game in room ${room.id}`);

  broadcast(room, {
    type: 'GAME_STARTED',
    roomState: getPublicRoomState(room),
  });

  startTurnTimer(room);
}

function startTurnTimer(room) {
  if (room.turnTimer) {
    clearInterval(room.turnTimer);
  }

  room.turnTimeLeft = TURN_TIME_LIMIT;

  room.turnTimer = setInterval(() => {
    room.turnTimeLeft--;

    if (room.turnTimeLeft <= 0) {
      // Time's up - switch turn
      handleTimeUp(room);
    } else if (room.turnTimeLeft <= 10) {
      // Send warning
      broadcast(room, {
        type: 'TURN_TIME_UPDATE',
        timeLeft: room.turnTimeLeft,
        isWarning: true,
      });
    }
  }, 1000);
}

function handleTimeUp(room) {
  console.log(`[Game] Time's up in room ${room.id}`);

  // Flip back any flipped cards
  room.flippedIndices.forEach(idx => {
    room.cards[idx].isFlipped = false;
  });
  room.flippedIndices = [];

  // Switch turn
  room.currentPlayerIndex = (room.currentPlayerIndex + 1) % 2;

  broadcast(room, {
    type: 'TURN_TIMEOUT',
    currentPlayerIndex: room.currentPlayerIndex,
    roomState: getPublicRoomState(room),
  });

  startTurnTimer(room);
}

function handleFlipCard(room, player, cardIndex) {
  // Validate it's player's turn
  const playerIndex = room.players.findIndex(p => p.id === player.id);
  if (playerIndex !== room.currentPlayerIndex) {
    sendToPlayer(player, {
      type: 'ERROR',
      message: 'Not your turn!',
    });
    return;
  }

  // Validate card index
  if (cardIndex < 0 || cardIndex >= room.cards.length) {
    sendToPlayer(player, {
      type: 'ERROR',
      message: 'Invalid card index',
    });
    return;
  }

  const card = room.cards[cardIndex];

  // Can't flip already flipped or matched card
  if (card.isFlipped || card.isMatched) {
    return;
  }

  // Can't flip more than 2 cards
  if (room.flippedIndices.length >= 2) {
    return;
  }

  // Flip the card
  card.isFlipped = true;
  room.flippedIndices.push(cardIndex);

  broadcast(room, {
    type: 'CARD_FLIPPED',
    cardIndex,
    card: {
      id: card.id,
      symbol: card.symbol,
      symbolId: card.symbolId,
      isFlipped: true,
      isMatched: false,
    },
    playerId: player.id,
  });

  // Check for match if two cards flipped
  if (room.flippedIndices.length === 2) {
    setTimeout(() => checkMatch(room), 800);
  }
}

function checkMatch(room) {
  const [idx1, idx2] = room.flippedIndices;
  const card1 = room.cards[idx1];
  const card2 = room.cards[idx2];

  const isMatch = card1.symbolId === card2.symbolId;

  if (isMatch) {
    // Mark as matched
    card1.isMatched = true;
    card2.isMatched = true;
    room.matchedPairs++;

    // Add score to current player
    const currentPlayer = room.players[room.currentPlayerIndex];
    currentPlayer.score++;

    console.log(`[Game] Match! ${currentPlayer.name} scored in room ${room.id}`);

    broadcast(room, {
      type: 'MATCH_RESULT',
      isMatch: true,
      cardIndices: [idx1, idx2],
      playerId: currentPlayer.id,
      playerScore: currentPlayer.score,
      matchedPairs: room.matchedPairs,
      totalPairs: GRID_CONFIGS[room.gridSize].totalPairs,
    });

    // Check for game over
    if (room.matchedPairs === GRID_CONFIGS[room.gridSize].totalPairs) {
      endGame(room);
      return;
    }

    // Reset flipped indices but keep turn (match = continue)
    room.flippedIndices = [];
    startTurnTimer(room);

  } else {
    // No match - flip cards back
    card1.isFlipped = false;
    card2.isFlipped = false;

    broadcast(room, {
      type: 'MATCH_RESULT',
      isMatch: false,
      cardIndices: [idx1, idx2],
    });

    // Switch turn
    room.currentPlayerIndex = (room.currentPlayerIndex + 1) % 2;
    room.flippedIndices = [];

    broadcast(room, {
      type: 'TURN_CHANGED',
      currentPlayerIndex: room.currentPlayerIndex,
      roomState: getPublicRoomState(room),
    });

    startTurnTimer(room);
  }
}

function endGame(room) {
  if (room.turnTimer) {
    clearInterval(room.turnTimer);
    room.turnTimer = null;
  }

  room.status = 'finished';

  const player1 = room.players[0];
  const player2 = room.players[1];

  let winnerId = null;
  let isDraw = false;

  if (player1.score > player2.score) {
    winnerId = player1.id;
  } else if (player2.score > player1.score) {
    winnerId = player2.id;
  } else {
    isDraw = true;
  }

  console.log(`[Game] Game ended in room ${room.id}. Winner: ${winnerId || 'Draw'}`);

  broadcast(room, {
    type: 'GAME_ENDED',
    winnerId,
    isDraw,
    finalScores: {
      [player1.id]: player1.score,
      [player2.id]: player2.score,
    },
    roomState: getPublicRoomState(room),
  });
}

// ============================================
// WebSocket Server
// ============================================

const wss = new WebSocketServer({ port: PORT });

console.log(`
╔══════════════════════════════════════════════╗
║   Memory Battle WebSocket Server v${VERSION}     ║
║   Running on port ${PORT}                        ║
╚══════════════════════════════════════════════╝
`);

wss.on('connection', (ws) => {
  console.log('[WS] New connection established');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(ws, message);
    } catch (err) {
      console.error('[WS] Failed to parse message:', err);
    }
  });

  ws.on('close', () => {
    console.log('[WS] Connection closed');
    leaveRoom(ws);
  });

  ws.on('error', (err) => {
    console.error('[WS] WebSocket error:', err);
    leaveRoom(ws);
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    version: VERSION,
  }));
});

function handleMessage(ws, message) {
  const { type, payload } = message;

  switch (type) {
    case 'JOIN_GAME': {
      const { playerName, avatar, gridSize } = payload;

      // Create player
      const player = {
        id: uuidv4(),
        name: playerName || 'Player',
        avatar: avatar || '👤',
        score: 0,
        ws,
        isReady: false,
      };

      // Find or create room
      let room = findAvailableRoom(gridSize || '4x4');
      if (!room) {
        room = createRoom(gridSize || '4x4');
      }

      if (joinRoom(room, player)) {
        sendToPlayer(player, {
          type: 'JOINED_ROOM',
          playerId: player.id,
          roomId: room.id,
          playerIndex: room.players.length - 1,
          roomState: getPublicRoomState(room),
        });

        // Auto-start if 2 players
        if (room.players.length === 2) {
          setTimeout(() => startGame(room), 2000);
        }
      } else {
        sendToPlayer(player, {
          type: 'ERROR',
          message: 'Failed to join room',
        });
      }
      break;
    }

    case 'FLIP_CARD': {
      const roomId = clientRooms.get(ws);
      const player = clientPlayers.get(ws);
      const room = rooms.get(roomId);

      if (!room || !player) {
        ws.send(JSON.stringify({
          type: 'ERROR',
          message: 'Not in a room',
        }));
        return;
      }

      if (room.status !== 'playing') {
        ws.send(JSON.stringify({
          type: 'ERROR',
          message: 'Game not in progress',
        }));
        return;
      }

      handleFlipCard(room, player, payload.cardIndex);
      break;
    }

    case 'LEAVE_ROOM': {
      leaveRoom(ws);
      ws.send(JSON.stringify({
        type: 'LEFT_ROOM',
      }));
      break;
    }

    case 'REMATCH': {
      const roomId = clientRooms.get(ws);
      const room = rooms.get(roomId);

      if (room && room.status === 'finished' && room.players.length === 2) {
        startGame(room);
      }
      break;
    }

    case 'PING': {
      ws.send(JSON.stringify({ type: 'PONG' }));
      break;
    }

    default:
      console.log(`[WS] Unknown message type: ${type}`);
  }
}

// Health check endpoint for Railway
import http from 'http';

const healthServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      version: VERSION,
      rooms: rooms.size,
      connections: wss.clients.size,
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

healthServer.listen(PORT + 1, () => {
  console.log(`[Health] Health check server running on port ${PORT + 1}`);
});
