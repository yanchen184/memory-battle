/**
 * Game History System - LocalStorage-based game records
 * @version 1.0.0
 */

export interface GameRecord {
  id: string;
  timestamp: number;
  mode: 'local' | 'ai' | 'online';
  gridSize: '4x4' | '4x6' | '6x6';
  player1: {
    name: string;
    score: number;
  };
  player2: {
    name: string;
    score: number;
  };
  winner: 'player1' | 'player2' | 'draw';
  duration: number; // seconds
}

export interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  avgScore: number;
  bestScore: number;
  totalPlayTime: number; // seconds
}

const STORAGE_KEY = 'memory_battle_history';
const MAX_RECORDS = 50; // Keep last 50 games

class GameHistoryManager {
  /**
   * 儲存遊戲記錄
   */
  saveGame(record: Omit<GameRecord, 'id' | 'timestamp'>): void {
    const history = this.getHistory();
    
    const newRecord: GameRecord = {
      ...record,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    history.unshift(newRecord); // Add to beginning

    // Keep only last MAX_RECORDS
    if (history.length > MAX_RECORDS) {
      history.splice(MAX_RECORDS);
    }

    this.saveHistory(history);
  }

  /**
   * 取得所有遊戲記錄
   */
  getHistory(): GameRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load game history:', e);
      return [];
    }
  }

  /**
   * 取得統計資料
   */
  getStats(): GameStats {
    const history = this.getHistory();

    if (history.length === 0) {
      return {
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        avgScore: 0,
        bestScore: 0,
        totalPlayTime: 0,
      };
    }

    const wins = history.filter(g => g.winner === 'player1').length;
    const losses = history.filter(g => g.winner === 'player2').length;
    const draws = history.filter(g => g.winner === 'draw').length;

    const totalScore = history.reduce((sum, g) => sum + g.player1.score, 0);
    const bestScore = Math.max(...history.map(g => g.player1.score));
    const totalPlayTime = history.reduce((sum, g) => sum + g.duration, 0);

    return {
      totalGames: history.length,
      wins,
      losses,
      draws,
      winRate: history.length > 0 ? (wins / history.length) * 100 : 0,
      avgScore: history.length > 0 ? totalScore / history.length : 0,
      bestScore,
      totalPlayTime,
    };
  }

  /**
   * 取得最近 N 場遊戲
   */
  getRecentGames(count: number = 10): GameRecord[] {
    const history = this.getHistory();
    return history.slice(0, count);
  }

  /**
   * 清除所有歷史記錄
   */
  clearHistory(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * 內部方法：儲存歷史記錄
   */
  private saveHistory(history: GameRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save game history:', e);
    }
  }
}

// Singleton instance
export const gameHistory = new GameHistoryManager();
