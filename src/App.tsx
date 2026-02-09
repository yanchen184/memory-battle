/**
 * Memory Battle - Main App Component
 * @version 2.0.0 - Online Multiplayer Edition
 */

import { useCallback, useState, useEffect, useRef } from 'react';
import {
  Lobby,
  GameBoard,
  PlayerInfo,
  ScoreBoard,
  Timer,
  VictoryScreen,
  ConnectionStatus,
  FlyingCardEffect,
} from './components';
import { useGameState, useWebSocket } from './hooks';
import type { GridSize, VictoryData, Player, CardData, PlayerTurn } from './types';
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

type GameMode = 'select' | 'local' | 'ai' | 'online';

function App() {
  const [gameMode, setGameMode] = useState<GameMode>('select');
  const [isAIMode, setIsAIMode] = useState(false);
  const aiRef = useRef<AIOpponent | null>(null);
  const [flyingCards, setFlyingCards] = useState<FlyingCardData[]>([]);
  const prevMatchedPairsRef = useRef<number>(0);

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
  }, [gameMode, leaveRoom, resetGame]);

  // 監聽配對成功，觸發飛行動畫
  useEffect(() => {
    if (gameMode !== 'local' && gameMode !== 'ai') return;
    if (gameState.matchedPairs <= prevMatchedPairsRef.current) return;

    // 找到剛配對成功的卡片
    const justMatchedCards = gameState.cards.filter(
      (card) => card.isMatched && card.matchedBy === gameState.currentTurn
    );

    if (justMatchedCards.length >= 2) {
      // 獲取最後配對的兩張卡片
      const lastTwo = justMatchedCards.slice(-2);
      
      // 為每張卡片創建飛行動畫
      const newFlyingCards = lastTwo.map((card) => {
        // 獲取卡片在螢幕上的位置
        const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
        const rect = cardElement?.getBoundingClientRect();
        
        return {
          id: `flying-${card.id}-${Date.now()}`,
          symbol: card.symbol,
          fromPosition: {
            x: rect?.left || window.innerWidth / 2,
            y: rect?.top || window.innerHeight / 2,
          },
          toPlayerNumber: card.matchedBy as PlayerTurn,
        };
      });

      setFlyingCards((prev) => [...prev, ...newFlyingCards]);
    }

    prevMatchedPairsRef.current = gameState.matchedPairs;
  }, [gameState.matchedPairs, gameState.cards, gameState.currentTurn, gameMode]);

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

  // Mode selection screen
  if (gameMode === 'select') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <h1
          className="text-4xl md:text-6xl font-bold text-center mb-4"
          style={{ color: '#00f5ff', textShadow: '0 0 30px rgba(0, 245, 255, 0.5)' }}
        >
          Memory Battle
        </h1>
        <p className="text-[var(--text-secondary)] text-center mb-8 max-w-md">
          Choose your game mode
        </p>

        <div className="flex flex-col gap-4 w-full max-w-md">
          <button
            onClick={() => setGameMode('local')}
            className="w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #00f5ff 0%, #9d00ff 100%)',
              boxShadow: '0 4px 30px rgba(0, 245, 255, 0.4)',
              color: '#000',
            }}
          >
            <span className="text-2xl mr-2">🎮</span>
            Local 2P Battle
          </button>

          <button
            onClick={() => setGameMode('ai')}
            className="w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #00ff88 0%, #00f5ff 100%)',
              boxShadow: '0 4px 30px rgba(0, 255, 136, 0.4)',
              color: '#000',
            }}
          >
            <span className="text-2xl mr-2">🤖</span>
            VS AI (Perfect Memory)
          </button>

          <button
            onClick={() => setGameMode('online')}
            className="w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #ff00ff 0%, #ff6600 100%)',
              boxShadow: '0 4px 30px rgba(255, 0, 255, 0.4)',
              color: '#000',
            }}
          >
            <span className="text-2xl mr-2">🌐</span>
            Online Battle
          </button>

          <div className="mt-4 flex items-center justify-center gap-2 text-[var(--text-muted)]">
            <ConnectionStatus
              status={connectionState.isConnected ? 'CONNECTED' : connectionState.isConnecting ? 'CONNECTING' : 'DISCONNECTED'}
            />
          </div>
        </div>

        <p className="mt-8 text-xs text-[var(--text-muted)]">
          Memory Battle v2.0.0 - Online Edition
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
        <header className="game-header p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <PlayerInfo player={player1} isCurrentTurn={currentTurn === 1} playerNumber={1} />
              </div>
              <div className="flex justify-center lg:flex-none">
                <Timer timeLeft={turnTimeLeft} maxTime={GAME_CONFIG.TURN_TIME_LIMIT} isWarning={isTimerWarning} />
              </div>
              <div className="flex-1">
                <PlayerInfo player={player2} isCurrentTurn={currentTurn === 2} playerNumber={2} />
              </div>
            </div>
            <div className="mt-4">
              <ScoreBoard
                player1Score={player1.score}
                player2Score={player2.score}
                player1Name={player1.name}
                player2Name={player2.name}
              />
            </div>
          </div>
        </header>

        <main className="game-main flex-1 flex items-center justify-center p-4 md:p-6">
          <GameBoard
            cards={cards}
            onCardClick={handleCardClick}
            disabled={isProcessing || gameState.phase === 'GAME_OVER'}
            gridCols={gridCols}
          />
        </main>

        <footer className="game-footer p-4 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            Pairs matched: {gameState.matchedPairs} / {gameState.totalPairs}
          </p>
          <button
            onClick={handleExit}
            className="mt-2 text-xs text-[var(--neon-pink)] hover:underline"
          >
            Back to Menu
          </button>
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
      matchedBy: null, // 線上模式不追蹤配對者
    }));

    // Convert players
    const player1: Player = {
      id: onlinePlayers[0]?.id || '1',
      name: onlinePlayers[0]?.name || 'Player 1',
      avatar: onlinePlayers[0]?.avatar || '👤',
      score: onlinePlayers[0]?.score || 0,
      isReady: true,
      isConnected: true,
    };
    const player2: Player = {
      id: onlinePlayers[1]?.id || '2',
      name: onlinePlayers[1]?.name || 'Player 2',
      avatar: onlinePlayers[1]?.avatar || '👥',
      score: onlinePlayers[1]?.score || 0,
      isReady: true,
      isConnected: true,
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
        <header className="game-header p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <PlayerInfo
                  player={player1}
                  isCurrentTurn={currentPlayerIdx === 0}
                  playerNumber={1}
                />
                {playerIndex === 0 && <span className="text-xs text-[var(--neon-cyan)] ml-2">(You)</span>}
              </div>
              <div className="flex justify-center lg:flex-none">
                <Timer
                  timeLeft={roomState.turnTimeLeft}
                  maxTime={GAME_CONFIG.TURN_TIME_LIMIT}
                  isWarning={isTimerWarning}
                />
              </div>
              <div className="flex-1">
                <PlayerInfo
                  player={player2}
                  isCurrentTurn={currentPlayerIdx === 1}
                  playerNumber={2}
                />
                {playerIndex === 1 && <span className="text-xs text-[var(--neon-pink)] ml-2">(You)</span>}
              </div>
            </div>
            <div className="mt-4">
              <ScoreBoard
                player1Score={player1.score}
                player2Score={player2.score}
                player1Name={player1.name}
                player2Name={player2.name}
              />
            </div>
            {!isMyTurn && roomState.status === 'playing' && (
              <div className="mt-2 text-center text-[var(--text-muted)]">
                Waiting for opponent's move...
              </div>
            )}
          </div>
        </header>

        <main className="game-main flex-1 flex items-center justify-center p-4 md:p-6">
          <GameBoard
            cards={onlineCards}
            onCardClick={handleCardClick}
            disabled={!isMyTurn || roomState.status === 'finished'}
            gridCols={gridCols}
          />
        </main>

        <footer className="game-footer p-4 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            Room: {roomState.id} | Pairs matched: {roomState.matchedPairs} / {roomState.totalPairs}
          </p>
          <button
            onClick={handleExit}
            className="mt-2 text-xs text-[var(--neon-pink)] hover:underline"
          >
            Leave Game
          </button>
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
  const [playerName, setPlayerName] = useState('');
  const [gridSize, setGridSize] = useState<GridSize>('4x4');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectionState.isConnected) return;
    onJoinGame(playerName || 'Player', '👤', gridSize);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <h1
        className="text-4xl md:text-5xl font-bold text-center mb-4"
        style={{ color: '#ff00ff', textShadow: '0 0 30px rgba(255, 0, 255, 0.5)' }}
      >
        🌐 Online Battle
      </h1>

      <div className="mb-4">
        <ConnectionStatus
          status={connectionState.isConnected ? 'CONNECTED' : connectionState.isConnecting ? 'CONNECTING' : 'DISCONNECTED'}
        />
      </div>

      <form onSubmit={handleSubmit} className="glass-panel p-6 md:p-8 w-full max-w-md">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: '#ff00ff' }}>
            Your Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name..."
            maxLength={12}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border-2 border-transparent focus:border-[var(--neon-pink)] outline-none transition-colors"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">
            Board Size
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
                  background: gridSize === size ? 'rgba(255, 0, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: `2px solid ${gridSize === size ? '#ff00ff' : 'rgba(255, 255, 255, 0.1)'}`,
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
            background: 'linear-gradient(135deg, #ff00ff 0%, #ff6600 100%)',
            color: '#000',
          }}
        >
          {connectionState.isConnecting ? 'Connecting...' : 'Find Opponent'}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full mt-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          ← Back to Menu
        </button>
      </form>
    </div>
  );
}

