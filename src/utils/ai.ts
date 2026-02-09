/**
 * AI Opponent Logic - Perfect Memory AI
 * @version 1.0.0
 * 
 * AI 特性：
 * - 完美記憶所有翻開過的卡片
 * - 優先配對已知的卡片
 * - 隨機探索未知卡片
 * - 不會犯錯（記憶力完美）
 */

import type { CardData } from '../types';

interface AIMemory {
  // 記錄卡片位置和符號
  knownCards: Map<string, { symbol: string; pairId: number }>;
  // 記錄已配對的符號
  matchedPairIds: Set<number>;
}

export class AIOpponent {
  private memory: AIMemory;
  private difficulty: 'easy' | 'medium' | 'hard';
  private thinkingDelay: number;

  constructor(difficulty: 'easy' | 'medium' | 'hard' = 'hard') {
    this.difficulty = difficulty;
    this.memory = {
      knownCards: new Map(),
      matchedPairIds: new Set(),
    };
    
    // AI 思考延遲（模擬人類思考）
    this.thinkingDelay = {
      easy: 1500,   // 1.5秒
      medium: 1000, // 1秒
      hard: 500,    // 0.5秒（快速決策）
    }[difficulty];
  }

  /**
   * 記憶翻開的卡片
   */
  rememberCard(cardId: string, symbol: string, pairId: number): void {
    this.memory.knownCards.set(cardId, { symbol, pairId });
  }

  /**
   * 記錄已配對的符號
   */
  rememberMatch(pairId: number): void {
    this.memory.matchedPairIds.add(pairId);
  }

  /**
   * 清除記憶
   */
  clearMemory(): void {
    this.memory.knownCards.clear();
    this.memory.matchedPairIds.clear();
  }

  /**
   * 決定下一步行動
   * @param cards 當前所有卡片
   * @param flippedCards 已翻開的卡片（本回合）
   * @returns 要翻開的卡片 ID
   */
  async makeMove(
    cards: CardData[],
    flippedCards: string[]
  ): Promise<string> {
    // 模擬思考延遲
    await this.delay(this.thinkingDelay);

    // 可翻開的卡片（未翻開且未配對）
    const availableCards = cards.filter(
      (c) => !c.isFlipped && !c.isMatched && !flippedCards.includes(c.id)
    );

    if (availableCards.length === 0) {
      throw new Error('No available cards to flip');
    }

    // 如果這是本回合第一張卡片
    if (flippedCards.length === 0) {
      return this.selectFirstCard(availableCards);
    }

    // 如果這是本回合第二張卡片
    if (flippedCards.length === 1) {
      return this.selectSecondCard(availableCards, flippedCards[0], cards);
    }

    throw new Error('Invalid state: too many flipped cards');
  }

  /**
   * 選擇第一張卡片
   * 策略：優先選擇已知且有配對的卡片
   */
  private selectFirstCard(availableCards: CardData[]): string {
    // 尋找已知且有配對的卡片
    for (const card of availableCards) {
      const known = this.memory.knownCards.get(card.id);
      if (known && !this.memory.matchedPairIds.has(known.pairId)) {
        // 檢查是否知道這張卡片的配對
        const hasPair = this.hasKnownPair(card.id, known.pairId, availableCards);
        if (hasPair) {
          return card.id; // 優先選擇有已知配對的卡片
        }
      }
    }

    // 如果沒有已知配對，隨機選擇一張未知卡片
    const unknownCards = availableCards.filter(
      (c) => !this.memory.knownCards.has(c.id)
    );

    if (unknownCards.length > 0) {
      return this.randomChoice(unknownCards).id;
    }

    // 如果所有卡片都已知但沒有配對，隨機選擇
    return this.randomChoice(availableCards).id;
  }

  /**
   * 選擇第二張卡片
   * 策略：如果第一張卡片已知配對，直接選配對；否則探索
   */
  private selectSecondCard(
    availableCards: CardData[],
    firstCardId: string,
    allCards: CardData[]
  ): string {
    // 取得第一張卡片的資訊
    const firstCard = allCards.find((c) => c.id === firstCardId);
    if (!firstCard) {
      return this.randomChoice(availableCards).id;
    }

    // 如果第一張卡片已知
    const firstKnown = this.memory.knownCards.get(firstCardId);
    if (firstKnown) {
      // 尋找配對的卡片
      for (const card of availableCards) {
        const known = this.memory.knownCards.get(card.id);
        if (known && known.pairId === firstKnown.pairId) {
          return card.id; // 完美配對！
        }
      }
    }

    // 如果第一張卡片未知，或找不到配對，隨機探索
    const unknownCards = availableCards.filter(
      (c) => !this.memory.knownCards.has(c.id)
    );

    if (unknownCards.length > 0) {
      return this.randomChoice(unknownCards).id;
    }

    // 如果所有卡片都已知，隨機選擇
    return this.randomChoice(availableCards).id;
  }

  /**
   * 檢查是否知道某張卡片的配對
   */
  private hasKnownPair(
    cardId: string,
    pairId: number,
    availableCards: CardData[]
  ): boolean {
    for (const card of availableCards) {
      if (card.id === cardId) continue;
      const known = this.memory.knownCards.get(card.id);
      if (known && known.pairId === pairId) {
        return true;
      }
    }
    return false;
  }

  /**
   * 隨機選擇
   */
  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * 延遲工具
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 取得 AI 難度描述
   */
  getDifficultyDescription(): string {
    return {
      easy: 'AI 會慢速思考，記憶力一般',
      medium: 'AI 思考較快，記憶力良好',
      hard: 'AI 快速決策，完美記憶',
    }[this.difficulty];
  }
}

/**
 * 建立 AI 對手實例
 */
export function createAI(difficulty: 'easy' | 'medium' | 'hard' = 'hard'): AIOpponent {
  return new AIOpponent(difficulty);
}
