/**
 * CollectedCards Component - Shows collected card pairs for each player
 * @version 1.0.0
 */

import { memo, useMemo } from 'react';
import type { Player } from '../types';
import { PLAYER_COLORS } from '../utils/constants';

interface CollectedCardsProps {
  player: Player;
  playerNumber: 1 | 2;
}

/**
 * CollectedCards component
 * Displays mini cards that the player has collected
 */
function CollectedCardsComponent({ player, playerNumber }: CollectedCardsProps) {
  const playerColor = playerNumber === 1 ? PLAYER_COLORS.PLAYER_1 : PLAYER_COLORS.PLAYER_2;
  const collectedCards = player.collectedCards || [];
  const isPlayer1 = playerNumber === 1;

  // Calculate stack positions for depth effect
  const stackedCards = useMemo(() => {
    return collectedCards.map((card, index) => ({
      ...card,
      zIndex: index,
      offset: index * 3, // 3px offset per card
    }));
  }, [collectedCards]);

  if (collectedCards.length === 0) {
    return (
      <div className={`collected-cards-empty flex items-center justify-center p-2 rounded-lg border-2 border-dashed ${isPlayer1 ? 'ml-auto' : 'mr-auto'}`}
        style={{
          borderColor: `${playerColor}30`,
          minWidth: '60px',
          minHeight: '40px',
        }}
      >
        <span className="text-xs opacity-30">No cards</span>
      </div>
    );
  }

  return (
    <div
      className={`collected-cards flex items-center gap-1 ${isPlayer1 ? 'ml-auto' : 'mr-auto'}`}
      style={{
        minWidth: '80px',
      }}
    >
      {/* Card Stack */}
      <div className="relative" style={{ width: '60px', height: '40px' }}>
        {stackedCards.map((card, index) => (
          <div
            key={`${card.pairId}-${index}`}
            className="absolute transition-all duration-300 ease-out"
            style={{
              width: '48px',
              height: '32px',
              left: isPlayer1 ? 'auto' : `${card.offset}px`,
              right: isPlayer1 ? `${card.offset}px` : 'auto',
              top: 0,
              zIndex: card.zIndex,
              transform: `rotate(${(Math.random() - 0.5) * 4}deg)`, // Slight random rotation
            }}
          >
            <div
              className="w-full h-full rounded flex items-center justify-center text-sm font-bold"
              style={{
                background: `linear-gradient(135deg, ${playerColor}40 0%, ${playerColor}20 100%)`,
                border: `1.5px solid ${playerColor}`,
                boxShadow: `0 2px 8px ${playerColor}30`,
              }}
            >
              {card.symbol}
            </div>
          </div>
        ))}
      </div>

      {/* Card Count Badge */}
      <div
        className="flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold"
        style={{
          background: `linear-gradient(135deg, ${playerColor}60 0%, ${playerColor}40 100%)`,
          border: `1px solid ${playerColor}`,
          minWidth: '24px',
        }}
      >
        ×{collectedCards.length}
      </div>
    </div>
  );
}

export const CollectedCards = memo(CollectedCardsComponent);