// Waiting Room Component
interface WaitingRoomProps {
  roomState: { id: string; players: { name: string; avatar: string }[] };
  playerId: string | null;
  onLeave: () => void;
}

function WaitingRoom({ roomState, onLeave }: WaitingRoomProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="glass-panel p-8 text-center max-w-md">
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#ff00ff' }}>
          Waiting for Opponent...
        </h2>

        <div className="mb-6">
          <p className="text-[var(--text-muted)] mb-2">Room Code:</p>
          <p className="text-3xl font-mono font-bold" style={{ color: '#00f5ff' }}>
            {roomState.id}
          </p>
        </div>

        <div className="mb-6">
          <p className="text-[var(--text-secondary)]">
            Share this code with your friend to join!
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6">
          {roomState.players.map((player, idx) => (
            <div key={idx} className="text-center">
              <div className="text-4xl mb-2">{player.avatar}</div>
              <p className="text-sm">{player.name}</p>
            </div>
          ))}
          {roomState.players.length < 2 && (
            <div className="text-center opacity-50">
              <div className="text-4xl mb-2 animate-pulse">?</div>
              <p className="text-sm">Waiting...</p>
            </div>
          )}
        </div>

        <div className="animate-pulse text-[var(--text-muted)]">
          <span className="inline-block animate-spin mr-2">⏳</span>
          Searching for opponent...
        </div>

        <button
          onClick={onLeave}
          className="mt-6 px-6 py-2 rounded-lg text-[var(--neon-pink)] border border-[var(--neon-pink)] hover:bg-[var(--neon-pink)] hover:text-black transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default App;
