/**
 * Game Constants
 * @version 1.0.0
 */

// ============================================
// Card Symbols (Emoji-based)
// ============================================

export const CARD_SYMBOLS = [
  // Nature & Animals
  { id: 0, symbol: '🦊', name: 'Fox' },
  { id: 1, symbol: '🐺', name: 'Wolf' },
  { id: 2, symbol: '🦁', name: 'Lion' },
  { id: 3, symbol: '🐯', name: 'Tiger' },
  { id: 4, symbol: '🦋', name: 'Butterfly' },
  { id: 5, symbol: '🌸', name: 'Cherry Blossom' },
  { id: 6, symbol: '🌙', name: 'Moon' },
  { id: 7, symbol: '⭐', name: 'Star' },
  // Fantasy & Magic
  { id: 8, symbol: '🔮', name: 'Crystal Ball' },
  { id: 9, symbol: '🗡️', name: 'Sword' },
  { id: 10, symbol: '🛡️', name: 'Shield' },
  { id: 11, symbol: '🏰', name: 'Castle' },
  { id: 12, symbol: '🐉', name: 'Dragon' },
  { id: 13, symbol: '🧙', name: 'Wizard' },
  { id: 14, symbol: '👑', name: 'Crown' },
  { id: 15, symbol: '💎', name: 'Gem' },
  // Elements & Space
  { id: 16, symbol: '🔥', name: 'Fire' },
  { id: 17, symbol: '💧', name: 'Water' },
];

// ============================================
// Animation Durations (in milliseconds)
// ============================================

export const ANIMATION_DURATION = {
  CARD_FLIP: 600,
  MATCH_SUCCESS: 800,
  MATCH_FAIL: 500,
  TURN_CHANGE: 400,
  SCORE_UPDATE: 300,
  VICTORY: 2000,
  PARTICLE_LIFETIME: 1500,
} as const;

// ============================================
// Game Settings
// ============================================

export const GAME_CONFIG = {
  DEFAULT_GRID: '4x4' as const,
  TURN_TIME_LIMIT: 30, // seconds
  MATCH_CHECK_DELAY: 800, // ms before checking match
  NEW_TURN_DELAY: 1000, // ms before new turn starts
  TIMER_WARNING_THRESHOLD: 10, // seconds left when warning shows
} as const;

// ============================================
// Player Defaults
// ============================================

export const DEFAULT_PLAYER = {
  AVATARS: ['👤', '👥', '🎮', '🎲', '🃏', '🎯'],
  NAMES: ['Player 1', 'Player 2'],
} as const;

// ============================================
// Colors - Pixel Cute Adventure Theme 🎨
// ============================================

export const PIXEL_COLORS = {
  PINK: '#ff6b9d',
  YELLOW: '#ffd93d',
  GREEN: '#6bcf7f',
  BLUE: '#6eb5ff',
  PURPLE: '#c084fc',
  ORANGE: '#ff9966',
  RED: '#ff6b6b',
  CYAN: '#4dd4ff',
} as const;

// Backward compatibility alias
export const NEON_COLORS = PIXEL_COLORS;

export const PLAYER_COLORS = {
  PLAYER_1: PIXEL_COLORS.CYAN,
  PLAYER_2: PIXEL_COLORS.PINK,
} as const;

// ============================================
// Z-Index Layers
// ============================================

export const Z_INDEX = {
  GAME_BOARD: 1,
  CARDS: 10,
  FLIPPED_CARD: 20,
  EFFECTS: 100,
  MODAL: 200,
  VICTORY_SCREEN: 300,
} as const;

// ============================================
// Grid Configurations
// ============================================

export const GRID_CONFIGS = {
  '4x4': {
    rows: 4,
    cols: 4,
    totalCards: 16,
    totalPairs: 8,
  },
  '4x6': {
    rows: 4,
    cols: 6,
    totalCards: 24,
    totalPairs: 12,
  },
  '6x6': {
    rows: 6,
    cols: 6,
    totalCards: 36,
    totalPairs: 18,
  },
} as const;
