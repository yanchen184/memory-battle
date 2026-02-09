# 🎴 Memory Battle - 卡牌收集更新

**更新日期：** 2026-02-09  
**版本：** v2.1.0  
**功能：** 卡牌收集視覺化系統

---

## 🎯 更新內容

### ✅ 已實作功能

#### 1️⃣ 卡片追蹤系統
- ✅ 追蹤每張卡片被誰配對（`matchedBy` 欄位）
- ✅ 玩家收集卡片清單（`collectedCards` 陣列）
- ✅ 配對成功時自動記錄到玩家的收集列表

#### 2️⃣ 視覺化收集區域
- ✅ **CollectedCards 組件** - 顯示玩家收集的卡片
  - 卡片堆疊效果（3px 偏移，有深度感）
  - 小型卡片縮圖（48x32px）
  - 隨機輕微旋轉（更自然）
  - 卡片數量徽章（`×N`）
- ✅ **PlayerInfo 組件重新設計**
  - 垂直佈局（頭像 + 資訊在上，收集區在下）
  - 整合 CollectedCards 顯示
  - 空狀態顯示（"No cards"）

#### 3️⃣ 卡牌飛行動畫（已準備）
- ✅ **FlyingCardEffect 組件** - 卡片飛向玩家的動畫
  - 從棋盤位置飛向玩家區域
  - 飛行過程縮小並旋轉
  - 發光脈衝效果
  - 到達後淡出

---

## 🎨 視覺效果

### 收集區域設計

**空狀態（沒有卡片）：**
```
┌─────────────────┐
│  No cards       │  虛線邊框，半透明
└─────────────────┘
```

**有卡片時：**
```
┌────┐           
│ 🦊 │ ←─ 第3張卡片（最上層）
└────┘
  ┌────┐        
  │ 🐺 │ ←─ 第2張卡片
  └────┘
    ┌────┐     
    │ 🦁 │ ←─ 第1張卡片
    └────┘
         [×3] ←─ 數量徽章
```

**特色：**
- 🎴 卡片堆疊效果（每張偏移 3px）
- 🎨 玩家主題色邊框（青色 or 粉色）
- ✨ 發光陰影效果
- 🔢 卡片數量徽章

---

## 📂 檔案變更

### 新增檔案

1. **`src/components/CollectedCards.tsx`**
   - 顯示玩家收集的卡片堆
   - 支援堆疊效果和數量顯示

2. **`src/components/FlyingCardEffect.tsx`**
   - 卡片飛行動畫效果（待整合）
   - GSAP 動畫實作

### 修改檔案

1. **`src/types/index.ts`**
   ```typescript
   // 新增欄位
   CardData {
     matchedBy: PlayerTurn | null; // 追蹤被誰配對
   }
   
   Player {
     collectedCards?: { pairId: number; symbol: string }[]; // 收集的卡片
   }
   ```

2. **`src/hooks/useGameState.ts`**
   - 配對成功時記錄 `matchedBy`
   - 將卡片加入玩家的 `collectedCards`
   - 初始化空陣列

3. **`src/utils/helpers.ts`**
   - `createCardDeck()` 初始化 `matchedBy: null`

4. **`src/components/PlayerInfo.tsx`**
   - 改為垂直佈局
   - 整合 CollectedCards 組件
   - 調整間距和響應式

5. **`src/components/index.ts`**
   - 導出 CollectedCards
   - 導出 FlyingCardEffect

---

## 🔮 待整合功能

### 卡片飛行動畫（已建立，待連接）

**FlyingCardEffect 組件已完成，需要整合：**

1. **在 App.tsx 或 GameBoard 中使用**
   - 監聽配對成功事件
   - 觸發 FlyingCardEffect 組件
   - 取得卡片棋盤位置和目標玩家

2. **整合方式範例：**
   ```tsx
   // App.tsx
   {flyingCards.map((card, index) => (
     <FlyingCardEffect
       key={`${card.id}-${index}`}
       cardSymbol={card.symbol}
       fromPosition={card.position}
       toPlayerNumber={card.matchedBy}
       onComplete={() => removeFlyingCard(card.id)}
     />
   ))}
   ```

3. **需要追蹤：**
   - 配對成功的卡片列表（臨時狀態）
   - 卡片在棋盤上的位置（getBoundingClientRect）
   - 動畫完成後清除臨時狀態

