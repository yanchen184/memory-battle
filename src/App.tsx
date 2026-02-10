/**
 * Memory Battle - Main App Component
 * @version 2.0.0 - Online Multiplayer Edition
 */

import { useCallback, useState, useEffect, useRef } from 'react';
import {
  Lobby,
  GameBoard,
  GameHistory,
  PlayerInfo,
  ScoreBoard,
  Timer,
  VictoryScreen,
  ConnectionStatus,
  FlyingCardEffect,
} from './components';
import { useGameState, useWebSocket } from './hooks';
import type { GridSize, VictoryData, Player, CardData, PlayerTurn } from './types';
import type { HistoryEntry } from './components/GameHistory';
import { GAME_CONFIG } from './utils/constants';
import { AIOpponent } from './utils/ai';

interface FlyingCardData {
  id: string;
  symbol: string;
  fromPosition: { x: number; y: number };
  toPlayerNumber: PlayerTurn;
}

// Log version on startup
console.log('%c Memory Battle v2.0.0 - Online Edition ', 'background: #00f5ff; color: #000; font-weight: bold; padding: 4px 8px; border-radius: 4px;');

import { HashRouter, useNavigate, useLocation } from 'react-router-dom';

type GameMode = 'select' | 'local' | 'ai' | 'online';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 根據路徑決定遊戲模式
  const getGameModeFromPath = (): GameMode => {
    const path = location.pathname;
    if (path === '/local') return 'local';
    if (path === '/ai') return 'ai';
    if (path === '/online') return 'online';
    return 'select';
  };
  
  const [gameMode, setGameMode] = useState<GameMode>(getGameModeFromPath());
  const [isAIMode, setIsAIMode] = useState(false);
  const aiRef = useRef<AIOpponent | null>(null);
  const [flyingCards, setFlyingCards] = useState<FlyingCardData[]>([]);
  const prevMatchedPairsRef = useRef<number>(0);
  
  // 🆕 遊戲歷史記錄
  const [gameHistory, setGameHistory] = useState<HistoryEntry[]>([]);
  const turnCounterRef = useRef<number>(0);

  // Local game state
  const { gameState, startGame, flipCard, resetGame, isProcessing } = useGameState();

  // Online game state
  const {
    connectionState,
    roomState,
    playerId,
    playerIndex,
    joinGame,
    flipCard: flipCardOnline,
    leaveRoom,
    requestRematch,
  } = useWebSocket();

  // Handle game start from lobby (local mode or AI mode)
  const handleStartGame = useCallback(
    (player1Name: string, player2Name: string, gridSize: GridSize) => {
      if (gameMode === 'local') {
        setIsAIMode(false);
        aiRef.current = null;
        startGame(player1Name, player2Name, gridSize);
      } else if (gameMode === 'ai') {
        setIsAIMode(true);
        aiRef.current = new AIOpponent('hard');
        startGame(player1Name, 'AI 🤖', gridSize);
      }
    },
    [startGame, gameMode]
  );

  // Handle online game join
  const handleJoinOnline = useCallback(
    (playerName: string, avatar: string, gridSize: GridSize) => {
      joinGame(playerName, avatar, gridSize);
    },
    [joinGame]
  );

  // Handle card click
  const handleCardClick = useCallback(
    (cardId: string) => {
      if (gameMode === 'local' || gameMode === 'ai') {
        if (isProcessing) return;
        
        // 在 AI 模式下，只允許玩家 1 翻牌
        if (isAIMode && gameState.currentTurn === 2) {
          return; // AI 回合，玩家不能點擊
        }
        
        flipCard(cardId);
      } else if (gameMode === 'online' && roomState) {
        // Find card index by id
        const index = roomState.cards.findIndex(c => c.id.toString() === cardId);
        if (index !== -1) {
          flipCardOnline(index);
        }
      }
    },
    [gameMode, flipCard, flipCardOnline, isProcessing, roomState, isAIMode, gameState.currentTurn]
  );

  // Handle play again
  const handlePlayAgain = useCallback(() => {
    if (gameMode === 'local' || gameMode === 'ai') {
      if (gameMode === 'ai' && aiRef.current) {
        aiRef.current.clearMemory();
      }
      resetGame();
    } else {
      requestRematch();
    }
  }, [gameMode, resetGame, requestRematch]);

  // Handle exit to lobby
  const handleExit = useCallback(() => {
    if (gameMode === 'online') {
      leaveRoom();
    }
    resetGame();
    setGameMode('select');
    setIsAIMode(false);
    if (aiRef.current) {
      aiRef.current.clearMemory();
      aiRef.current = null;
    }
    navigate('/');
  }, [gameMode, leaveRoom, resetGame, navigate]);

  // 監聽配對成功，觸發飛行動畫（支援三個模式）
  useEffect(() => {
    // 只在遊戲進行中觸發
    if (gameMode === 'select') return;
    
    // 本地/AI 模式
    if (gameMode === 'local' || gameMode === 'ai') {
      // 檢查是否有新的配對
      if (gameState.matchedPairs <= prevMatchedPairsRef.current) return;

      // 找到剛配對成功的卡片（所有 isMatched 為 true 的卡片）
      const allMatchedCards = gameState.cards.filter((card) => card.isMatched);
      
      // 計算剛剛新增的配對（每次配對是 2 張）
      const newMatchedCount = allMatchedCards.length - (prevMatchedPairsRef.current * 2);
      
      if (newMatchedCount >= 2) {
        // 獲取最後配對的兩張卡片
        const lastTwo = allMatchedCards.slice(-2);
        
        // 為每張卡片創建飛行動畫
        const newFlyingCards = lastTwo.map((card, index) => {
          // 獲取卡片在螢幕上的位置
          const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
          const rect = cardElement?.getBoundingClientRect();
          
          return {
            id: `flying-${card.id}-${Date.now()}-${index}`,
            symbol: card.symbol,
            fromPosition: {
              x: rect?.left || window.innerWidth / 2,
              y: rect?.top || window.innerHeight / 2,
            },
            toPlayerNumber: (card.matchedBy || gameState.currentTurn) as PlayerTurn,
          };
        });

        setFlyingCards((prev) => [...prev, ...newFlyingCards]);
        
        // 自動清理（備用機制，防止動畫卡住）
        setTimeout(() => {
          setFlyingCards((prev) => 
            prev.filter((fc) => !newFlyingCards.some((nfc) => nfc.id === fc.id))
          );
        }, 2000);
      }

      prevMatchedPairsRef.current = gameState.matchedPairs;
    }
    
    // 線上模式
    if (gameMode === 'online' && roomState) {
      // 檢查是否有新的配對
      if (roomState.matchedPairs <= prevMatchedPairsRef.current) return;

      // 找到剛配對成功的卡片
      const allMatchedCards = roomState.cards.filter((card) => card.isMatched);
      
      // 計算剛剛新增的配對（每次配對是 2 張）
      const newMatchedCount = allMatchedCards.length - (prevMatchedPairsRef.current * 2);
      
      if (newMatchedCount >= 2) {
        // 獲取最後配對的兩張卡片
        const lastTwo = allMatchedCards.slice(-2);
        
        // 為每張卡片創建飛行動畫
        const newFlyingCards = lastTwo.map((card, index) => {
          // 獲取卡片在螢幕上的位置
          const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
          const rect = cardElement?.getBoundingClientRect();
          
          return {
            id: `flying-online-${card.id}-${Date.now()}-${index}`,
            symbol: card.symbol || '?',
            fromPosition: {
              x: rect?.left || window.innerWidth / 2,
              y: rect?.top || window.innerHeight / 2,
            },
            toPlayerNumber: ((card as any).matchedBy !== null ? ((card as any).matchedBy + 1) : roomState.currentPlayerIndex + 1) as PlayerTurn,
          };
        });

        setFlyingCards((prev) => [...prev, ...newFlyingCards]);
        
        // 自動清理（備用機制，防止動畫卡住）
        setTimeout(() => {
          setFlyingCards((prev) => 
            prev.filter((fc) => !newFlyingCards.some((nfc) => nfc.id === fc.id))
          );
        }, 2000);
      }

      prevMatchedPairsRef.current = roomState.matchedPairs;
    }
  }, [gameState.matchedPairs, gameState.cards, gameState.currentTurn, gameMode, roomState]);

  // 🧠 AI 完美記憶系統 - 記憶所有看過的卡片（包括玩家翻開的）
  useEffect(() => {
    if (!isAIMode || !aiRef.current) return;
    if (gameState.phase !== 'PLAYING') return;

    // 記憶所有曾經翻開過的卡片（不論誰翻的）
    gameState.cards.forEach(card => {
      if ((card.isFlipped || card.isMatched) && aiRef.current) {
        aiRef.current.rememberCard(card.id, card.symbol, card.pairId);
      }
    });

    // 記憶已配對的卡片
    gameState.cards.forEach(card => {
      if (card.isMatched && aiRef.current) {
        aiRef.current.rememberMatch(card.pairId);
      }
    });
  }, [isAIMode, gameState.cards, gameState.phase]);

  // AI 自動翻牌邏輯
  useEffect(() => {
    if (!isAIMode || !aiRef.current) return;
    if (gameState.phase !== 'PLAYING') return;
    if (gameState.currentTurn !== 2) return; // 只在 AI 回合執行
    if (isProcessing) return;
    if (gameState.flippedCards.length >= 2) return; // 已經翻了兩張

    // 延遲 AI 翻牌（模擬思考）
    const aiMoveTimer = setTimeout(async () => {
      try {
        const cardId = await aiRef.current!.makeMove(
          gameState.cards,
          gameState.flippedCards
        );
        flipCard(cardId);
      } catch (error) {
        console.error('[AI] Error making move:', error);
      }
    }, 300); // 300ms 延遲（快速反應）

    return () => clearTimeout(aiMoveTimer);
  }, [isAIMode, gameState, isProcessing, flipCard]);

  // 🆕 線上模式歷史記錄 - 初始化
  useEffect(() => {
    if (gameMode !== 'online' || !roomState) return;
    
    // 當遊戲開始時，清空歷史並重置回合計數器
    if (roomState.status === 'playing' && roomState.matchedPairs === 0 && gameHistory.length > 0) {
      setGameHistory([]);
      turnCounterRef.current = 0;
    }
  }, [gameMode, roomState, gameHistory.length]);

  // 🆕 線上模式歷史記錄 - 監聽 WebSocket 事件
  const lastFlippedCardsRef = useRef<{ cardIndex: number; symbol: string; playerId: string; playerName: string }[]>([]);
  
  useEffect(() => {
    if (gameMode !== 'online' || !roomState) return;
    
    // 當遊戲重新開始時清空歷史
    if (roomState.status === 'playing' && roomState.matchedPairs === 0 && gameHistory.length > 0) {
      setGameHistory([]);
      turnCounterRef.current = 0;
      lastFlippedCardsRef.current = [];
    }
  }, [gameMode, roomState, gameHistory.length]);
  
  // 🆕 記錄翻牌事件（透過 flipped cards 變化檢測）
  useEffect(() => {
    if (gameMode !== 'online' || !roomState) return;
    if (roomState.status !== 'playing') return;
    
    const currentFlippedCards = roomState.cards.filter(c => c.isFlipped && !c.isMatched);
    
    // 當有兩張卡片翻開時，記錄翻牌動作
    if (currentFlippedCards.length === 2 && lastFlippedCardsRef.current.length < 2) {
      const currentPlayer = roomState.players[roomState.currentPlayerIndex];
      
      turnCounterRef.current++;
      
      const entry: HistoryEntry = {
        id: `flip-${Date.now()}`,
        turnNumber: turnCounterRef.current,
        playerName: currentPlayer.name,
        playerNumber: (roomState.currentPlayerIndex + 1) as 1 | 2,
        action: 'flip',
        cards: currentFlippedCards.map(c => c.symbol || '?'),
        timestamp: Date.now(),
      };
      
      setGameHistory(prev => [...prev, entry]);
    }
    
    // 重置翻牌記錄（當卡片被翻回或配對後）
    if (currentFlippedCards.length === 0 && lastFlippedCardsRef.current.length > 0) {
      lastFlippedCardsRef.current = [];
    }
  }, [gameMode, roomState, gameHistory]);
  
  // 🆕 記錄配對事件
  useEffect(() => {
    if (gameMode !== 'online' || !roomState) return;
    if (roomState.status !== 'playing') return;
    
    const prevMatched = prevMatchedPairsRef.current;
    const currentMatched = roomState.matchedPairs;
    
    if (currentMatched > prevMatched) {
      // 配對成功
      const players = roomState.players;
      const matchingPlayer = players.find(p => p.score === currentMatched);
      
      if (matchingPlayer) {
        const matchedCards = roomState.cards.filter(c => c.isMatched);
        const recentlyMatched = matchedCards.slice(-2);
        
        const entry: HistoryEntry = {
          id: `match-${Date.now()}`,
          turnNumber: turnCounterRef.current,
          playerName: matchingPlayer.name,
          playerNumber: (players.indexOf(matchingPlayer) + 1) as 1 | 2,
          action: 'match',
          cards: recentlyMatched.map(c => c.symbol || '?'),
          timestamp: Date.now(),
        };
        
        setGameHistory(prev => [...prev, entry]);
      }
      
      prevMatchedPairsRef.current = currentMatched;
    }
  }, [gameMode, roomState]);

  // Mode selection screen
  if (gameMode === 'select') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <h1
          className="text-4xl md:text-6xl font-bold text-center mb-4"
          style={{ color: '#00f5ff', textShadow: '0 0 30px rgba(0, 245, 255, 0.5)' }}
        >
          記憶翻牌對戰
        </h1>
        <p className="text-[var(--text-secondary)] text-center mb-8 max-w-md">
          選擇遊戲模式
        </p>

        <div className="flex flex-col gap-4 w-full max-w-md">
          <button
            onClick={() => {
              setGameMode('local');
              navigate('/local');
            }}
            className="pixel-button w-full py-4 px-6 font-bold text-base"
            style={{
              background: '#6eb5ff',
              color: 'var(--text-primary)',
            }}
          >
            <span className="text-2xl mr-2">🎮</span>
            本地雙人對戰
          </button>

          <button
            onClick={() => {
              setGameMode('ai');
              navigate('/ai');
            }}
            className="pixel-button w-full py-4 px-6 font-bold text-base"
            style={{
              background: '#6bcf7f',
              color: 'var(--text-primary)',
            }}
          >
            <span className="text-2xl mr-2">🤖</span>
            挑戰完美 AI
          </button>

          <button
            onClick={() => {
              setGameMode('online');
              navigate('/online');
            }}
            className="pixel-button w-full py-4 px-6 font-bold text-base"
            style={{
              background: '#ff6b9d',
              color: 'var(--text-primary)',
            }}
          >
            <span className="text-2xl mr-2">🌐</span>
            線上對戰
          </button>

          <div className="mt-4 flex items-center justify-center gap-2 text-[var(--text-muted)]">
            <ConnectionStatus
              status={connectionState.isConnected ? 'CONNECTED' : connectionState.isConnecting ? 'CONNECTING' : 'DISCONNECTED'}
            />
          </div>
        </div>

        <p className="mt-8 text-xs text-[var(--text-muted)]">
          記憶翻牌對戰 v3.0.0 - 像素冒險版
        </p>
      </div>
    );
  }

  // Local mode or AI mode - use existing local game state
  if (gameMode === 'local' || gameMode === 'ai') {
    if (gameState.phase === 'LOBBY') {
      return (
        <Lobby
          onStartGame={handleStartGame}
          connectionStatus="CONNECTED"
          isAIMode={gameMode === 'ai'}
        />
      );
    }

    const { players, cards, currentTurn, turnTimeLeft } = gameState;
    if (!players) return null;

    const [player1, player2] = players;
    const isTimerWarning = turnTimeLeft <= GAME_CONFIG.TIMER_WARNING_THRESHOLD;
    const gridCols = cards.length === 16 ? 4 : 6;

    const victoryData: VictoryData | null = gameState.phase === 'GAME_OVER' && players
      ? {
          winner: gameState.winner === 1 || gameState.winner === 'DRAW' ? player1 : player2,
          loser: gameState.winner === 2 || gameState.winner === 'DRAW' ? player1 : player2,
          finalScores: [player1.score, player2.score],
          isDraw: gameState.winner === 'DRAW',
        }
      : null;

    return (
      <div className="game-container min-h-screen flex flex-col">
        {/* 對手區域（上方） */}
        <header className="game-header-opponent p-4 md:p-6 border-b border-[var(--border-color)]">
          <div className="max-w-6xl mx-auto">
            <PlayerInfo player={player2} isCurrentTurn={currentTurn === 2} playerNumber={2} />
          </div>
        </header>

        {/* 遊戲區域（中間） */}
        <main className="game-main flex-1 flex flex-col items-center justify-center p-4 md:p-6">
          <div className="mb-4">
            <Timer timeLeft={turnTimeLeft} maxTime={GAME_CONFIG.TURN_TIME_LIMIT} isWarning={isTimerWarning} />
          </div>
          
          <GameBoard
            cards={cards}
            onCardClick={handleCardClick}
            disabled={isProcessing || gameState.phase === 'GAME_OVER'}
            gridCols={gridCols}
          />

          <div className="mt-4">
            <ScoreBoard
              player1Score={player1.score}
              player2Score={player2.score}
              player1Name={player1.name}
              player2Name={player2.name}
            />
          </div>
        </main>

        {/* 玩家區域（下方） */}
        <footer className="game-footer-player p-4 md:p-6 border-t border-[var(--border-color)]">
          <div className="max-w-6xl mx-auto">
            <PlayerInfo player={player1} isCurrentTurn={currentTurn === 1} playerNumber={1} />
            
            <div className="mt-2 text-center">
              <p className="text-xs text-[var(--text-muted)]">
                已配對：{gameState.matchedPairs} / {gameState.totalPairs}
              </p>
              <button
                onClick={handleExit}
                className="mt-2 text-xs text-[var(--neon-pink)] hover:underline"
              >
                返回選單
              </button>
            </div>
          </div>
        </footer>

        {gameState.phase === 'GAME_OVER' && victoryData && (
          <VictoryScreen
            victoryData={victoryData}
            onPlayAgain={handlePlayAgain}
            onExit={handleExit}
          />
        )}

        {/* Flying Card Animations */}
        {flyingCards.map((flyingCard) => (
          <FlyingCardEffect
            key={flyingCard.id}
            cardSymbol={flyingCard.symbol}
            fromPosition={flyingCard.fromPosition}
            toPlayerNumber={flyingCard.toPlayerNumber}
            onComplete={() => {
              setFlyingCards((prev) => prev.filter((c) => c.id !== flyingCard.id));
            }}
          />
        ))}
      </div>
    );
  }

  // Online mode
  if (gameMode === 'online') {
    // Waiting for connection or room
    if (!roomState) {
      return (
        <OnlineLobby
          connectionState={connectionState}
          onJoinGame={handleJoinOnline}
          onBack={() => setGameMode('select')}
        />
      );
    }

    // Waiting for opponent
    if (roomState.status === 'waiting') {
      return (
        <WaitingRoom
          roomState={roomState}
          playerId={playerId}
          onLeave={handleExit}
        />
      );
    }

    // Game in progress or finished
    const onlinePlayers = roomState.players;
    const currentPlayerIdx = roomState.currentPlayerIndex;
    const isMyTurn = playerIndex === currentPlayerIdx;
    const gridCols = roomState.gridSize === '4x4' ? 4 : 6;

    // Convert room state cards to local format
    const onlineCards: CardData[] = roomState.cards.map((card) => ({
      id: card.id.toString(),
      pairId: card.symbolId ?? 0,
      symbol: card.symbol || '?',
      isFlipped: card.isFlipped,
      isMatched: card.isMatched,
      matchedBy: (card as any).matchedBy !== null ? ((card as any).matchedBy + 1) as PlayerTurn : null, // 轉換索引 0/1 為 1/2
    }));

    // 🐛 Debug: Log cards data
    console.log('[Online Mode Debug]', {
      roomStateCards: roomState.cards.length,
      onlineCards: onlineCards.length,
      firstCard: onlineCards[0],
      firstThreeCards: onlineCards.slice(0, 3),
      roomStatus: roomState.status,
      gridSize: roomState.gridSize,
      gridCols,
    });
    
    // 🚨 Alert if no cards
    if (onlineCards.length === 0) {
      console.error('[CRITICAL] No cards in online mode! Room state:', roomState);
    }

    // Convert players
    const player1: Player = {
      id: onlinePlayers[0]?.id || '1',
      name: onlinePlayers[0]?.name || 'Player 1',
      avatar: onlinePlayers[0]?.avatar || '👤',
      score: onlinePlayers[0]?.score || 0,
      isReady: true,
      isConnected: true,
      collectedCards: (onlinePlayers[0] as any)?.collectedCards || [],
    };
    const player2: Player = {
      id: onlinePlayers[1]?.id || '2',
      name: onlinePlayers[1]?.name || 'Player 2',
      avatar: onlinePlayers[1]?.avatar || '👥',
      score: onlinePlayers[1]?.score || 0,
      isReady: true,
      isConnected: true,
      collectedCards: (onlinePlayers[1] as any)?.collectedCards || [],
    };

    const isTimerWarning = roomState.turnTimeLeft <= GAME_CONFIG.TIMER_WARNING_THRESHOLD;

    const onlineVictoryData: VictoryData | null = roomState.status === 'finished'
      ? {
          winner: player1.score > player2.score ? player1 : player2,
          loser: player1.score > player2.score ? player2 : player1,
          finalScores: [player1.score, player2.score],
          isDraw: player1.score === player2.score,
        }
      : null;

    return (
      <div className="game-container min-h-screen flex flex-col">
        {/* 對手區域（上方） */}
        <header className="game-header-opponent p-4 md:p-6 border-b border-[var(--border-color)]">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <PlayerInfo
                player={playerIndex === 0 ? player2 : player1}
                isCurrentTurn={playerIndex === 0 ? currentPlayerIdx === 1 : currentPlayerIdx === 0}
                playerNumber={playerIndex === 0 ? 2 : 1}
              />
              <span className="text-xs text-[var(--text-muted)]">對手</span>
            </div>
          </div>
        </header>

        {/* 遊戲區域（中間） */}
        <main className="game-main flex-1 flex flex-col items-center justify-center p-4 md:p-6">
          {/* 🔥 明顯的回合指示器 */}
          <div className="mb-4 text-center">
            <div 
              className="pixel-button inline-block px-6 py-3 mb-2"
              style={{
                background: isMyTurn ? '#6bcf7f' : '#666',
                color: 'var(--text-primary)',
                fontSize: '1.25rem',
                fontWeight: 'bold',
              }}
            >
              {isMyTurn ? '▶ 你的回合！' : '⏸ 對手回合'}
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {isMyTurn ? '點擊兩張卡片來配對' : '等待對手行動...'}
            </p>
          </div>

          <div className="mb-4">
            <Timer
              timeLeft={roomState.turnTimeLeft}
              maxTime={GAME_CONFIG.TURN_TIME_LIMIT}
              isWarning={isTimerWarning}
            />
          </div>
          
          {/* 遊戲板 */}
          <GameBoard
            cards={onlineCards}
            onCardClick={handleCardClick}
            disabled={!isMyTurn || roomState.status === 'finished'}
            gridCols={gridCols}
          />

          {/* 分數條 */}
          <div className="mt-6 w-full max-w-xl">
            <ScoreBoard
              player1Score={player1.score}
              player2Score={player2.score}
              player1Name={player1.name}
              player2Name={player2.name}
            />
          </div>
        </main>

        {/* 玩家區域（下方） */}
        <footer className="game-footer-player p-4 md:p-6 border-t border-[var(--border-color)]">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <PlayerInfo
                player={playerIndex === 0 ? player1 : player2}
                isCurrentTurn={playerIndex === 0 ? currentPlayerIdx === 0 : currentPlayerIdx === 1}
                playerNumber={playerIndex === 0 ? 1 : 2}
              />
              <span className="text-xs text-[var(--neon-cyan)]">你</span>
            </div>
            
            <div className="mt-2 text-center">
              <p className="text-xs text-[var(--text-muted)]">
                房間：{roomState.id} | 已配對：{roomState.matchedPairs} / {roomState.totalPairs}
              </p>
              <button
                onClick={handleExit}
                className="mt-2 text-xs text-[var(--neon-pink)] hover:underline"
              >
                離開遊戲
              </button>
            </div>
          </div>
        </footer>

        {roomState.status === 'finished' && onlineVictoryData && (
          <VictoryScreen
            victoryData={onlineVictoryData}
            onPlayAgain={handlePlayAgain}
            onExit={handleExit}
          />
        )}
      </div>
    );
  }

  return null;
}

