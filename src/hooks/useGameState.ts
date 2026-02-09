/**
 * useGameState - Main game state management hook
 * @version 1.1.0 - Fixed card flip match detection
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  GameState,
  GamePhase,
  Player,
  GridSize,
} from '../types';
import { createCardDeck, checkCardsMatch, determineWinner } from '../utils/helpers';
import { GAME_CONFIG, DEFAULT_PLAYER } from '../utils/constants';

interface UseGameStateReturn {
  gameState: GameState;
  startGame: (player1Name: string, player2Name: string, gridSize?: GridSize) => void;
  flipCard: (cardId: string) => void;
  resetGame: () => void;
  isProcessing: boolean;
}

const createInitialState = (): GameState => ({
  phase: 'LOBBY',
  currentTurn: 1,
  players: null,
  cards: [],
  flippedCards: [],
  matchedPairs: 0,
  totalPairs: 0,
  turnTimeLeft: GAME_CONFIG.TURN_TIME_LIMIT,
  winner: null,
});

const createPlayer = (id: string, name: string, avatarIndex: number): Player => ({
  id,
  name: name || DEFAULT_PLAYER.NAMES[avatarIndex],
  avatar: DEFAULT_PLAYER.AVATARS[avatarIndex % DEFAULT_PLAYER.AVATARS.length],
  score: 0,
  isReady: true,
  isConnected: true,
  collectedCards: [], // 初始化收集卡片陣列
});

export function useGameState(): UseGameStateReturn {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [isProcessing, setIsProcessing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingRef = useRef(false);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Start the turn timer
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setGameState((prev) => {
        if (prev.phase !== 'PLAYING') {
          if (timerRef.current) clearInterval(timerRef.current);
          return prev;
        }

        if (prev.turnTimeLeft <= 1) {
          // Time's up - switch turn and flip back any flipped cards
          const newCards = prev.cards.map((c) =>
            c.isFlipped && !c.isMatched ? { ...c, isFlipped: false } : c
          );
          return {
            ...prev,
            cards: newCards,
            currentTurn: prev.currentTurn === 1 ? 2 : 1,
            turnTimeLeft: GAME_CONFIG.TURN_TIME_LIMIT,
            flippedCards: [],
          };
        }

        return {
          ...prev,
          turnTimeLeft: prev.turnTimeLeft - 1,
        };
      });
    }, 1000);
  }, []);

  // Stop the timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Start a new game
  const startGame = useCallback(
    (player1Name: string, player2Name: string, gridSize: GridSize = '4x4') => {
      const cards = createCardDeck(gridSize);
      const totalPairs = cards.length / 2;

      const players: [Player, Player] = [
        createPlayer('player-1', player1Name, 0),
        createPlayer('player-2', player2Name, 1),
      ];

      setGameState({
        phase: 'PLAYING',
        currentTurn: 1,
        players,
        cards,
        flippedCards: [],
        matchedPairs: 0,
        totalPairs,
        turnTimeLeft: GAME_CONFIG.TURN_TIME_LIMIT,
        winner: null,
      });

      startTimer();
    },
    [startTimer]
  );

  // Process match check
  const processMatchCheck = useCallback((card1Id: string, card2Id: string) => {
    setTimeout(() => {
      setGameState((prev) => {
        const card1 = prev.cards.find((c) => c.id === card1Id);
        const card2 = prev.cards.find((c) => c.id === card2Id);

        if (!card1 || !card2 || !prev.players) {
          processingRef.current = false;
          setIsProcessing(false);
          return prev;
        }

        const isMatch = checkCardsMatch(card1, card2);

        if (isMatch) {
          // Mark cards as matched (追蹤是誰配對的)
          const newCards = prev.cards.map((c) =>
            c.id === card1Id || c.id === card2Id
              ? { ...c, isMatched: true, matchedBy: prev.currentTurn }
              : c
          );

          // Update player score and collected cards
          const newPlayers: [Player, Player] = [...prev.players];
          const currentPlayerIndex = prev.currentTurn - 1;
          const currentPlayer = newPlayers[currentPlayerIndex];
          
          // 加入收集到的卡片
          const collectedCards = currentPlayer.collectedCards || [];
          collectedCards.push({
            pairId: card1.pairId,
            symbol: card1.symbol,
          });
          
          newPlayers[currentPlayerIndex] = {
            ...currentPlayer,
            score: currentPlayer.score + 1,
            collectedCards,
          };

          const newMatchedPairs = prev.matchedPairs + 1;

          // Check if game is over
          const isGameOver = newMatchedPairs >= prev.totalPairs;

          if (isGameOver) {
            stopTimer();
            const winner = determineWinner(
              newPlayers[0].score,
              newPlayers[1].score
            );

            processingRef.current = false;
            setIsProcessing(false);

            return {
              ...prev,
              cards: newCards,
              players: newPlayers,
              flippedCards: [],
              matchedPairs: newMatchedPairs,
              phase: 'GAME_OVER' as GamePhase,
              winner,
            };
          }

          // Match found - player continues (reset timer)
          processingRef.current = false;
          setIsProcessing(false);

          return {
            ...prev,
            cards: newCards,
            players: newPlayers,
            flippedCards: [],
            matchedPairs: newMatchedPairs,
            turnTimeLeft: GAME_CONFIG.TURN_TIME_LIMIT,
          };
        } else {
          // No match - flip cards back and switch turn
          const newCards = prev.cards.map((c) =>
            c.id === card1Id || c.id === card2Id
              ? { ...c, isFlipped: false }
              : c
          );

          processingRef.current = false;
          setIsProcessing(false);

          return {
            ...prev,
            cards: newCards,
            flippedCards: [],
            currentTurn: prev.currentTurn === 1 ? 2 : 1,
            turnTimeLeft: GAME_CONFIG.TURN_TIME_LIMIT,
          };
        }
      });
    }, GAME_CONFIG.MATCH_CHECK_DELAY);
  }, [stopTimer]);

  // Handle card flip
  const flipCard = useCallback(
    (cardId: string) => {
      if (isProcessing || processingRef.current) return;

      setGameState((prev) => {
        // Guard conditions
        if (prev.phase !== 'PLAYING') return prev;
        if (prev.flippedCards.length >= 2) return prev;
        if (prev.flippedCards.includes(cardId)) return prev;

        const card = prev.cards.find((c) => c.id === cardId);
        if (!card || card.isMatched || card.isFlipped) return prev;

        // Flip the card
        const newCards = prev.cards.map((c) =>
          c.id === cardId ? { ...c, isFlipped: true } : c
        );

        const newFlippedCards = [...prev.flippedCards, cardId];

        // If this is the second card, trigger match check
        if (newFlippedCards.length === 2) {
          processingRef.current = true;
          setIsProcessing(true);
          // Schedule match check after the state update
          setTimeout(() => {
            processMatchCheck(newFlippedCards[0], newFlippedCards[1]);
          }, 0);
        }

        return {
          ...prev,
          cards: newCards,
          flippedCards: newFlippedCards,
        };
      });
    },
    [isProcessing, processMatchCheck]
  );

  // Reset the game
  const resetGame = useCallback(() => {
    stopTimer();
    setGameState(createInitialState());
    setIsProcessing(false);
  }, [stopTimer]);

  return {
    gameState,
    startGame,
    flipCard,
    resetGame,
    isProcessing,
  };
}
