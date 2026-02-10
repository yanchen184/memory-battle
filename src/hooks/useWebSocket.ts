/**
 * WebSocket Hook for Memory Battle
 * @version 1.1.0
 *
 * 處理與 Railway WebSocket Server 的連接和通訊
 * 修復 React Strict Mode 雙重掛載問題
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// WebSocket Server URL
// 整合到 Love Letter Game Hub Server（節省 Railway 配額）
// 本地開發：使用 localhost:8089/ws/memory-battle/auto
// 生產環境：使用 love-letter-server-production.up.railway.app/ws/memory-battle/auto
const WS_URL = import.meta.env.VITE_WS_URL ||
  (import.meta.env.DEV 
    ? 'ws://localhost:8089/ws/memory-battle/auto' 
    : 'wss://love-letter-server-production.up.railway.app/ws/memory-battle/auto');

// Message Types
export type ServerMessageType =
  | 'CONNECTED'
  | 'JOINED_ROOM'
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'GAME_STARTED'
  | 'CARD_FLIPPED'
  | 'MATCH_RESULT'
  | 'TURN_CHANGED'
  | 'TURN_TIME_UPDATE'
  | 'TURN_TIMEOUT'
  | 'GAME_ENDED'
  | 'LEFT_ROOM'
  | 'ERROR'
  | 'PONG';

export interface ServerMessage {
  type: ServerMessageType;
  [key: string]: unknown;
}

export interface RoomState {
  id: string;
  gridSize: string;
  players: {
    id: string;
    name: string;
    avatar: string;
    score: number;
    isReady: boolean;
  }[];
  cards: {
    id: number;
    isFlipped: boolean;
    isMatched: boolean;
    symbol: string | null;
    symbolId: number | null;
  }[];
  currentPlayerIndex: number;
  matchedPairs: number;
  totalPairs: number;
  status: 'waiting' | 'playing' | 'finished';
  turnTimeLeft: number;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface UseWebSocketReturn {
  connectionState: ConnectionState;
  roomState: RoomState | null;
  playerId: string | null;
  playerIndex: number | null;
  joinGame: (playerName: string, avatar: string, gridSize: string) => void;
  flipCard: (cardIndex: number) => void;
  leaveRoom: () => void;
  requestRematch: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const mountedRef = useRef(true);

  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: true, // Start as connecting
    error: null,
  });

  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerIndex, setPlayerIndex] = useState<number | null>(null);

  // Handle incoming messages - using ref to avoid re-creating
  const handleMessageRef = useRef((event: MessageEvent) => {
    if (!mountedRef.current) return;

    try {
      const message: ServerMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'CONNECTED':
          // Server connection confirmed
          break;

        case 'JOINED_ROOM':
          setPlayerId(message.playerId as string);
          setPlayerIndex(message.playerIndex as number);
          setRoomState(message.roomState as RoomState);
          break;

        case 'PLAYER_JOINED':
        case 'PLAYER_LEFT':
        case 'TURN_CHANGED':
        case 'TURN_TIMEOUT':
          setRoomState(message.roomState as RoomState);
          break;

        case 'GAME_STARTED':
          setRoomState(message.roomState as RoomState);
          break;

        case 'CARD_FLIPPED':
          setRoomState(prev => {
            if (!prev) return prev;
            const newCards = [...prev.cards];
            const idx = message.cardIndex as number;
            const cardData = message.card as { symbol: string; symbolId: number };
            newCards[idx] = {
              ...newCards[idx],
              isFlipped: true,
              symbol: cardData.symbol,
              symbolId: cardData.symbolId,
            };
            return { ...prev, cards: newCards };
          });
          break;

        case 'MATCH_RESULT':
          if (message.isMatch) {
            // 🔊 播放配對成功音效
            if (typeof window !== 'undefined') {
              try {
                const { soundManager } = await import('../utils/sound');
                soundManager.playMatch();
              } catch (e) {
                console.warn('[WS] Failed to play match sound:', e);
              }
            }
            
            setRoomState(prev => {
              if (!prev) return prev;
              const newCards = [...prev.cards];
              const indices = message.cardIndices as number[];
              indices.forEach(idx => {
                newCards[idx] = { ...newCards[idx], isMatched: true };
              });
              // Update player score
              const newPlayers = prev.players.map(p =>
                p.id === message.playerId
                  ? { ...p, score: message.playerScore as number, collectedCards: (message as any).collectedCards || p.collectedCards }
                  : p
              );
              return {
                ...prev,
                cards: newCards,
                players: newPlayers,
                matchedPairs: message.matchedPairs as number,
              };
            });
          } else {
            // 🔊 播放配對失敗音效
            if (typeof window !== 'undefined') {
              try {
                const { soundManager } = await import('../utils/sound');
                soundManager.playMismatch();
              } catch (e) {
                console.warn('[WS] Failed to play mismatch sound:', e);
              }
            }
            // No match - cards will flip back
            setTimeout(() => {
              if (!mountedRef.current) return;
              setRoomState(prev => {
                if (!prev) return prev;
                const newCards = [...prev.cards];
                const indices = message.cardIndices as number[];
                indices.forEach(idx => {
                  newCards[idx] = {
                    ...newCards[idx],
                    isFlipped: false,
                    symbol: null,
                    symbolId: null,
                  };
                });
                return { ...prev, cards: newCards };
              });
            }, 500);
          }
          break;

        case 'TURN_TIME_UPDATE':
          setRoomState(prev =>
            prev ? { ...prev, turnTimeLeft: message.timeLeft as number } : prev
          );
          break;

        case 'GAME_ENDED':
          setRoomState(message.roomState as RoomState);
          break;

        case 'LEFT_ROOM':
          setRoomState(null);
          setPlayerId(null);
          setPlayerIndex(null);
          break;

        case 'ERROR':
          console.error('[WS] Server error:', message.message);
          break;
      }
    } catch (err) {
      console.error('[WS] Failed to parse message:', err);
    }
  });

  // Initialize connection - run only once
  useEffect(() => {
    mountedRef.current = true;

    const connect = () => {
      if (!mountedRef.current) return;
      if (wsRef.current?.readyState === WebSocket.OPEN) return;
      if (wsRef.current?.readyState === WebSocket.CONNECTING) return;

      // Clear any existing
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      setConnectionState({ isConnected: false, isConnecting: true, error: null });

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current || wsRef.current !== ws) {
          ws.close();
          return;
        }
        setConnectionState({ isConnected: true, isConnecting: false, error: null });

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => handleMessageRef.current(event);

      ws.onclose = () => {
        if (!mountedRef.current || wsRef.current !== ws) return;

        setConnectionState({ isConnected: false, isConnecting: false, error: null });

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            connect();
          }
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('[WS] Error:', error);
        if (!mountedRef.current || wsRef.current !== ws) return;
        // Don't set error state here - let onclose handle reconnection
      };
    };

    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []); // Empty dependency array - run only once

  // Send message helper
  const sendMessage = useCallback((type: string, payload?: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  // Public methods
  const joinGame = useCallback((playerName: string, avatar: string, gridSize: string) => {
    sendMessage('JOIN_GAME', { playerName, avatar, gridSize });
  }, [sendMessage]);

  const flipCard = useCallback((cardIndex: number) => {
    sendMessage('FLIP_CARD', { cardIndex });
  }, [sendMessage]);

  const leaveRoom = useCallback(() => {
    sendMessage('LEAVE_ROOM');
  }, [sendMessage]);

  const requestRematch = useCallback(() => {
    sendMessage('REMATCH');
  }, [sendMessage]);

  return {
    connectionState,
    roomState,
    playerId,
    playerIndex,
    joinGame,
    flipCard,
    leaveRoom,
    requestRematch,
  };
}
