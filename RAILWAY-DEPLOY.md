# 🚂 Memory Battle - Railway 部署指南

## 📋 問題診斷

### ❌ 原始問題

1. **WebSocket URL 不匹配**
   - 前端指向：`ws://localhost:8089/ws/memory-battle/auto`
   - 實際伺服器：`ws://localhost:3001`（無路徑）

2. **Railway URL 錯誤**
   - 前端指向：`love-letter-server-production.up.railway.app`
   - 應該是：獨立的 Memory Battle 伺服器

3. **路徑處理缺失**
   - 前端期待：`/ws/memory-battle/auto`
   - 伺服器沒有路徑處理邏輯

### ✅ 已修復

- ✅ 更新前端 WebSocket URL：
  - 本地：`ws://localhost:3001`
  - 生產：`wss://memory-battle-server-production.up.railway.app`

---

## 🚀 Railway 部署步驟

### 1️⃣ 準備伺服器代碼

確認 `server/` 目錄包含：

```
server/
├── index.js           # WebSocket 伺服器主檔案
├── package.json       # 依賴管理
├── railway.json       # Railway 配置
├── Procfile           # 啟動命令
└── .gitignore         # Git 忽略檔案
```

### 2️⃣ 在 Railway 建立新專案

#### 選項 A：使用 Railway CLI（推薦）

```bash
# 1. 安裝 Railway CLI
npm install -g @railway/cli

# 2. 登入 Railway
railway login

# 3. 切換到 server 目錄
cd D:\frontend\memory-battle\server

# 4. 初始化 Railway 專案
railway init

# 5. 部署
railway up
```

#### 選項 B：使用 Railway Web UI

