/**
 * VictoryScreen Component - Game over celebration screen
 * @version 1.0.0
 */

import { useRef, useEffect, memo, useCallback } from 'react';
import gsap from 'gsap';
import { VictoryScreenProps } from '../types';
import { NEON_COLORS } from '../utils/constants';
import { randomInRange, randomColor } from '../utils/helpers';

/**
 * VictoryScreen component
 * Displays the winner with fireworks and celebration effects
 */
function VictoryScreenComponent({
  victoryData,
  onPlayAgain,
  onExit,
}: VictoryScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const winnerRef = useRef<HTMLDivElement>(null);
  const fireworksRef = useRef<HTMLDivElement>(null);

  const { winner, loser, finalScores, isDraw } = victoryData;

  // Create firework effect
  const createFirework = useCallback((x: number, y: number) => {
    if (!fireworksRef.current) return;

    const colors = [
      NEON_COLORS.CYAN,
      NEON_COLORS.PINK,
      NEON_COLORS.PURPLE,
      NEON_COLORS.GREEN,
      NEON_COLORS.YELLOW,
    ];

    const particleCount = 30;
    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute rounded-full';
      const size = randomInRange(3, 8);
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.backgroundColor = randomColor(colors);
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.boxShadow = `0 0 ${size * 2}px ${particle.style.backgroundColor}`;
      fireworksRef.current.appendChild(particle);
      particles.push(particle);
    }

    particles.forEach((particle, index) => {
      const angle = (360 / particleCount) * index + randomInRange(-10, 10);
      const distance = randomInRange(80, 200);
      const x = Math.cos((angle * Math.PI) / 180) * distance;
      const y = Math.sin((angle * Math.PI) / 180) * distance;

      gsap.to(particle, {
        x,
        y,
        opacity: 0,
        scale: 0,
        duration: randomInRange(0.8, 1.5),
        ease: 'power2.out',
        onComplete: () => particle.remove(),
      });
    });
  }, []);

  // Entrance animation
  useEffect(() => {
    if (!containerRef.current || !titleRef.current || !winnerRef.current) return;

    const tl = gsap.timeline();

    // Background fade in
    tl.fromTo(
      containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5 }
    );

    // Title animation
    tl.fromTo(
      titleRef.current,
      { y: -100, opacity: 0, scale: 0.5 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: 'elastic.out(1, 0.5)',
      },
      0.2
    );

    // Winner info animation
    tl.fromTo(
      winnerRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' },
      0.5
    );

    // Continuous title glow
    gsap.to(titleRef.current, {
      textShadow: isDraw
        ? `0 0 30px ${NEON_COLORS.YELLOW}, 0 0 60px ${NEON_COLORS.YELLOW}`
        : `0 0 30px ${NEON_COLORS.GREEN}, 0 0 60px ${NEON_COLORS.GREEN}`,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });

    return () => {
      tl.kill();
      gsap.killTweensOf(titleRef.current);
    };
  }, [isDraw]);

  // Fireworks loop
  useEffect(() => {
    if (!fireworksRef.current) return;

    const interval = setInterval(() => {
      const x = randomInRange(100, window.innerWidth - 100);
      const y = randomInRange(100, window.innerHeight / 2);
      createFirework(x, y);
    }, 800);

    // Initial burst
    setTimeout(() => {
      createFirework(window.innerWidth / 2, window.innerHeight / 3);
    }, 600);

    return () => clearInterval(interval);
  }, [createFirework]);

  return (
    <div
      ref={containerRef}
      className="victory-screen fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{
        background:
          'radial-gradient(ellipse at center, rgba(10, 10, 15, 0.95) 0%, rgba(10, 10, 15, 0.98) 100%)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Fireworks container */}
      <div ref={fireworksRef} className="fixed inset-0 pointer-events-none overflow-hidden" />

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        {/* Title */}
        <h1
          ref={titleRef}
          className="text-5xl md:text-7xl font-bold mb-8"
          style={{
            color: isDraw ? NEON_COLORS.YELLOW : NEON_COLORS.GREEN,
          }}
        >
          {isDraw ? 'DRAW!' : 'VICTORY!'}
        </h1>

        {/* Winner info */}
        <div
          ref={winnerRef}
          className="glass-panel p-8 max-w-md mx-auto"
        >
          {isDraw ? (
            <div className="text-center">
              <p className="text-xl text-[var(--text-secondary)] mb-4">
                Both players tied!
              </p>
              <div className="flex justify-center items-center gap-4 text-4xl">
                <span>{winner.avatar}</span>
                <span className="text-2xl text-[var(--text-muted)]">=</span>
                <span>{loser.avatar}</span>
              </div>
              <p className="mt-4 text-3xl font-bold neon-text-yellow">
                {finalScores[0]} - {finalScores[1]}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div
                className="text-6xl mb-4"
                style={{
                  filter: `drop-shadow(0 0 20px ${NEON_COLORS.GREEN})`,
                }}
              >
                {winner.avatar}
              </div>
              <p
                className="text-2xl font-bold mb-2"
                style={{ color: NEON_COLORS.GREEN }}
              >
                {winner.name}
              </p>
              <p className="text-lg text-[var(--text-secondary)]">wins the game!</p>

              <div className="mt-6 flex justify-center items-center gap-8">
                <div className="text-center">
                  <p className="text-sm text-[var(--text-muted)]">{winner.name}</p>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: NEON_COLORS.GREEN }}
                  >
                    {finalScores[0] > finalScores[1] ? finalScores[0] : finalScores[1]}
                  </p>
                </div>
                <span className="text-2xl text-[var(--text-muted)]">vs</span>
                <div className="text-center">
                  <p className="text-sm text-[var(--text-muted)]">{loser.name}</p>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: NEON_COLORS.PINK }}
                  >
                    {finalScores[0] > finalScores[1] ? finalScores[1] : finalScores[0]}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-center mt-8">
          <button
            onClick={onPlayAgain}
            className="px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${NEON_COLORS.CYAN} 0%, ${NEON_COLORS.BLUE} 100%)`,
              boxShadow: `0 4px 20px ${NEON_COLORS.CYAN}50`,
              color: '#000',
            }}
          >
            Play Again
          </button>
          <button
            onClick={onExit}
            className="px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              color: 'var(--text-primary)',
            }}
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}

export const VictoryScreen = memo(VictoryScreenComponent);
