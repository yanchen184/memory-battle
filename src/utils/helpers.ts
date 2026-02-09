/**
 * Game Helper Functions
 * @version 1.0.0
 */

import { CardData, GridConfig, GRID_CONFIGS, GridSize } from '../types';
import { CARD_SYMBOLS } from './constants';

/**
 * Generates a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Creates a deck of cards for the game
 */
export function createCardDeck(gridSize: GridSize = '4x4'): CardData[] {
  const config: GridConfig = GRID_CONFIGS[gridSize];
  const { totalPairs } = config;

  // Select random symbols for the pairs
  const availableSymbols = shuffleArray([...CARD_SYMBOLS]).slice(0, totalPairs);

  // Create pairs
  const cards: CardData[] = [];
  availableSymbols.forEach((symbolData) => {
    // Create two cards for each symbol (a pair)
    for (let i = 0; i < 2; i++) {
      cards.push({
        id: generateId(),
        pairId: symbolData.id,
        symbol: symbolData.symbol,
        isFlipped: false,
        isMatched: false,
        matchedBy: null, // 初始沒有被配對
      });
    }
  });

  // Shuffle and return
  return shuffleArray(cards);
}

/**
 * Checks if two cards are a match
 */
export function checkCardsMatch(card1: CardData, card2: CardData): boolean {
  return card1.pairId === card2.pairId && card1.id !== card2.id;
}

/**
 * Formats time in MM:SS format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculates the progress percentage
 */
export function calculateProgress(current: number, max: number): number {
  return Math.max(0, Math.min(100, (current / max) * 100));
}

/**
 * Clamps a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generates random position within bounds
 */
export function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generates random color from palette
 */
export function randomColor(colors: string[]): string {
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Delays execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gets grid configuration from size string
 */
export function getGridConfig(size: GridSize): GridConfig {
  return GRID_CONFIGS[size];
}

/**
 * Determines the winner based on scores
 */
export function determineWinner(
  score1: number,
  score2: number
): 1 | 2 | 'DRAW' {
  if (score1 > score2) return 1;
  if (score2 > score1) return 2;
  return 'DRAW';
}

/**
 * Gets the element's center position
 */
export function getElementCenter(element: HTMLElement): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/**
 * Calculates distance between two points
 */
export function distance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
