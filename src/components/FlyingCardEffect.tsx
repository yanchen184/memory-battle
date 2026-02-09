/**
 * FlyingCardEffect Component - Animates matched cards flying to player collection
 * @version 1.0.0
 */

import { useRef, useEffect, memo } from 'react';
import gsap from 'gsap';
import { PLAYER_COLORS } from '../utils/constants';

interface FlyingCardEffectProps {
  cardSymbol: string;
  fromPosition: { x: number; y: number };
  toPlayerNumber: 1 | 2;
  onComplete?: () => void;
}

/**
 * FlyingCardEffect component
 * Creates a card that flies from the board to the player's collection area
 */
function FlyingCardEffectComponent({
  cardSymbol,
  fromPosition,
  toPlayerNumber,
  onComplete,
}: FlyingCardEffectProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const playerColor = toPlayerNumber === 1 ? PLAYER_COLORS.PLAYER_1 : PLAYER_COLORS.PLAYER_2;

  useEffect(() => {
    if (!cardRef.current) return;

    // Calculate target position (player info area)
    // Player 1 is on the left, Player 2 is on the right
    const targetX = toPlayerNumber === 1 ? '10vw' : '90vw';
    const targetY = '10vh';

    const tl = gsap.timeline({
      onComplete: () => {
        onComplete?.();
      },
    });

    // Initial card setup
    tl.set(cardRef.current, {
      left: fromPosition.x,
      top: fromPosition.y,
      scale: 1,
      opacity: 1,
    });

    // Fly animation
    tl.to(cardRef.current, {
      left: targetX,
      top: targetY,
      scale: 0.5,
      opacity: 0.8,
      duration: 0.8,
      ease: 'power2.inOut',
      rotation: (Math.random() - 0.5) * 20, // Random rotation while flying
    })
      // Fade out and shrink at destination
      .to(cardRef.current, {
        scale: 0.2,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
      });

    // Pulse glow effect
    tl.to(
      cardRef.current,
      {
        boxShadow: `0 0 40px ${playerColor}, 0 0 80px ${playerColor}80`,
        duration: 0.4,
        ease: 'power1.inOut',
        repeat: 1,
        yoyo: true,
      },
      0.2
    );

    return () => {
      tl.kill();
    };
  }, [fromPosition, toPlayerNumber, onComplete, playerColor]);

  return (
    <div
      ref={cardRef}
      className="flying-card fixed pointer-events-none rounded-lg flex items-center justify-center text-3xl font-bold z-[2000]"
      style={{
        width: '80px',
        height: '100px',
        background: `linear-gradient(135deg, ${playerColor}60 0%, ${playerColor}30 100%)`,
        border: `3px solid ${playerColor}`,
        boxShadow: `0 4px 20px ${playerColor}40`,
      }}
    >
      {cardSymbol}
    </div>
  );
}

export const FlyingCardEffect = memo(FlyingCardEffectComponent);
