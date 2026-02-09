/**
 * MatchEffect Component - Particle burst effect for matches
 * @version 1.0.0
 */

import { useRef, useEffect, memo } from 'react';
import gsap from 'gsap';
import { NEON_COLORS } from '../utils/constants';
import { randomInRange, randomColor } from '../utils/helpers';

interface MatchEffectProps {
  position: { x: number; y: number };
  isSuccess: boolean;
  onComplete?: () => void;
}

/**
 * MatchEffect component
 * Creates a particle burst animation at the specified position
 */
function MatchEffectComponent({
  position,
  isSuccess,
  onComplete,
}: MatchEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const particleCount = isSuccess ? 20 : 8;
    const colors = isSuccess
      ? [NEON_COLORS.GREEN, NEON_COLORS.CYAN, NEON_COLORS.YELLOW]
      : [NEON_COLORS.ORANGE, '#ff3333'];

    // Create particles
    const particles: HTMLDivElement[] = [];
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle absolute rounded-full';
      particle.style.width = `${randomInRange(4, 12)}px`;
      particle.style.height = particle.style.width;
      particle.style.backgroundColor = randomColor(colors);
      particle.style.left = '50%';
      particle.style.top = '50%';
      particle.style.transform = 'translate(-50%, -50%)';
      particle.style.boxShadow = `0 0 10px ${particle.style.backgroundColor}`;
      containerRef.current.appendChild(particle);
      particles.push(particle);
    }
    particlesRef.current = particles;

    // Animate particles
    const tl = gsap.timeline({
      onComplete: () => {
        // Clean up particles
        particles.forEach((p) => p.remove());
        onComplete?.();
      },
    });

    particles.forEach((particle, index) => {
      const angle = (360 / particleCount) * index;
      const distance = randomInRange(50, 120);
      const x = Math.cos((angle * Math.PI) / 180) * distance;
      const y = Math.sin((angle * Math.PI) / 180) * distance;

      tl.to(
        particle,
        {
          x,
          y,
          opacity: 0,
          scale: 0,
          duration: isSuccess ? 1 : 0.5,
          ease: 'power2.out',
        },
        0
      );
    });

    // Add center flash for success
    if (isSuccess) {
      const flash = document.createElement('div');
      flash.className = 'absolute rounded-full';
      flash.style.width = '20px';
      flash.style.height = '20px';
      flash.style.left = '50%';
      flash.style.top = '50%';
      flash.style.transform = 'translate(-50%, -50%)';
      flash.style.backgroundColor = NEON_COLORS.GREEN;
      flash.style.boxShadow = `0 0 30px ${NEON_COLORS.GREEN}`;
      containerRef.current.appendChild(flash);

      tl.fromTo(
        flash,
        { scale: 1, opacity: 1 },
        {
          scale: 4,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out',
          onComplete: () => flash.remove(),
        },
        0
      );
    }

    return () => {
      tl.kill();
      particles.forEach((p) => p.remove());
    };
  }, [isSuccess, onComplete]);

  return (
    <div
      ref={containerRef}
      className="match-effect fixed pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
      }}
    />
  );
}

export const MatchEffect = memo(MatchEffectComponent);
