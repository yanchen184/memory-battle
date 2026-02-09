/**
 * GameHistory Component - 顯示每一手的歷史記錄
 * @version 1.0.0
 */

import { memo } from 'react';

export interface HistoryEntry {
  id: string;
  turnNumber: number;
  playerName: string;
  playerNumber: 1 | 2;
  action: 'flip' | 'match' | 'mismatch' | 'timeout';
  cards?: string[]; // emoji symbols
  timestamp: number;
}

interface GameHistoryProps {
  history: HistoryEntry[];
  isCompact?: boolean;
}

function GameHistoryComponent({ history, isCompact = false }: GameHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="text-center text-[var(--text-muted)] py-4">
        <p className="text-xs">尚無記錄</p>
      </div>
    );
  }

  return (
    <div className="game-history overflow-y-auto" style={{ maxHeight: isCompact ? '200px' : '300px' }}>
      <div className="space-y-2">
        {history.slice().reverse().map((entry) => (
          <div
            key={entry.id}
            className="history-entry p-2 rounded"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold" style={{ color: entry.playerNumber === 1 ? '#4dd4ff' : '#ff6b9d' }}>
                  {entry.playerName}
                </span>
                <span className="text-[var(--text-muted)]">#{entry.turnNumber}</span>
              </div>
              <span className="text-[var(--text-muted)] text-[10px]">
                {new Date(entry.timestamp).toLocaleTimeString('zh-TW', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>

            <div className="mt-1">
              {entry.action === 'flip' && entry.cards && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-[var(--text-muted)]">翻開：</span>
                  <div className="flex gap-1">
                    {entry.cards.map((symbol, idx) => (
                      <span key={idx} className="text-lg">{symbol}</span>
                    ))}
                  </div>
                </div>
              )}

              {entry.action === 'match' && entry.cards && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-[#6bcf7f]">✓ 配對成功：</span>
                  <div className="flex gap-1">
                    {entry.cards.map((symbol, idx) => (
                      <span key={idx} className="text-lg">{symbol}</span>
                    ))}
                  </div>
                </div>
              )}

              {entry.action === 'mismatch' && entry.cards && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-[var(--text-muted)]">✗ 配對失敗：</span>
                  <div className="flex gap-1">
                    {entry.cards.map((symbol, idx) => (
                      <span key={idx} className="text-lg opacity-50">{symbol}</span>
                    ))}
                  </div>
                </div>
              )}

              {entry.action === 'timeout' && (
                <div className="text-xs text-[#ffd93d]">
                  ⏰ 時間到
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const GameHistory = memo(GameHistoryComponent);