1. 訪問 [railway.app](https://railway.app)
2. 點擊 "New Project"
3. 選擇 "Deploy from GitHub repo" 或 "Empty Project"
4. 如果是 GitHub：
   - 連接你的 GitHub 帳號
   - 選擇 `memory-battle` repository
   - **Root Directory** 設置為 `server`
5. 如果是 Empty Project：
   - 手動上傳 `server/` 目錄的檔案

### 3️⃣ 配置環境變數（可選）

在 Railway 專案設置中添加：

```
NODE_ENV=production
```

### 4️⃣ 檢查部署設定

Railway 應該自動檢測到：
- ✅ Node.js 專案
- ✅ `package.json` 的 `start` 腳本
- ✅ `Procfile` 的 `web` 命令
- ✅ PORT 環境變數（Railway 自動提供）

### 5️⃣ 取得部署 URL

部署成功後，Railway 會提供一個 URL，例如：
```
https://memory-battle-server-production.up.railway.app
```

### 6️⃣ 更新前端配置

如果你的 Railway URL 不是預設的，請建立 `.env` 檔案：

```bash
# D:\frontend\memory-battle\.env
VITE_WS_URL=wss://your-actual-railway-url.up.railway.app
```

---

## 🧪 測試部署

### 1. 檢查伺服器健康狀態

```bash
# 訪問 Health Check 端點
curl https://your-railway-url.up.railway.app:3002
```

預期回應：
```
OK - Memory Battle WebSocket Server v1.0.0
```

### 2. 測試 WebSocket 連線

使用瀏覽器開發者工具：

```javascript
// 在 Console 中執行
const ws = new WebSocket('wss://your-railway-url.up.railway.app');
ws.onopen = () => console.log('✅ Connected!');
ws.onerror = (e) => console.error('❌ Error:', e);
```

### 3. 測試完整遊戲流程

1. 啟動本地前端：
   ```bash
   cd D:\frontend\memory-battle
   npm run dev
   ```

2. 打開瀏覽器：`http://localhost:5175`

3. 選擇 "Online Battle"

4. 檢查連線狀態：
   - ✅ 應該顯示 "Connected"
   - ✅ 可以加入房間
   - ✅ 可以開始遊戲

---

## 🐛 常見問題排查

### 問題 1：無法連接到 Railway 伺服器

**症狀：** 前端顯示 "Disconnected" 或 "Connecting..."

**解決方案：**

1. **檢查 Railway 部署狀態**
   ```bash
   railway logs
   ```

2. **檢查 WebSocket URL**
   - 確認 `.env` 中的 `VITE_WS_URL` 正確
   - 或檢查 `src/hooks/useWebSocket.ts` 的預設 URL

3. **檢查 HTTPS/WSS 協議**
   - Railway 必須使用 `wss://`（不是 `ws://`）
   - 確認 URL 以 `wss://` 開頭

4. **檢查防火牆/網路**
   - 嘗試在不同網路環境測試
   - 檢查瀏覽器開發者工具的 Network 標籤

### 問題 2：伺服器啟動失敗

**症狀：** Railway 顯示 "Build Failed" 或 "Crashed"

**解決方案：**

1. **檢查 Node.js 版本**
   ```json
   // package.json
   "engines": {
     "node": ">=18.0.0"
   }
   ```

2. **檢查依賴安裝**
   ```bash
   cd server
   npm install
   ```

3. **本地測試**
   ```bash
   cd server
   PORT=3001 node index.js
   ```

4. **查看 Railway 日誌**
   ```bash
   railway logs --tail
   ```

### 問題 3：PORT 環境變數錯誤

**症狀：** 伺服器啟動但無法訪問

**解決方案：**

確認 `server/index.js` 正確使用 PORT：
```javascript
const PORT = process.env.PORT || 3001;
```

Railway 會自動設置 `process.env.PORT`，不要硬編碼。

### 問題 4：WebSocket 握手失敗

**症狀：** 瀏覽器 Console 顯示 "WebSocket connection failed"

**解決方案：**

1. **檢查 CORS 設置**（如果有使用 HTTP server）

2. **確認 WebSocket 伺服器正確初始化**
   ```javascript
   const wss = new WebSocketServer({ server });
   // 或
   const wss = new WebSocketServer({ port: PORT });
   ```

3. **檢查 Railway 的 WebSocket 支援**
   - Railway 預設支援 WebSocket
   - 確認沒有使用 HTTP/HTTPS 代理干擾

---

## 📊 Railway 部署檢查清單

- [ ] ✅ Git repository 已推送到 GitHub
- [ ] ✅ `server/package.json` 有 `start` 腳本
- [ ] ✅ `server/Procfile` 定義 `web: node index.js`
- [ ] ✅ `server/railway.json` 配置正確
- [ ] ✅ Railway 專案已建立
- [ ] ✅ 部署成功（無錯誤日誌）
- [ ] ✅ Health check 端點可訪問
- [ ] ✅ WebSocket 連線測試成功
- [ ] ✅ 前端 `.env` 配置正確（如果需要）
- [ ] ✅ 線上遊戲功能正常

---

## 🔄 更新部署

### 自動部署（推薦）

如果已連接 GitHub：
```bash
git add .
git commit -m "Update server"
git push origin main
```

Railway 會自動檢測並重新部署。

### 手動部署

```bash
cd D:\frontend\memory-battle\server
railway up
```

---

## 📝 環境變數參考

### Railway 必需的環境變數

| 變數 | 說明 | 範例值 |
|------|------|--------|
| `PORT` | Railway 自動設置 | 自動（通常 443） |
| `NODE_ENV` | 環境標識（可選） | `production` |

### 前端環境變數（可選）

| 變數 | 說明 | 範例值 |
|------|------|--------|
| `VITE_WS_URL` | WebSocket 伺服器 URL | `wss://your-app.up.railway.app` |

---

## 🎯 完成後的架構

```
前端（Vite）
  ↓
  WebSocket 連線
  ↓
Railway 伺服器（Memory Battle Server）
  - Port: Railway 自動分配
  - URL: wss://your-app.up.railway.app
  - 功能：房間管理、遊戲邏輯、即時同步
```

---

## 📞 需要幫助？

如果遇到問題：

1. **檢查 Railway 日誌**
   ```bash
   railway logs --tail
   ```

2. **檢查瀏覽器 Console**
   - 打開開發者工具（F12）
   - 查看 Console 和 Network 標籤

3. **本地測試伺服器**
   ```bash
   cd server
   node index.js
   ```

4. **重新部署**
   ```bash
   railway redeploy
   ```

---

**🎉 部署成功後，你的 Memory Battle 就可以全球連線對戰了！**
