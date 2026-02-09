/**
 * Card Component - 3D Flip Card with GSAP animations
 * Enhanced with mouse tracking tilt + radial glow effect
 * @version 2.1.0
 */

import { useRef, useEffect, memo, useCallback } from 'react';
import gsap from 'gsap';
import type { CardProps } from '../types';

// Tilt configuration
const TILT_CONFIG = {
  maxRotation: 15,      // Maximum rotation in degrees
  glowIntensity: 0.8,   // Glow effect intensity (0-1)
  perspective: 1000,    // 3D perspective depth
  transitionSpeed: 0.3, // Hover transition speed
  resetSpeed: 0.5,      // Reset animation speed
};

/**
 * Card component with 3D flip animation, mouse tracking tilt, and radial glow
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
  const glowRef = useRef<HTMLDivElement>(null);
  const mouseGlowRef = useRef<HTMLDivElement>(null);
  const symbolRef = useRef<HTMLSpanElement>(null);

  // Handle flip animation with GSAP
  useEffect(() => {
    if (!innerRef.current) return;

    const rotation = card.isFlipped || card.isMatched ? 180 : 0;

    gsap.to(innerRef.current, {
      rotateY: rotation,
      duration: 0.6,
      ease: 'back.out(1.5)',
    });
  }, [card.isFlipped, card.isMatched]);

  // Handle match success effect
  useEffect(() => {
    if (!showMatchEffect || !cardRef.current || !glowRef.current) return;

    const tl = gsap.timeline();

    // Glow pulse
    tl.to(glowRef.current, {
      opacity: 1,
      scale: 1.2,
      duration: 0.3,
      ease: 'power2.out',
    })
      .to(glowRef.current, {
        opacity: 0.6,
        scale: 1,
        duration: 0.5,
        ease: 'power2.inOut',
        repeat: 2,
        yoyo: true,
      })
      .to(glowRef.current, {
        opacity: 0,
        duration: 0.3,
      });

    // Card scale bounce
    gsap.to(cardRef.current, {
      scale: 1.1,
      duration: 0.2,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out',
    });

    // Symbol celebration animation
    if (symbolRef.current) {
      gsap.to(symbolRef.current, {
        scale: 1.3,
        duration: 0.2,
        yoyo: true,
        repeat: 3,
        ease: 'elastic.out(1, 0.3)',
      });
    }

    return () => {
      tl.kill();
    };
  }, [showMatchEffect]);

  // Handle match fail effect
  useEffect(() => {
    if (!showFailEffect || !cardRef.current) return;

    // Shake animation
    gsap.to(cardRef.current, {
      keyframes: [
        { x: -8, rotateZ: -2 },
        { x: 8, rotateZ: 2 },
        { x: -8, rotateZ: -2 },
        { x: 8, rotateZ: 2 },
        { x: 0, rotateZ: 0 },
      ],
      duration: 0.5,
      ease: 'power2.inOut',
    });

    // Red flash overlay
    const overlay = cardRef.current.querySelector('.fail-overlay');
    if (overlay) {
      gsap.fromTo(
        overlay,
        { opacity: 0 },
        { opacity: 0.6, duration: 0.1, yoyo: true, repeat: 5 }
      );
    }
  }, [showFailEffect]);

  // Mouse move handler for 3D tilt effect
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || card.isFlipped || card.isMatched) return;
      if (!containerRef.current || !cardRef.current || !mouseGlowRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();

      // Calculate mouse position relative to card center (-0.5 to 0.5)
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      // Calculate rotation (inverted for natural feel)
      // rotateX corresponds to Y axis, rotateY corresponds to X axis
      const rotateX = -y * TILT_CONFIG.maxRotation;
      const rotateY = x * TILT_CONFIG.maxRotation;

      // Apply 3D transform with GSAP for smooth animation
      gsap.to(cardRef.current, {
        rotateX,
        rotateY,
        scale: 1.05,
        duration: TILT_CONFIG.transitionSpeed,
        ease: 'power2.out',
      });

      // Update radial glow position to follow mouse
      const glowX = (x + 0.5) * 100;
      const glowY = (y + 0.5) * 100;

      gsap.to(mouseGlowRef.current, {
        opacity: TILT_CONFIG.glowIntensity,
        background: `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(0, 245, 255, 0.4) 0%, rgba(157, 0, 255, 0.2) 40%, transparent 70%)`,
        duration: 0.1,
      });

      // Parallax effect on symbol (subtle movement)
      if (symbolRef.current) {
        gsap.to(symbolRef.current, {
          x: x * 10,
          y: y * 10,
          duration: TILT_CONFIG.transitionSpeed,
          ease: 'power2.out',
        });
      }
    },
    [disabled, card.isFlipped, card.isMatched]
  );

  // Mouse leave handler - reset transforms
  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current || !mouseGlowRef.current) return;

    // Smooth reset animation
    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      duration: TILT_CONFIG.resetSpeed,
      ease: 'elastic.out(1, 0.5)',
    });

    // Fade out mouse glow
    gsap.to(mouseGlowRef.current, {
      opacity: 0,
      duration: 0.3,
    });

    // Reset symbol position
    if (symbolRef.current) {
      gsap.to(symbolRef.current, {
        x: 0,
        y: 0,
        duration: TILT_CONFIG.resetSpeed,
        ease: 'elastic.out(1, 0.5)',
      });
    }
  }, []);

  // Mouse enter handler
  const handleMouseEnter = useCallback(() => {
    if (disabled || card.isFlipped || card.isMatched) return;

    // Subtle lift effect
    gsap.to(cardRef.current, {
      boxShadow: '0 20px 40px rgba(157, 0, 255, 0.4), 0 0 30px rgba(0, 245, 255, 0.2)',
      duration: 0.3,
    });
  }, [disabled, card.isFlipped, card.isMatched]);

  // Click handler
  const handleClick = useCallback(() => {
    if (disabled || card.isFlipped || card.isMatched) return;

    // Click feedback animation
    gsap.to(cardRef.current, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut',
    });

    onClick(card.id);
  }, [disabled, card.isFlipped, card.isMatched, onClick, card.id]);

  const isRevealed = card.isFlipped || card.isMatched;

  return (
    <div
      ref={containerRef}
      data-card-id={card.id}
      className="card-container relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      style={{
        width: 'var(--card-width)',
        height: 'var(--card-height)',
        perspective: `${TILT_CONFIG.perspective}px`,
        cursor: disabled || isRevealed ? 'default' : 'pointer',
      }}
    >
      {/* Match success glow effect */}
      <div
        ref={glowRef}
        className="absolute inset-0 rounded-xl opacity-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0, 255, 136, 0.8) 0%, rgba(0, 255, 136, 0.4) 40%, transparent 70%)',
          filter: 'blur(15px)',
          transform: 'scale(1.5)',
          zIndex: 10,
        }}
      />

      {/* 3D Card wrapper */}
      <div
        ref={cardRef}
        className="card-3d-wrapper w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'box-shadow 0.3s ease',
          borderRadius: '12px',
        }}
      >
        {/* Mouse tracking glow overlay */}
        <div
          ref={mouseGlowRef}
          className="absolute inset-0 rounded-xl opacity-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(0, 245, 255, 0.4) 0%, transparent 70%)',
            zIndex: 5,
          }}
        />

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
            className="card-face card-back absolute inset-0 rounded-xl flex items-center justify-center overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
              border: '2px solid rgba(157, 0, 255, 0.6)',
              boxShadow: '0 4px 20px rgba(157, 0, 255, 0.3), inset 0 0 30px rgba(157, 0, 255, 0.1)',
            }}
          >
            {/* Animated background pattern */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: `
                  repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 8px,
                    rgba(157, 0, 255, 0.15) 8px,
                    rgba(157, 0, 255, 0.15) 16px
                  ),
                  repeating-linear-gradient(
                    -45deg,
                    transparent,
                    transparent 8px,
                    rgba(0, 245, 255, 0.1) 8px,
                    rgba(0, 245, 255, 0.1) 16px
                  )
                `,
              }}
            />

            {/* Inner glow border */}
            <div
              className="absolute inset-1 rounded-lg"
              style={{
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: 'inset 0 0 20px rgba(157, 0, 255, 0.2)',
              }}
            />

            {/* Question mark with glow */}
            <div
              className="relative z-10 text-5xl font-bold select-none"
              style={{
                color: 'rgba(255, 255, 255, 0.9)',
                textShadow: `
                  0 0 10px rgba(157, 0, 255, 0.8),
                  0 0 20px rgba(157, 0, 255, 0.6),
                  0 0 40px rgba(157, 0, 255, 0.4)
                `,
              }}
            >
              ?
            </div>

            {/* Corner decorations */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-purple-500/50 rounded-tl" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-purple-500/50 rounded-tr" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-purple-500/50 rounded-bl" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-purple-500/50 rounded-br" />

            {/* Fail overlay */}
            <div
              className="fail-overlay absolute inset-0 rounded-xl opacity-0 pointer-events-none"
              style={{
                backgroundColor: 'rgba(255, 50, 50, 0.6)',
                boxShadow: 'inset 0 0 30px rgba(255, 0, 0, 0.5)',
              }}
            />
          </div>

          {/* Card Front (symbol side) */}
          <div
            className="card-face card-front absolute inset-0 rounded-xl flex items-center justify-center overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: card.isMatched
                ? 'linear-gradient(135deg, #0a3d2e 0%, #1a5a4a 50%, #0d4a3a 100%)'
                : 'linear-gradient(135deg, #1e1e4f 0%, #2d2d6a 50%, #1a1a3f 100%)',
              border: card.isMatched
                ? '2px solid rgba(0, 255, 136, 0.8)'
                : '2px solid rgba(0, 245, 255, 0.6)',
              boxShadow: card.isMatched
                ? '0 4px 30px rgba(0, 255, 136, 0.5), inset 0 0 30px rgba(0, 255, 136, 0.15)'
                : '0 4px 20px rgba(0, 245, 255, 0.3), inset 0 0 20px rgba(0, 245, 255, 0.1)',
            }}
          >
            {/* Background shimmer effect for matched cards */}
            {card.isMatched && (
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background: 'linear-gradient(45deg, transparent 30%, rgba(0, 255, 136, 0.3) 50%, transparent 70%)',
                  animation: 'shimmer 2s infinite',
                }}
              />
            )}

            {/* Inner glow border */}
            <div
              className="absolute inset-1 rounded-lg"
              style={{
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: card.isMatched
                  ? 'inset 0 0 20px rgba(0, 255, 136, 0.2)'
                  : 'inset 0 0 15px rgba(0, 245, 255, 0.15)',
              }}
            />

            {/* Symbol with parallax effect */}
            <span
              ref={symbolRef}
              className="relative z-10 text-5xl select-none"
              style={{
                filter: card.isMatched
                  ? 'drop-shadow(0 0 15px rgba(0, 255, 136, 0.9)) drop-shadow(0 0 30px rgba(0, 255, 136, 0.5))'
                  : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                transform: 'translateZ(20px)',
              }}
            >
              {card.symbol}
            </span>

            {/* Corner decorations */}
            <div
              className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 rounded-tl"
              style={{ borderColor: card.isMatched ? 'rgba(0, 255, 136, 0.5)' : 'rgba(0, 245, 255, 0.5)' }}
            />
            <div
              className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 rounded-tr"
              style={{ borderColor: card.isMatched ? 'rgba(0, 255, 136, 0.5)' : 'rgba(0, 245, 255, 0.5)' }}
            />
            <div
              className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 rounded-bl"
              style={{ borderColor: card.isMatched ? 'rgba(0, 255, 136, 0.5)' : 'rgba(0, 245, 255, 0.5)' }}
            />
            <div
              className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 rounded-br"
              style={{ borderColor: card.isMatched ? 'rgba(0, 255, 136, 0.5)' : 'rgba(0, 245, 255, 0.5)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const Card = memo(CardComponent, (prevProps, nextProps) => {
  return (
    prevProps.card.id === nextProps.card.id &&
    prevProps.card.isFlipped === nextProps.card.isFlipped &&
    prevProps.card.isMatched === nextProps.card.isMatched &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.showMatchEffect === nextProps.showMatchEffect &&
    prevProps.showFailEffect === nextProps.showFailEffect
  );
});