---

## 🎮 使用體驗

### 現在的流程

1. **遊戲開始**
   - 玩家區域顯示 "No cards"
   - Score: 0

2. **配對成功時**
   - ✅ 卡片標記為已配對
   - ✅ 記錄到玩家的 `collectedCards`
   - ✅ 分數 +1
   - ✅ CollectedCards 區域立即更新

3. **玩家收集區域**
   - 顯示小型卡片縮圖
   - 卡片堆疊效果
   - 數量徽章

### 待加入的體驗（飛行動畫）

1. **配對成功時**
   - 🎬 卡片從棋盤飛向玩家區域
   - ✨ 飛行過程有發光效果
   - 🎯 到達玩家區域後淡出
   - 📦 CollectedCards 區域同步更新

---

## 📊 技術實作細節

### CollectedCards 組件邏輯

```typescript
// 計算堆疊位置
const stackedCards = collectedCards.map((card, index) => ({
  ...card,
  zIndex: index,
  offset: index * 3, // 3px 偏移
  rotation: (Math.random() - 0.5) * 4, // ±2度隨機旋轉
}));
```

### 玩家主題色應用

```typescript
const playerColor = playerNumber === 1 
  ? PLAYER_COLORS.PLAYER_1  // #00f5ff (青色)
  : PLAYER_COLORS.PLAYER_2; // #ff00ff (粉色)
```

### 卡片追蹤流程

```typescript
// useGameState.ts - processMatchCheck()
if (isMatch) {
  // 1. 標記卡片被誰配對
  const newCards = prev.cards.map((c) =>
    c.id === card1Id || c.id === card2Id
      ? { ...c, isMatched: true, matchedBy: prev.currentTurn }
      : c
  );

  // 2. 加入玩家收集列表
  const collectedCards = currentPlayer.collectedCards || [];
  collectedCards.push({
    pairId: card1.pairId,
    symbol: card1.symbol,
  });

  // 3. 更新玩家狀態
  newPlayers[currentPlayerIndex] = {
    ...currentPlayer,
    score: currentPlayer.score + 1,
    collectedCards,
  };
}
```

---

## 🎯 下一步計畫

### 優先級 1：整合飛行動畫
- [ ] 在 GameBoard 或 App.tsx 追蹤配對事件
- [ ] 取得卡片棋盤位置（ref + getBoundingClientRect）
- [ ] 觸發 FlyingCardEffect 組件
- [ ] 測試動畫流暢度

### 優先級 2：動畫優化
- [ ] 調整飛行速度和軌跡
- [ ] 加入音效（卡片收集音）
- [ ] 多張卡片同時飛行的效果

### 優先級 3：額外視覺效果
- [ ] 收集區域獲得新卡片時的閃光效果
- [ ] 卡片數量徽章的動畫（數字增加）
- [ ] 玩家收集區域滿了的特殊效果

---

## 🐛 已知問題

- ⚠️ **FlyingCardEffect 尚未連接** - 組件已建立但未在遊戲中使用
- ℹ️ **線上模式需要同步** - 需要確保線上對戰時 `collectedCards` 正確同步

---

## 📸 截圖

### 遊戲初始狀態
- 玩家 1（左側）：青色邊框，"No cards"
- 玩家 2（右側）：粉色邊框，"No cards"
- 新的垂直佈局（頭像 + 資訊 + 收集區）

### 配對成功後（預期效果）
- 卡片堆疊顯示（小型縮圖）
- 數量徽章（×N）
- 玩家主題色邊框和發光效果

---

## 🎉 總結

**已完成的核心功能：**
✅ 卡片追蹤系統（matchedBy, collectedCards）  
✅ CollectedCards 視覺化組件  
✅ PlayerInfo 重新設計（垂直佈局）  
✅ FlyingCardEffect 動畫組件（待連接）

**遊戲體驗提升：**
🎴 玩家現在能「看見」自己收集的卡片  
📊 不只是數字分數，而是視覺化收集成果  
🎯 為卡牌對戰遊戲增添收集感

**下一步：**
🚀 整合飛行動畫，讓卡片收集過程更生動！

---

**開發時間：** ~30 分鐘  
**程式碼品質：** 模組化、可重用、類型安全  
**視覺品質：** 符合遊戲霓虹風格，專業級 UI

🎮 **卡牌收集系統已就緒！**
