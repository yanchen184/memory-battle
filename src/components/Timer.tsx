/**
 * Timer Component - Turn timer with visual feedback
 * @version 1.0.0
 */

import { useRef, useEffect, memo } from 'react';
import gsap from 'gsap';
import type { TimerProps } from '../types';

/**
 * Timer component
 * Displays remaining time with progress ring and warning state
 */
function TimerComponent({ timeLeft, maxTime, isWarning }: TimerProps) {
  const ringRef = useRef<SVGCircleElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / maxTime;
  const strokeDashoffset = circumference * (1 - progress);

  // Warning pulse animation
  useEffect(() => {
    if (!containerRef.current) return;

    if (isWarning) {
      gsap.to(containerRef.current, {
        scale: 1.05,
        duration: 0.3,
        ease: 'power2.inOut',
        repeat: -1,
        yoyo: true,
      });
    } else {
      gsap.killTweensOf(containerRef.current);
      gsap.to(containerRef.current, {
        scale: 1,
        duration: 0.2,
      });
    }

    return () => {
      gsap.killTweensOf(containerRef.current);
    };
  }, [isWarning]);

  // Text color flash on low time
  useEffect(() => {
    if (!textRef.current) return;

    if (isWarning && timeLeft <= 5) {
      gsap.to(textRef.current, {
        color: timeLeft % 2 === 0 ? '#ff0000' : '#ff6600',
        duration: 0.3,
      });
    }
  }, [timeLeft, isWarning]);

  // Get color based on time
  const getColor = () => {
    if (timeLeft <= 5) return '#ff0000';
    if (isWarning) return '#ff6600';
    if (progress > 0.5) return '#00f5ff';
    return '#ffff00';
  };

  const color = getColor();

  return (
    <div
      ref={containerRef}
      className="timer relative flex items-center justify-center"
      style={{
        filter: isWarning ? `drop-shadow(0 0 10px ${color})` : 'none',
      }}
    >
      {/* SVG Ring */}
      <svg
        width="100"
        height="100"
        className="transform -rotate-90"
        viewBox="0 0 100 100"
      >
        {/* Background ring */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="6"
        />

        {/* Progress ring */}
        <circle
          ref={ringRef}
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease',
            filter: `drop-shadow(0 0 5px ${color})`,
          }}
        />
      </svg>

      {/* Time display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          ref={textRef}
          className="text-2xl font-bold"
          style={{
            color,
            textShadow: `0 0 10px ${color}`,
          }}
        >
          {timeLeft}
        </span>
        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
          seconds
        </span>
      </div>
    </div>
  );
}

export const Timer = memo(TimerComponent);
