/**
 * GameBoard Component - Grid layout for cards
 * @version 1.0.0
 */

import { useRef, useEffect, memo } from 'react';
import gsap from 'gsap';
import { Card } from './Card';
import type { GameBoardProps } from '../types';

/**
 * GameBoard component
 * Displays cards in a responsive grid layout
 */
function GameBoardComponent({
  cards,
  onCardClick,
  disabled,
  gridCols,
}: GameBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Initial animation - cards fly in
  useEffect(() => {
    if (!boardRef.current || cardsRef.current.length === 0) return;

    // Reset cards position
    gsap.set(cardsRef.current.filter(Boolean), {
      opacity: 0,
      scale: 0.5,
      y: 50,
    });

    // Stagger animation
    gsap.to(cardsRef.current.filter(Boolean), {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.5,
      ease: 'back.out(1.7)',
      stagger: {
        each: 0.05,
        grid: 'auto',
        from: 'center',
      },
    });
  }, [cards.length]);

  // 🐛 Debug: Empty cards
  if (cards.length === 0) {
    console.warn('[GameBoard] No cards to display!', { cards });
    return (
      <div className="game-board glass-panel p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-[var(--text-muted)] mb-2">⚠️ 等待遊戲數據...</p>
          <p className="text-xs text-[var(--text-muted)]">
            如果持續顯示此訊息，請重新整理頁面
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={boardRef}
      className="game-board glass-panel p-4 md:p-6 lg:p-8"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridCols}, var(--card-width))`,
        gap: 'var(--card-gap)',
        justifyContent: 'center',
        alignContent: 'center',
      }}
    >
      {cards.map((card, index) => (
        <div
          key={card.id}
          ref={(el) => {
            cardsRef.current[index] = el;
          }}
          className="card-wrapper"
        >
          <Card
            card={card}
            onClick={onCardClick}
            disabled={disabled}
          />
        </div>
      ))}
    </div>
  );
}

export const GameBoard = memo(GameBoardComponent);
