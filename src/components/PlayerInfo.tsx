/**
 * PlayerInfo Component - Player avatar, name, and score display
 * @version 1.0.0
 */

import { useRef, useEffect, memo } from 'react';
import gsap from 'gsap';
import type { PlayerInfoProps } from '../types';
import { PLAYER_COLORS } from '../utils/constants';
import { CollectedCards } from './CollectedCards';

/**
 * PlayerInfo component
 * Displays player's avatar, name, score, and turn indicator
 */
function PlayerInfoComponent({
  player,
  isCurrentTurn,
  playerNumber,
}: PlayerInfoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const prevScoreRef = useRef(player.score);

  const playerColor = playerNumber === 1 ? PLAYER_COLORS.PLAYER_1 : PLAYER_COLORS.PLAYER_2;
  const isPlayer1 = playerNumber === 1;

  // Turn indicator animation
  useEffect(() => {
    if (!glowRef.current) return;

    if (isCurrentTurn) {
      gsap.to(glowRef.current, {
        opacity: 1,
        scale: 1.05,
        duration: 0.3,
        ease: 'power2.out',
      });

      // Pulsing glow effect
      gsap.to(glowRef.current, {
        boxShadow: `0 0 30px ${playerColor}, 0 0 60px ${playerColor}40`,
        duration: 1,
        ease: 'power1.inOut',
        repeat: -1,
        yoyo: true,
        delay: 0.3,
      });
    } else {
      gsap.killTweensOf(glowRef.current);
      gsap.to(glowRef.current, {
        opacity: 0.3,
        scale: 1,
        boxShadow: 'none',
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  }, [isCurrentTurn, playerColor]);

  // Score update animation
  useEffect(() => {
    if (!scoreRef.current || player.score === prevScoreRef.current) return;

    // Score increase animation
    if (player.score > prevScoreRef.current) {
      gsap.fromTo(
        scoreRef.current,
        { scale: 1 },
        {
          scale: 1.5,
          duration: 0.2,
          ease: 'back.out(2)',
          yoyo: true,
          repeat: 1,
        }
      );

      // Color flash
      gsap.fromTo(
        scoreRef.current,
        { color: '#00ff88' },
        {
          color: '#ffffff',
          duration: 0.5,
          delay: 0.4,
        }
      );
    }

    prevScoreRef.current = player.score;
  }, [player.score]);

  return (
    <div
      ref={containerRef}
      className="player-info relative flex flex-col gap-2 p-4"
      style={{
        background: isCurrentTurn ? playerColor : 'var(--bg-card)',
        border: '3px solid var(--border-color)',
        boxShadow: isCurrentTurn ? 'var(--shadow-pixel-hover)' : 'var(--shadow-pixel)',
      }}
    >
      {/* Glow indicator */}
      <div
        ref={glowRef}
        className="absolute inset-0 opacity-0 pointer-events-none"
        style={{
          border: '3px solid var(--border-color)',
        }}
      />

      {/* Top Row: Avatar + Info */}
      <div className={`flex items-center gap-4 ${isPlayer1 ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Avatar */}
        <div
          className="avatar relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-3xl flex-shrink-0"
          style={{
            background: 'var(--bg-card)',
            border: '3px solid var(--border-color)',
            boxShadow: 'inset 2px 2px 0px rgba(0,0,0,0.1)',
          }}
        >
          {player.avatar}

          {/* Online indicator */}
          {player.isConnected && (
            <div
              className="absolute -bottom-1 -right-1 w-4 h-4 border-2"
              style={{
                backgroundColor: '#6bcf7f',
                borderColor: 'var(--border-color)',
              }}
            />
          )}
        </div>

        {/* Player Info */}
        <div className={`flex flex-col flex-1 ${isPlayer1 ? 'items-start' : 'items-end'}`}>
          {/* Name */}
          <span
            className="text-xs md:text-sm font-bold uppercase"
            style={{
              color: isCurrentTurn ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            {player.name}
          </span>

          {/* Score */}
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-70">分數</span>
            <span
              ref={scoreRef}
              className="text-xl md:text-2xl font-bold"
            >
              {player.score}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Collected Cards */}
      <CollectedCards player={player} playerNumber={playerNumber} />

      {/* Turn indicator text */}
      {isCurrentTurn && (
        <div
          className={`absolute -bottom-6 ${isPlayer1 ? 'left-4' : 'right-4'} text-xs font-bold uppercase`}
          style={{ 
            color: 'var(--text-primary)',
            animation: 'pixel-flash 1s steps(2) infinite',
          }}
        >
          ▶ 你的回合
        </div>
      )}
    </div>
  );
}

export const PlayerInfo = memo(PlayerInfoComponent);
