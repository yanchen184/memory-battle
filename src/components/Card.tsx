/**
 * Card Component - Pixel Style Flip Card
 * @version 3.0.0 - Pixel Cute Adventure Edition
 */

import { useRef, useEffect, memo, useCallback } from 'react';
import gsap from 'gsap';
import type { CardProps } from '../types';
import { PLAYER_COLORS } from '../utils/constants';
import { soundManager } from '../utils/sound';

/**
 * Simplified pixel-style card with flip animation
 */
function CardComponent({
  card,
  onClick,
  disabled,
  showMatchEffect = false,
  showFailEffect = false,
}: CardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  // Handle flip animation with GSAP
  useEffect(() => {
    if (!innerRef.current) return;

    const rotation = card.isFlipped || card.isMatched ? 180 : 0;

    // Play flip sound when flipping
    if (card.isFlipped && !card.isMatched) {
      soundManager.playFlip();
    }

    gsap.to(innerRef.current, {
      rotateY: rotation,
      duration: 0.4,
      ease: 'steps(4)',
    });
  }, [card.isFlipped, card.isMatched]);

  // Handle match success effect
  useEffect(() => {
    if (!showMatchEffect || !cardRef.current) return;

    // Play match sound
    soundManager.playMatch();

    const tl = gsap.timeline();

    // Pixel bounce
    tl.to(cardRef.current, {
      y: -8,
      duration: 0.1,
      ease: 'steps(2)',
    })
      .to(cardRef.current, {
        y: 0,
        duration: 0.1,
        ease: 'steps(2)',
      })
      .to(cardRef.current, {
        y: -4,
        duration: 0.1,
        ease: 'steps(2)',
      })
      .to(cardRef.current, {
        y: 0,
        duration: 0.1,
        ease: 'steps(2)',
      });

    return () => {
      tl.kill();
    };
  }, [showMatchEffect]);

  // Handle match fail effect
  useEffect(() => {
    if (!showFailEffect || !cardRef.current) return;

    // Play mismatch sound
    soundManager.playMismatch();

    const tl = gsap.timeline();

    // Pixel shake
    tl.to(cardRef.current, {
      x: -4,
      duration: 0.05,
      ease: 'steps(1)',
    })
      .to(cardRef.current, {
        x: 4,
        duration: 0.05,
        ease: 'steps(1)',
      })
      .to(cardRef.current, {
        x: -4,
        duration: 0.05,
        ease: 'steps(1)',
      })
      .to(cardRef.current, {
        x: 0,
        duration: 0.05,
        ease: 'steps(1)',
      });

    return () => {
      tl.kill();
    };
  }, [showFailEffect]);

  // Click handler
  const handleClick = useCallback(() => {
    if (disabled || card.isFlipped || card.isMatched) return;

    // Click feedback animation
    gsap.to(cardRef.current, {
      scale: 0.95,
      duration: 0.05,
      yoyo: true,
      repeat: 1,
      ease: 'steps(1)',
    });

    onClick(card.id);
  }, [disabled, card.isFlipped, card.isMatched, onClick, card.id]);

  const isRevealed = card.isFlipped || card.isMatched;
  
  // 根據配對者設定顏色
  const playerColor = card.matchedBy === 1 
    ? PLAYER_COLORS.PLAYER_1 
    : card.matchedBy === 2 
    ? PLAYER_COLORS.PLAYER_2 
    : null;

  return (
    <div
      ref={containerRef}
      data-card-id={card.id}
      className="card-container relative"
      onClick={handleClick}
      style={{
        width: 'var(--card-width)',
        height: 'var(--card-height)',
        perspective: '1000px',
        cursor: disabled || isRevealed ? 'default' : 'pointer',
      }}
    >
      {/* 3D Card wrapper */}
      <div
        ref={cardRef}
        className="card-3d-wrapper w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Card inner (handles Y-axis flip rotation) */}
        <div
          ref={innerRef}
          className="card-inner relative w-full h-full"
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Card Back (question mark side) */}
          <div
            className="card-face card-back absolute inset-0 flex items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              background: 'var(--bg-card)',
              border: '3px solid var(--border-color)',
              boxShadow: card.isMatched ? 'none' : 'var(--shadow-pixel)',
            }}
          >
            {/* Question mark */}
            <div
              className="text-4xl font-bold select-none"
              style={{
                color: 'var(--text-primary)',
              }}
            >
              ?
            </div>
          </div>

          {/* Card Front (symbol side) */}
          <div
            className="card-face card-front absolute inset-0 flex items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: playerColor || (card.isFlipped && !card.isMatched ? '#6bcf7f' : 'var(--bg-card)'),
              border: `3px solid ${playerColor || (card.isFlipped && !card.isMatched ? '#6bcf7f' : 'var(--border-color)')}`,
              boxShadow: card.isMatched ? 'var(--shadow-pixel)' : 'var(--shadow-pixel)',
            }}
          >
            {/* Symbol */}
            {isRevealed && card.symbol && (
              <div
                className="text-5xl select-none"
                style={{
                  filter: card.isMatched ? 'none' : 'grayscale(0%)',
                }}
              >
                {card.symbol}
              </div>
            )}
            {/* 🆕 載入狀態（翻開但還沒收到 symbol） */}
            {isRevealed && !card.symbol && (
              <div className="text-2xl text-[var(--text-muted)] animate-pulse">
                ...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const Card = memo(CardComponent);
