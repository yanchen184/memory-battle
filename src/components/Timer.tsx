/**
 * Timer Component - Pixel Style Turn Timer
 * @version 2.0.0 - Pixel Cute Adventure Edition
 */

import { useRef, useEffect, memo } from 'react';
import gsap from 'gsap';
import type { TimerProps } from '../types';

/**
 * Pixel-style timer with progress bar
 */
function TimerComponent({ timeLeft, maxTime, isWarning }: TimerProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const progress = timeLeft / maxTime;

  // Warning flash animation
  useEffect(() => {
    if (!containerRef.current) return;

    if (isWarning) {
      gsap.to(containerRef.current, {
        opacity: 0.7,
        duration: 0.2,
        ease: 'steps(2)',
        repeat: -1,
        yoyo: true,
      });
    } else {
      gsap.killTweensOf(containerRef.current);
      gsap.to(containerRef.current, {
        opacity: 1,
        duration: 0.1,
      });
    }

    return () => {
      gsap.killTweensOf(containerRef.current);
    };
  }, [isWarning]);

  // Get color based on time
  const getColor = () => {
    if (timeLeft <= 5) return '#ff6b6b';
    if (isWarning) return '#ffd93d';
    return '#6bcf7f';
  };

  const color = getColor();

  return (
    <div
      ref={containerRef}
      className="timer flex flex-col items-center gap-2 p-4"
      style={{
        background: 'var(--bg-card)',
        border: '3px solid var(--border-color)',
        boxShadow: 'var(--shadow-pixel)',
        width: '120px',
      }}
    >
      {/* Time display */}
      <div className="flex items-baseline gap-1">
        <span
          ref={textRef}
          className="text-3xl font-bold"
          style={{ color }}
        >
          {timeLeft}
        </span>
        <span className="text-xs opacity-70 uppercase">秒</span>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-3"
        style={{
          background: 'var(--bg-secondary)',
          border: '2px solid var(--border-color)',
        }}
      >
        <div
          ref={barRef}
          className="h-full transition-all"
          style={{
            width: `${progress * 100}%`,
            background: color,
            transitionDuration: '0.3s',
            transitionTimingFunction: 'steps(4)',
          }}
        />
      </div>

      {/* Warning text */}
      {isWarning && (
        <span className="text-xs font-bold uppercase" style={{ color }}>
          {timeLeft <= 5 ? '⚠️ 快！' : '注意時間'}
        </span>
      )}
    </div>
  );
}

export const Timer = memo(TimerComponent);
