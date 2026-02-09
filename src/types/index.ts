/**
 * Memory Battle - Type Definitions
 * @version 1.0.0
 */

// ============================================
// Game State Types
// ============================================

export type GamePhase = 'LOBBY' | 'PLAYING' | 'GAME_OVER';

export type PlayerTurn = 1 | 2;

export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING';

// ============================================
// Card Types
// ============================================

export interface CardData {
  id: string;
  pairId: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
  matchedBy: PlayerTurn | null; // 追蹤被哪個玩家配對
}

export type CardState = 'HIDDEN' | 'FLIPPED' | 'MATCHED';

export interface CardPosition {
  row: number;
  col: number;
}

// ============================================
// Player Types
// ============================================

export interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  isReady: boolean;
  isConnected: boolean;
  collectedCards?: { pairId: number; symbol: string }[]; // 收集到的卡片
}

export interface PlayerScore {
  playerId: string;
  score: number;
  matchedPairs: number[];
}

// ============================================
// Game Types
// ============================================

export interface GameState {
  phase: GamePhase;
  currentTurn: PlayerTurn;
  players: [Player, Player] | null;
  cards: CardData[];
  flippedCards: string[];
  matchedPairs: number;
  totalPairs: number;
  turnTimeLeft: number;
  winner: PlayerTurn | 'DRAW' | null;
}

export interface GameConfig {
  gridRows: number;
  gridCols: number;
  turnTimeLimit: number;
  symbols: string[];
}

export interface MatchResult {
  isMatch: boolean;
  card1Id: string;
  card2Id: string;
  pairId: number;
  scoringPlayer: PlayerTurn;
}

// ============================================
// Animation Types
// ============================================

export type AnimationType =
  | 'FLIP'
  | 'MATCH_SUCCESS'
  | 'MATCH_FAIL'
  | 'SCORE_UPDATE'
  | 'TURN_CHANGE'
  | 'VICTORY';

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface ParticleConfig {
  count: number;
  colors: string[];
  size: { min: number; max: number };
  speed: { min: number; max: number };
  lifetime: number;
}

// ============================================
// Effect Types
// ============================================

export interface MatchEffectData {
  position: { x: number; y: number };
  isSuccess: boolean;
  timestamp: number;
}

export interface VictoryData {
  winner: Player;
  loser: Player;
  finalScores: [number, number];
  isDraw: boolean;
  gameMode?: 'local' | 'ai' | 'online';
  gridSize?: GridSize;
  duration?: number; // seconds
}

// ============================================
// Audio Types
// ============================================

export type SoundType =
  | 'CARD_FLIP'
  | 'MATCH_SUCCESS'
  | 'MATCH_FAIL'
  | 'TURN_CHANGE'
  | 'VICTORY'
  | 'DEFEAT'
  | 'TIMER_WARNING'
  | 'BUTTON_CLICK';

export interface AudioConfig {
  volume: number;
  muted: boolean;
}

// ============================================
// Action Types (for reducers)
// ============================================

export type GameAction =
  | { type: 'START_GAME'; payload: { players: [Player, Player]; cards: CardData[] } }
  | { type: 'FLIP_CARD'; payload: { cardId: string } }
  | { type: 'CHECK_MATCH' }
  | { type: 'SWITCH_TURN' }
  | { type: 'UPDATE_SCORE'; payload: { player: PlayerTurn; points: number } }
  | { type: 'SET_MATCHED'; payload: { cardIds: string[] } }
  | { type: 'RESET_FLIPPED' }
  | { type: 'END_GAME'; payload: { winner: PlayerTurn | 'DRAW' } }
  | { type: 'RESET_GAME' }
  | { type: 'UPDATE_TIMER'; payload: { timeLeft: number } }
  | { type: 'SET_PHASE'; payload: { phase: GamePhase } };

// ============================================
// Component Props Types
// ============================================

export interface CardProps {
  card: CardData;
  onClick: (cardId: string) => void;
  disabled: boolean;
  showMatchEffect?: boolean;
  showFailEffect?: boolean;
}

export interface GameBoardProps {
  cards: CardData[];
  onCardClick: (cardId: string) => void;
  disabled: boolean;
  gridCols: number;
}

export interface PlayerInfoProps {
  player: Player;
  isCurrentTurn: boolean;
  playerNumber: 1 | 2;
}

export interface ScoreBoardProps {
  player1Score: number;
  player2Score: number;
  player1Name: string;
  player2Name: string;
}

export interface TimerProps {
  timeLeft: number;
  maxTime: number;
  isWarning: boolean;
}

export interface VictoryScreenProps {
  victoryData: VictoryData;
  onPlayAgain: () => void;
  onExit: () => void;
}

export interface LobbyProps {
  onStartGame: (playerName: string) => void;
  connectionStatus: ConnectionStatus;
  isAIMode?: boolean; // 是否為 AI 模式
}

// ============================================
// Utility Types
// ============================================

export type GridSize = '4x4' | '4x6' | '6x6';

export interface GridConfig {
  rows: number;
  cols: number;
  totalCards: number;
  totalPairs: number;
}

export const GRID_CONFIGS: Record<GridSize, GridConfig> = {
  '4x4': { rows: 4, cols: 4, totalCards: 16, totalPairs: 8 },
  '4x6': { rows: 4, cols: 6, totalCards: 24, totalPairs: 12 },
  '6x6': { rows: 6, cols: 6, totalCards: 36, totalPairs: 18 },
};
