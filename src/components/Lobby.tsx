/**
 * Lobby Component - Game start screen and player setup
 * @version 1.0.0
 */

import { useState, useRef, useEffect, memo } from 'react';
import gsap from 'gsap';
import { LobbyProps, GridSize } from '../types';
import { NEON_COLORS, DEFAULT_PLAYER, GRID_CONFIGS } from '../utils/constants';

interface ExtendedLobbyProps extends Omit<LobbyProps, 'onStartGame'> {
  onStartGame: (player1Name: string, player2Name: string, gridSize: GridSize) => void;
}

/**
 * Lobby component
 * Handles player name input and game configuration
 */
function LobbyComponent({ onStartGame }: ExtendedLobbyProps) {
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [gridSize, setGridSize] = useState<GridSize>('4x4');
  const [isAnimating, setIsAnimating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Entrance animation
  useEffect(() => {
    if (!containerRef.current || !titleRef.current || !formRef.current) return;

    const tl = gsap.timeline();

    // Title animation
    tl.fromTo(
      titleRef.current,
      { y: -50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.7)' }
    );

    // Form animation
    tl.fromTo(
      formRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
      0.3
    );

    // Title glow loop
    gsap.to(titleRef.current, {
      textShadow: `0 0 30px ${NEON_COLORS.CYAN}, 0 0 60px ${NEON_COLORS.CYAN}40`,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });

    return () => {
      tl.kill();
      gsap.killTweensOf(titleRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnimating) return;

    setIsAnimating(true);

    // Exit animation
    if (formRef.current) {
      await gsap.to(formRef.current, {
        y: -30,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
      });
    }

    onStartGame(
      player1Name || DEFAULT_PLAYER.NAMES[0],
      player2Name || DEFAULT_PLAYER.NAMES[1],
      gridSize
    );
  };

  const gridOptions: { size: GridSize; label: string; pairs: number }[] = [
    { size: '4x4', label: '4x4', pairs: GRID_CONFIGS['4x4'].totalPairs },
    { size: '4x6', label: '4x6', pairs: GRID_CONFIGS['4x6'].totalPairs },
    { size: '6x6', label: '6x6', pairs: GRID_CONFIGS['6x6'].totalPairs },
  ];

  return (
    <div
      ref={containerRef}
      className="lobby min-h-screen flex flex-col items-center justify-center px-4 py-8"
    >
      {/* Title */}
      <h1
        ref={titleRef}
        className="text-4xl md:text-6xl font-bold text-center mb-4"
        style={{ color: NEON_COLORS.CYAN }}
      >
        Memory Battle
      </h1>

      <p className="text-[var(--text-secondary)] text-center mb-8 max-w-md">
        Challenge your memory in this 2-player card matching game.
        Match pairs to score points and claim victory!
      </p>

      {/* Form */}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="glass-panel p-6 md:p-8 w-full max-w-md"
      >
        {/* Player 1 Input */}
        <div className="mb-6">
          <label
            htmlFor="player1"
            className="block text-sm font-medium mb-2"
            style={{ color: NEON_COLORS.CYAN }}
          >
            Player 1
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl">
              {DEFAULT_PLAYER.AVATARS[0]}
            </span>
            <input
              type="text"
              id="player1"
              value={player1Name}
              onChange={(e) => setPlayer1Name(e.target.value)}
              placeholder="Enter name..."
              maxLength={12}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border-2 border-transparent focus:border-[var(--neon-cyan)] outline-none transition-colors"
              style={{
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {/* Player 2 Input */}
        <div className="mb-6">
          <label
            htmlFor="player2"
            className="block text-sm font-medium mb-2"
            style={{ color: NEON_COLORS.PINK }}
          >
            Player 2
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl">
              {DEFAULT_PLAYER.AVATARS[1]}
            </span>
            <input
              type="text"
              id="player2"
              value={player2Name}
              onChange={(e) => setPlayer2Name(e.target.value)}
              placeholder="Enter name..."
              maxLength={12}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border-2 border-transparent focus:border-[var(--neon-pink)] outline-none transition-colors"
              style={{
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {/* Grid Size Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">
            Board Size
          </label>
          <div className="grid grid-cols-3 gap-3">
            {gridOptions.map((option) => (
              <button
                key={option.size}
                type="button"
                onClick={() => setGridSize(option.size)}
                className={`p-3 rounded-xl text-center transition-all duration-300 ${
                  gridSize === option.size
                    ? 'scale-105'
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  background:
                    gridSize === option.size
                      ? `linear-gradient(135deg, ${NEON_COLORS.PURPLE}30 0%, ${NEON_COLORS.PINK}20 100%)`
                      : 'rgba(255, 255, 255, 0.05)',
                  border: `2px solid ${
                    gridSize === option.size
                      ? NEON_COLORS.PURPLE
                      : 'rgba(255, 255, 255, 0.1)'
                  }`,
                  boxShadow:
                    gridSize === option.size
                      ? `0 0 20px ${NEON_COLORS.PURPLE}30`
                      : 'none',
                }}
              >
                <span className="block text-lg font-bold">{option.label}</span>
                <span className="text-xs text-[var(--text-muted)]">
                  {option.pairs} pairs
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          type="submit"
          disabled={isAnimating}
          className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${NEON_COLORS.CYAN} 0%, ${NEON_COLORS.PURPLE} 100%)`,
            boxShadow: `0 4px 30px ${NEON_COLORS.CYAN}40`,
            color: '#000',
          }}
        >
          {isAnimating ? 'Starting...' : 'Start Game'}
        </button>
      </form>

      {/* Version */}
      <p className="mt-8 text-xs text-[var(--text-muted)]">
        Memory Battle v1.0.0
      </p>
    </div>
  );
}

export const Lobby = memo(LobbyComponent);
