/**
 * ScoreBoard Component - Displays both players' scores
 * @version 1.0.0
 */

import { memo } from 'react';
import type { ScoreBoardProps } from '../types';
import { PLAYER_COLORS } from '../utils/constants';

/**
 * ScoreBoard component
 * Displays a visual comparison of both players' scores
 */
function ScoreBoardComponent({
  player1Score,
  player2Score,
  player1Name,
  player2Name,
}: ScoreBoardProps) {
  const totalScore = player1Score + player2Score || 1; // Prevent division by zero
  const player1Percentage = (player1Score / totalScore) * 100;
  const player2Percentage = (player2Score / totalScore) * 100;

  return (
    <div className="scoreboard glass-panel p-4 w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-3">
        <span className="text-xs text-[var(--text-muted)] uppercase tracking-widest">
          Score Battle
        </span>
      </div>

      {/* Score comparison bar */}
      <div className="score-bar relative h-8 rounded-full overflow-hidden bg-[var(--bg-secondary)]">
        {/* Player 1 bar */}
        <div
          className="absolute left-0 top-0 h-full transition-all duration-500 ease-out flex items-center justify-start pl-3"
          style={{
            width: `${player1Percentage}%`,
            minWidth: player1Score > 0 ? '20%' : '0%',
            background: `linear-gradient(90deg, ${PLAYER_COLORS.PLAYER_1} 0%, ${PLAYER_COLORS.PLAYER_1}80 100%)`,
            boxShadow: `0 0 20px ${PLAYER_COLORS.PLAYER_1}50`,
          }}
        >
          {player1Score > 0 && (
            <span className="text-sm font-bold text-black/80">{player1Score}</span>
          )}
        </div>

        {/* Player 2 bar */}
        <div
          className="absolute right-0 top-0 h-full transition-all duration-500 ease-out flex items-center justify-end pr-3"
          style={{
            width: `${player2Percentage}%`,
            minWidth: player2Score > 0 ? '20%' : '0%',
            background: `linear-gradient(90deg, ${PLAYER_COLORS.PLAYER_2}80 0%, ${PLAYER_COLORS.PLAYER_2} 100%)`,
            boxShadow: `0 0 20px ${PLAYER_COLORS.PLAYER_2}50`,
          }}
        >
          {player2Score > 0 && (
            <span className="text-sm font-bold text-black/80">{player2Score}</span>
          )}
        </div>

        {/* Center divider */}
        <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white/20 transform -translate-x-1/2" />
      </div>

      {/* Player names */}
      <div className="flex justify-between mt-2 px-2">
        <span
          className="text-xs font-medium"
          style={{ color: PLAYER_COLORS.PLAYER_1 }}
        >
          {player1Name}
        </span>
        <span
          className="text-xs font-medium"
          style={{ color: PLAYER_COLORS.PLAYER_2 }}
        >
          {player2Name}
        </span>
      </div>
    </div>
  );
}

export const ScoreBoard = memo(ScoreBoardComponent);