// Online Lobby Component
interface OnlineLobbyProps {
  connectionState: { isConnected: boolean; isConnecting: boolean; error: string | null };
  onJoinGame: (name: string, avatar: string, gridSize: GridSize) => void;
  onBack: () => void;
}

function OnlineLobby({ connectionState, onJoinGame, onBack }: OnlineLobbyProps) {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [gridSize, setGridSize] = useState<GridSize>('4x4');

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectionState.isConnected) return;
    // Create room with auto roomId
    onJoinGame(playerName || 'Player', '👤', gridSize);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectionState.isConnected || !roomCode) return;
    // Join specific room
    onJoinGame(playerName || 'Player', '👤', roomCode as GridSize);
  };

  // Selection screen
  if (mode === 'select') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <h1
          className="text-4xl md:text-5xl font-bold text-center mb-4"
          style={{ color: '#ff00ff', textShadow: '0 0 30px rgba(255, 0, 255, 0.5)' }}
        >
          🌐 Online Battle
        </h1>

        <div className="mb-6">
          <ConnectionStatus
            status={connectionState.isConnected ? 'CONNECTED' : connectionState.isConnecting ? 'CONNECTING' : 'DISCONNECTED'}
          />
        </div>

        <div className="glass-panel p-8 w-full max-w-md">
          <p className="text-center text-[var(--text-secondary)] mb-6">
            選擇遊戲方式
          </p>

          <div className="flex flex-col gap-4">
            {/* Create Room */}
            <button
              onClick={() => setMode('create')}
              disabled={!connectionState.isConnected}
              className="pixel-button w-full py-4 px-6 font-bold text-base disabled:opacity-50"
              style={{
                background: '#6bcf7f',
                color: 'var(--text-primary)',
              }}
            >
              <span className="text-2xl mr-2">🏠</span>
              創建房間
            </button>

            {/* Join Room */}
            <button
              onClick={() => setMode('join')}
              disabled={!connectionState.isConnected}
              className="pixel-button w-full py-4 px-6 font-bold text-base disabled:opacity-50"
              style={{
                background: '#ff6b9d',
                color: 'var(--text-primary)',
              }}
            >
              <span className="text-2xl mr-2">🔑</span>
              加入房間
            </button>
          </div>

          <button
            onClick={onBack}
            className="w-full mt-6 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            ← Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // Create Room form
  if (mode === 'create') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <h1
          className="text-3xl md:text-4xl font-bold text-center mb-4"
          style={{ color: '#00ff88', textShadow: '0 0 30px rgba(0, 255, 136, 0.5)' }}
        >
          🏠 創建房間
        </h1>

        <div className="mb-4">
          <ConnectionStatus
            status={connectionState.isConnected ? 'CONNECTED' : connectionState.isConnecting ? 'CONNECTING' : 'DISCONNECTED'}
          />
        </div>

        <form onSubmit={handleCreateRoom} className="glass-panel p-6 md:p-8 w-full max-w-md">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: '#00ff88' }}>
              你的名字
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="輸入名字..."
              maxLength={12}
              className="w-full px-4 py-3 bg-[var(--bg-card)] outline-none text-sm"
              style={{
                border: '3px solid var(--border-color)',
                boxShadow: 'inset 2px 2px 0px rgba(0,0,0,0.1)',
              }}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">
              棋盤大小
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['4x4', '4x6', '6x6'] as GridSize[]).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setGridSize(size)}
                  className={`p-3 rounded-xl text-center transition-all duration-300 ${
                    gridSize === size ? 'scale-105' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    background: gridSize === size ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: `2px solid ${gridSize === size ? '#00ff88' : 'rgba(255, 255, 255, 0.1)'}`,
                  }}
                >
                  <span className="block text-lg font-bold">{size}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!connectionState.isConnected}
            className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #00ff88 0%, #00f5ff 100%)',
              color: '#000',
            }}
          >
            {connectionState.isConnecting ? '連線中...' : '創建房間'}
          </button>

          <button
            type="button"
            onClick={() => setMode('select')}
            className="w-full mt-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            ← 返回
          </button>
        </form>
      </div>
    );
  }

  // Join Room form
  if (mode === 'join') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <h1
          className="text-3xl md:text-4xl font-bold text-center mb-4"
          style={{ color: '#ff00ff', textShadow: '0 0 30px rgba(255, 0, 255, 0.5)' }}
        >
          🔑 加入房間
        </h1>

        <div className="mb-4">
          <ConnectionStatus
            status={connectionState.isConnected ? 'CONNECTED' : connectionState.isConnecting ? 'CONNECTING' : 'DISCONNECTED'}
          />
        </div>

        <form onSubmit={handleJoinRoom} className="glass-panel p-6 md:p-8 w-full max-w-md">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: '#ff00ff' }}>
              你的名字
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="輸入你的名字..."
              maxLength={12}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border-2 border-transparent focus:border-[var(--neon-pink)] outline-none transition-colors"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: '#ff00ff' }}>
              房間代碼
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="輸入房間代碼 (例如: ABCD)"
              maxLength={8}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border-2 border-transparent focus:border-[var(--neon-pink)] outline-none transition-colors font-mono text-xl text-center"
              style={{
                letterSpacing: '0.2em',
              }}
            />
            <p className="text-xs text-[var(--text-muted)] mt-2 text-center">
              向房主索取房間代碼
            </p>
          </div>

          <button
            type="submit"
            disabled={!connectionState.isConnected || !roomCode}
            className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #ff00ff 0%, #ff6600 100%)',
              color: '#000',
            }}
          >
            {connectionState.isConnecting ? '連線中...' : '加入房間'}
          </button>

          <button
            type="button"
            onClick={() => setMode('select')}
            className="w-full mt-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            ← 返回
          </button>
        </form>
      </div>
    );
  }

  return null;
}

// Waiting Room Component
interface WaitingRoomProps {
  roomState: { id: string; players: { name: string; avatar: string }[] };
  playerId: string | null;
  onLeave: () => void;
}

function WaitingRoom({ roomState, onLeave }: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomState.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{
      background: 'var(--bg-primary)',
    }}>
      <div className="w-full max-w-2xl">
        {/* 超大房間號顯示 */}
        <div className="text-center mb-8">
          <h2 className="text-sm font-bold mb-4 uppercase tracking-widest opacity-60">
            等待對手加入
          </h2>
          
          <div 
            className="pixel-button p-12 mb-6"
            style={{
              background: 'var(--bg-card)',
              border: '4px solid #6bcf7f',
              boxShadow: '0 0 40px rgba(107, 207, 127, 0.3), var(--shadow-pixel-hover)',
            }}
          >
            <p className="text-xs opacity-50 mb-3 uppercase tracking-widest">房間代碼</p>
            <p 
              className="font-mono font-black mb-6"
              style={{ 
                fontSize: '4rem',
                color: '#6bcf7f',
                textShadow: '4px 4px 0px rgba(0,0,0,0.3)',
                letterSpacing: '0.3em',
              }}
            >
              {roomState.id}
            </p>
            
            {/* 超大複製按鈕 */}
            <button
              onClick={copyRoomCode}
              className="pixel-button w-full py-4 text-xl font-bold"
              style={{
                background: copied ? '#00ff88' : '#6bcf7f',
                color: 'var(--text-primary)',
              }}
            >
              {copied ? '✓ 已複製！' : '📋 點擊複製代碼'}
            </button>
          </div>
          
          <p className="text-sm opacity-70">
            將代碼分享給朋友，讓他們「加入房間」
          </p>
        </div>

        {/* 簡潔的玩家顯示 */}
        <div className="flex items-center justify-center gap-8 mb-8">
          {roomState.players.map((player, idx) => (
            <div key={idx} className="text-center">
              <div 
                className="text-6xl mb-2 w-24 h-24 flex items-center justify-center pixel-button"
                style={{
                  background: '#6bcf7f',
                  border: '3px solid var(--border-color)',
                }}
              >
                {player.avatar}
              </div>
              <p className="text-sm font-bold">{player.name}</p>
            </div>
          ))}
          
          <div className="text-4xl mx-4 opacity-50">VS</div>
          
          {roomState.players.length < 2 && (
            <div className="text-center">
              <div 
                className="text-6xl mb-2 w-24 h-24 flex items-center justify-center pixel-button animate-pulse"
                style={{
                  background: 'var(--bg-card)',
                  border: '3px dashed var(--border-color)',
                  opacity: 0.3,
                }}
              >
                ?
              </div>
              <p className="text-sm opacity-50">等待中</p>
            </div>
          )}
        </div>

        {/* 離開按鈕 */}
        <button
          onClick={onLeave}
          className="pixel-button px-6 py-3 text-sm font-bold"
          style={{
            background: 'var(--bg-card)',
            border: '3px solid var(--border-color)',
            color: 'var(--text-muted)',
          }}
        >
          離開房間
        </button>
      </div>
    </div>
  );
}

// 包裝在 HashRouter 中
function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

export default App;
