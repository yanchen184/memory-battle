/**
 * ScoreBoard Component - Pixel Style Score Display
 * @version 2.0.0 - Pixel Cute Adventure Edition
 */

import { memo } from 'react';
import type { ScoreBoardProps } from '../types';
import { PLAYER_COLORS } from '../utils/constants';

/**
 * Pixel-style scoreboard
 */
function ScoreBoardComponent({
  player1Score,
  player2Score,
  player1Name,
  player2Name,
}: ScoreBoardProps) {
  const totalScore = player1Score + player2Score || 1;
  const player1Percentage = (player1Score / totalScore) * 100;
  const player2Percentage = (player2Score / totalScore) * 100;

  return (
    <div className="scoreboard glass-panel p-4 w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-3">
        <span className="text-xs font-bold uppercase tracking-widest">
          ⚔️ 分數對戰
        </span>
      </div>

      {/* Score comparison bar */}
      <div 
        className="score-bar relative h-8 overflow-hidden"
        style={{
          background: 'var(--bg-secondary)',
          border: '2px solid var(--border-color)',
        }}
      >
        {/* Player 1 bar */}
        <div
          className="absolute left-0 top-0 h-full flex items-center justify-start pl-3"
          style={{
            width: `${player1Percentage}%`,
            minWidth: player1Score > 0 ? '20%' : '0%',
            background: PLAYER_COLORS.PLAYER_1,
            transition: 'width 0.5s steps(8)',
          }}
        >
          {player1Score > 0 && (
            <span className="text-xs font-bold">{player1Score}</span>
          )}
        </div>

        {/* Player 2 bar */}
        <div
          className="absolute right-0 top-0 h-full flex items-center justify-end pr-3"
          style={{
            width: `${player2Percentage}%`,
            minWidth: player2Score > 0 ? '20%' : '0%',
            background: PLAYER_COLORS.PLAYER_2,
            transition: 'width 0.5s steps(8)',
          }}
        >
          {player2Score > 0 && (
            <span className="text-xs font-bold">{player2Score}</span>
          )}
        </div>

        {/* Center divider */}
        <div 
          className="absolute left-1/2 top-0 w-1 h-full transform -translate-x-1/2"
          style={{
            background: 'var(--border-color)',
          }}
        />
      </div>

      {/* Player names */}
      <div className="flex justify-between mt-2 px-2">
        <span className="text-xs font-bold pixel-text-cyan uppercase">
          {player1Name}
        </span>
        <span className="text-xs font-bold pixel-text-pink uppercase">
          {player2Name}
        </span>
      </div>
    </div>
  );
}

export const ScoreBoard = memo(ScoreBoardComponent);
