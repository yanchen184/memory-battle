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
  isAIMode?: boolean; // 是否為 AI 模式
}

/**
 * Lobby component
 * Handles player name input and game configuration
 */
function LobbyComponent({ onStartGame, isAIMode = false }: ExtendedLobbyProps) {
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

    // AI 模式：玩家 2 固定為 "AI 🤖"
    if (isAIMode) {
      onStartGame(
        player1Name || '玩家',
        'AI 🤖',
        gridSize
      );
    } else {
      onStartGame(
        player1Name || DEFAULT_PLAYER.NAMES[0],
        player2Name || DEFAULT_PLAYER.NAMES[1],
        gridSize
      );
    }
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
        className="text-2xl md:text-4xl font-bold text-center mb-4 pixel-text-pink"
      >
        {isAIMode ? '🤖 AI 對戰' : '🎮 記憶翻牌'}
      </h1>

      <p className="text-[var(--text-secondary)] text-center mb-8 max-w-md text-xs leading-relaxed">
        {isAIMode 
          ? 'AI 擁有完美記憶！' 
          : '配對相同卡片！'
        }
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
            className="block text-xs font-bold mb-2 pixel-text-cyan uppercase"
          >
            {isAIMode ? '你的名字' : '玩家 1'}
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
              placeholder="輸入名字..."
              maxLength={12}
              className="w-full pl-12 pr-4 py-3 bg-[var(--bg-card)] outline-none text-sm"
              style={{
                color: 'var(--text-primary)',
                border: '3px solid var(--border-color)',
                boxShadow: 'inset 2px 2px 0px rgba(0,0,0,0.1)',
              }}
            />
          </div>
        </div>

        {/* Player 2 Input - 只在非 AI 模式顯示 */}
        {!isAIMode && (
          <div className="mb-6">
            <label
              htmlFor="player2"
              className="block text-xs font-bold mb-2 pixel-text-pink uppercase"
            >
              玩家 2
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
                placeholder="輸入名字..."
                maxLength={12}
                className="w-full pl-12 pr-4 py-3 bg-[var(--bg-card)] outline-none text-sm"
                style={{
                  color: 'var(--text-primary)',
                  border: '3px solid var(--border-color)',
                  boxShadow: 'inset 2px 2px 0px rgba(0,0,0,0.1)',
                }}
              />
            </div>
          </div>
        )}

        {/* AI 對手提示 - 只在 AI 模式顯示 */}
        {isAIMode && (
          <div className="mb-6 p-4" style={{
            background: NEON_COLORS.GREEN,
            border: '3px solid var(--border-color)',
            boxShadow: 'var(--shadow-pixel)',
          }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  你的對手
                </p>
                <p className="text-xs opacity-70 mt-1">
                  完美記憶 AI
                </p>
              </div>
              <div className="text-4xl">🤖</div>
            </div>
          </div>
        )}

        {/* Grid Size Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">
            棋盤大小
          </label>
          <div className="grid grid-cols-3 gap-3">
            {gridOptions.map((option) => (
              <button
                key={option.size}
                type="button"
                onClick={() => setGridSize(option.size)}
                className={`pixel-button p-3 text-center text-xs ${
                  gridSize === option.size ? '' : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  background: gridSize === option.size ? NEON_COLORS.YELLOW : 'var(--bg-card)',
                  borderColor: gridSize === option.size ? NEON_COLORS.PURPLE : 'var(--border-color)',
                  color: gridSize === option.size ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                <span className="block text-base font-bold">{option.label}</span>
                <span className="text-xs opacity-70">{option.pairs} 對</span>
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          type="submit"
          disabled={isAnimating}
          className="pixel-button w-full py-4 font-bold text-base disabled:opacity-50"
          style={{
            background: NEON_COLORS.GREEN,
            color: 'var(--text-primary)',
          }}
        >
          {isAnimating ? '啟動中...' : '🎮 開始遊戲'}
        </button>
      </form>

      {/* Version */}
      <p className="mt-8 text-xs text-[var(--text-muted)]">
        記憶翻牌對戰 v2.0.0
      </p>
    </div>
  );
}

export const Lobby = memo(LobbyComponent);
