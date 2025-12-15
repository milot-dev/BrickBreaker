"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Ball } from "./gameObjects/Ball";
import { Paddle } from "./gameObjects/Paddle";
import { Brick } from "./gameObjects/Brick";
import { PowerUp, PowerUpType } from "./gameObjects/PowerUp";
import { SoundManager } from "./utils/SoundManager";
import { Particle } from "./utils/Particle";
import {
  GameConfig,
  getBrickOffsetLeft,
  getBrickRowsForLevel,
  getBallSpeedMultiplierForLevel,
} from "./config/gameConfig";

interface GameCanvasProps {
  onLevelComplete?: (level: number, score: number) => void;
}

export default function GameCanvas({ onLevelComplete }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [showLevelTransition, setShowLevelTransition] = useState(false);
  const [activePowerUps, setActivePowerUps] = useState({
    paddleSize: 0,
    slowBall: 0,
  });
  const gameLoopRef = useRef<number>(0);
  const ballRef = useRef<Ball | null>(null);
  const paddleRef = useRef<Paddle | null>(null);
  const bricksRef = useRef<Brick[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const soundManagerRef = useRef<SoundManager | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const screenShakeRef = useRef({ x: 0, y: 0, intensity: 0 });
  const slowBallPowerUpExpiresAtRef = useRef<number>(0);

  /**
   * Initialize game objects for a level
   */
  const initializeLevel = useCallback((levelNumber: number) => {
    // Initialize paddle
    const paddleX = GameConfig.CANVAS_WIDTH / 2 - GameConfig.PADDLE_WIDTH / 2;
    const paddleY = GameConfig.CANVAS_HEIGHT - GameConfig.PADDLE_Y_OFFSET;
    paddleRef.current = new Paddle(
      paddleX,
      paddleY,
      GameConfig.PADDLE_WIDTH,
      GameConfig.PADDLE_HEIGHT
    );
    paddleRef.current.speed = GameConfig.PADDLE_SPEED;

    // Initialize ball with level-appropriate speed
    const speedMultiplier = getBallSpeedMultiplierForLevel(levelNumber);
    const ballSpeed = GameConfig.BALL_BASE_SPEED * speedMultiplier;
    const ballX = GameConfig.CANVAS_WIDTH / 2 + GameConfig.BALL_START_X_OFFSET;
    const ballY = GameConfig.CANVAS_HEIGHT + GameConfig.BALL_START_Y_OFFSET;
    ballRef.current = new Ball(
      ballX,
      ballY,
      GameConfig.BALL_RADIUS,
      -ballSpeed,
      -ballSpeed
    );

    // Initialize bricks
    bricksRef.current = [];
    const brickRows = getBrickRowsForLevel(levelNumber);
    const brickOffsetLeft = getBrickOffsetLeft();

    // Generate level layout (simple patterns)
    const layoutPattern = getLevelLayoutPattern(
      levelNumber,
      brickRows,
      GameConfig.BRICK_COLS
    );

    for (let row = 0; row < brickRows; row++) {
      for (let col = 0; col < GameConfig.BRICK_COLS; col++) {
        // Check if this position should have a brick based on layout pattern
        if (layoutPattern[row][col]) {
          const x =
            col * (GameConfig.BRICK_WIDTH + GameConfig.BRICK_PADDING) +
            brickOffsetLeft;
          const y =
            row * (GameConfig.BRICK_HEIGHT + GameConfig.BRICK_PADDING) +
            GameConfig.BRICK_OFFSET_TOP;
          const color =
            GameConfig.BRICK_COLORS[row % GameConfig.BRICK_COLORS.length];
          const brick = new Brick(
            x,
            y,
            GameConfig.BRICK_WIDTH,
            GameConfig.BRICK_HEIGHT,
            color,
            row * GameConfig.BRICK_COLS + col
          );
          bricksRef.current.push(brick);
        }
      }
    }

    // Clear power-ups and particles
    powerUpsRef.current = [];
    particlesRef.current = [];
    screenShakeRef.current = { x: 0, y: 0, intensity: 0 };
    slowBallPowerUpExpiresAtRef.current = 0;
  }, []);

  /**
   * Generate layout pattern for a level with progressive difficulty
   * Patterns get harder as levels increase
   */
  const getLevelLayoutPattern = (
    level: number,
    rows: number,
    cols: number
  ): boolean[][] => {
    const pattern: boolean[][] = [];

    // Determine pattern type based on level (one pattern per level)
    // 8 patterns total, cycles every 8 levels
    // Level 1 → Pattern 0, Level 2 → Pattern 1, ..., Level 8 → Pattern 7, then cycles back
    const patternType = (level - 1) % 8;

    for (let row = 0; row < rows; row++) {
      pattern[row] = [];
      for (let col = 0; col < cols; col++) {
        let hasBrick = false;

        switch (patternType) {
          case 0: // Full grid - all bricks
            hasBrick = true;
            break;

          case 1: // Checkerboard pattern
            hasBrick = (row + col) % 2 === 0;
            break;

          case 2: // Pyramid - fewer bricks in middle
            const centerCol = cols / 2;
            const distanceFromCenter = Math.abs(col - centerCol);
            const maxDistance = Math.floor(rows / 2) + 1;
            hasBrick = distanceFromCenter < maxDistance - row;
            break;

          case 3: // Hollow center - bricks only on edges
            const isEdge =
              row === 0 || row === rows - 1 || col === 0 || col === cols - 1;
            const centerRow = Math.floor(rows / 2);
            const centerCol2 = Math.floor(cols / 2);
            const isNearCenter =
              Math.abs(row - centerRow) <= 1 && Math.abs(col - centerCol2) <= 2;
            hasBrick = isEdge || !isNearCenter;
            break;

          case 4: // Side columns - bricks on left and right edges
            const edgeWidth = Math.max(2, Math.floor(cols / 4));
            hasBrick = col < edgeWidth || col >= cols - edgeWidth;
            break;

          case 5: // Diagonal stripes
            const stripeWidth = 2;
            const diagonalIndex = (row + col) % (stripeWidth * 2);
            hasBrick = diagonalIndex < stripeWidth;
            break;

          case 6: // Concentric rings - harder to clear center
            const centerRow2 = rows / 2;
            const centerCol3 = cols / 2;
            const distanceFromCenterRow = Math.abs(row - centerRow2);
            const distanceFromCenterCol = Math.abs(col - centerCol3);
            const ringDistance = Math.max(
              distanceFromCenterRow,
              distanceFromCenterCol
            );
            // Create rings - every other ring has bricks
            hasBrick = Math.floor(ringDistance) % 2 === 0;
            break;

          case 7: // Sparse random - challenging pattern
            // 60% chance per position, but ensure at least some bricks
            const randomValue = (row * cols + col + level * 17) % 100;
            hasBrick = randomValue < 60;
            // Ensure at least one brick per row
            if (col === cols - 1 && !pattern[row].some((b) => b)) {
              hasBrick = true;
            }
            break;
        }

        pattern[row][col] = hasBrick;
      }
    }
    return pattern;
  };

  /**
   * Reset current level (when ball falls)
   */
  const resetLevel = () => {
    soundManagerRef.current?.playGameOver();
    initializeLevel(level);
    if (GameConfig.RESET_SCORE_ON_LEVEL_RESET) {
      setScore(0);
    }
  };

  /**
   * Complete current level and advance to next
   */
  const completeLevel = () => {
    soundManagerRef.current?.playWin();
    setShowLevelTransition(true);
    setTimeout(() => {
      const nextLevel = level + 1;
      setLevel(nextLevel);
      initializeLevel(nextLevel);
      setShowLevelTransition(false);
      onLevelComplete?.(nextLevel - 1, score);
    }, GameConfig.LEVEL_TRANSITION_DELAY);
  };

  // Store initializeLevel function in a ref so it can be accessed
  const initializeLevelRef = useRef<((levelNumber: number) => void) | null>(
    null
  );

  // Store initializeLevel in ref for access from changeLevel
  useEffect(() => {
    initializeLevelRef.current = initializeLevel;
  }, [initializeLevel]);

  /**
   * Change level manually
   */
  const changeLevel = useCallback((newLevel: number) => {
    if (newLevel < 1) return; // Minimum level is 1
    setLevel(newLevel);
    // Initialize the level immediately
    if (initializeLevelRef.current) {
      initializeLevelRef.current(newLevel);
    }
    if (GameConfig.RESET_SCORE_ON_LEVEL_RESET) {
      setScore(0);
    }
  }, []);

  /**
   * Go to next level
   */
  const nextLevel = useCallback(() => {
    setLevel((prevLevel) => {
      const newLevel = prevLevel + 1;
      if (initializeLevelRef.current) {
        initializeLevelRef.current(newLevel);
      }
      return newLevel;
    });
  }, []);

  /**
   * Go to previous level
   */
  const previousLevel = useCallback(() => {
    setLevel((prevLevel) => {
      if (prevLevel > 1) {
        const newLevel = prevLevel - 1;
        if (initializeLevelRef.current) {
          initializeLevelRef.current(newLevel);
        }
        return newLevel;
      }
      return prevLevel;
    });
  }, []);

  /**
   * Check collision between ball and rectangle with improved corner handling
   */
  const checkBallRectCollision = (
    ballX: number,
    ballY: number,
    ballRadius: number,
    rectX: number,
    rectY: number,
    rectWidth: number,
    rectHeight: number
  ): {
    collides: boolean;
    side: "left" | "right" | "top" | "bottom" | "corner" | null;
  } => {
    const ballLeft = ballX - ballRadius;
    const ballRight = ballX + ballRadius;
    const ballTop = ballY - ballRadius;
    const ballBottom = ballY + ballRadius;

    if (
      ballRight >= rectX &&
      ballLeft <= rectX + rectWidth &&
      ballBottom >= rectY &&
      ballTop <= rectY + rectHeight
    ) {
      // Calculate overlaps
      const overlapLeft = ballRight - rectX;
      const overlapRight = rectX + rectWidth - ballLeft;
      const overlapTop = ballBottom - rectY;
      const overlapBottom = rectY + rectHeight - ballTop;

      // Check if this is a corner collision (ball is near a corner)
      const cornerThreshold = ballRadius * 0.7; // Threshold for corner detection
      const isNearLeftCorner = overlapLeft < cornerThreshold;
      const isNearRightCorner = overlapRight < cornerThreshold;
      const isNearTopCorner = overlapTop < cornerThreshold;
      const isNearBottomCorner = overlapBottom < cornerThreshold;

      // If ball is near two adjacent corners, treat as corner collision
      if (
        (isNearLeftCorner && isNearTopCorner) ||
        (isNearLeftCorner && isNearBottomCorner) ||
        (isNearRightCorner && isNearTopCorner) ||
        (isNearRightCorner && isNearBottomCorner)
      ) {
        return { collides: true, side: "corner" };
      }

      // Determine which side was hit based on minimum overlap
      const minOverlap = Math.min(
        overlapLeft,
        overlapRight,
        overlapTop,
        overlapBottom
      );

      if (minOverlap === overlapLeft) return { collides: true, side: "left" };
      if (minOverlap === overlapRight) return { collides: true, side: "right" };
      if (minOverlap === overlapTop) return { collides: true, side: "top" };
      return { collides: true, side: "bottom" };
    }

    return { collides: false, side: null };
  };

  /**
   * Destroy the bottommost row of bricks
   */
  const destroyBottomRow = () => {
    if (bricksRef.current.length === 0) return;

    // Find the bottommost row (highest y value)
    let bottommostY = 0;
    bricksRef.current.forEach((brick) => {
      if (brick.visible && brick.y > bottommostY) {
        bottommostY = brick.y;
      }
    });

    // Destroy all bricks in the bottommost row
    let destroyedCount = 0;
    bricksRef.current = bricksRef.current.filter((brick) => {
      if (brick.visible && Math.abs(brick.y - bottommostY) < 1) {
        // Create particles for destroyed brick
        const brickCenterX = brick.x + brick.width / 2;
        const brickCenterY = brick.y + brick.height / 2;
        for (let i = 0; i < GameConfig.PARTICLE_COUNT_BRICK_BREAK; i++) {
          particlesRef.current.push(
            new Particle(brickCenterX, brickCenterY, brick.color)
          );
        }
        destroyedCount++;
        return false; // Remove brick
      }
      return true;
    });

    // Update score
    if (destroyedCount > 0) {
      setScore((prev) => prev + destroyedCount * GameConfig.POINTS_PER_BRICK);
      soundManagerRef.current?.playBrickBreak();
      // Screen shake
      screenShakeRef.current.intensity = GameConfig.SCREEN_SHAKE_INTENSITY;
    }
  };

  /**
   * Handle brick collision
   */
  const handleBrickCollision = (brick: Brick) => {
    const ball = ballRef.current!;
    const collision = checkBallRectCollision(
      ball.x,
      ball.y,
      ball.radius,
      brick.x,
      brick.y,
      brick.width,
      brick.height
    );

    if (collision.collides && collision.side) {
      // Handle corner collisions specially to prevent getting stuck
      if (collision.side === "corner") {
        // For corner collisions, bounce both directions and push ball away
        ball.baseDx = -ball.baseDx;
        ball.baseDy = -ball.baseDy;
        ball.dx = ball.baseDx * ball.speedMultiplier;
        ball.dy = ball.baseDy * ball.speedMultiplier;
        // Push ball away from brick center to prevent overlap
        const brickCenterX = brick.x + brick.width / 2;
        const brickCenterY = brick.y + brick.height / 2;
        const dx = ball.x - brickCenterX;
        const dy = ball.y - brickCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
          const pushDistance =
            ball.radius + Math.max(brick.width, brick.height) / 2 + 1;
          ball.x = brickCenterX + (dx / distance) * pushDistance;
          ball.y = brickCenterY + (dy / distance) * pushDistance;
        }
      } else if (collision.side === "left" || collision.side === "right") {
        // Horizontal collision
        ball.baseDx = -ball.baseDx;
        ball.dx = ball.baseDx * ball.speedMultiplier;
        if (collision.side === "left") {
          ball.x = brick.x - ball.radius - 0.5; // Small offset to prevent overlap
        } else {
          ball.x = brick.x + brick.width + ball.radius + 0.5;
        }
      } else {
        // Vertical collision
        ball.baseDy = -ball.baseDy;
        ball.dy = ball.baseDy * ball.speedMultiplier;
        if (collision.side === "top") {
          ball.y = brick.y - ball.radius - 0.5; // Small offset to prevent overlap
        } else {
          ball.y = brick.y + brick.height + ball.radius + 0.5;
        }
      }

      // Create particles
      const brickCenterX = brick.x + brick.width / 2;
      const brickCenterY = brick.y + brick.height / 2;
      for (let i = 0; i < GameConfig.PARTICLE_COUNT_BRICK_BREAK; i++) {
        particlesRef.current.push(
          new Particle(brickCenterX, brickCenterY, brick.color)
        );
      }

      // Screen shake
      screenShakeRef.current.intensity = GameConfig.SCREEN_SHAKE_INTENSITY;

      // Update score
      setScore((prev) => prev + GameConfig.POINTS_PER_BRICK);

      // Randomly spawn power-up
      if (Math.random() < GameConfig.POWERUP_SPAWN_RATE) {
        const rand = Math.random();
        let powerUpType: PowerUpType;
        if (rand < 0.33) {
          powerUpType = "paddleSize";
        } else if (rand < 0.66) {
          powerUpType = "slowBall";
        } else {
          powerUpType = "destroyRow";
        }
        powerUpsRef.current.push(
          new PowerUp(
            brickCenterX - GameConfig.POWERUP_SIZE / 2,
            brickCenterY,
            powerUpType
          )
        );
      }

      soundManagerRef.current?.playBrickBreak();
      return true; // Brick was hit
    }
    return false;
  };

  // Initialize game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    soundManagerRef.current = new SoundManager();
    initializeLevel(level);

    // Keyboard event handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      // Level navigation shortcuts
      if (e.key >= "1" && e.key <= "9") {
        const levelNumber = parseInt(e.key);
        if (levelNumber !== level) {
          changeLevel(levelNumber);
        }
        return; // Don't process as movement key
      }

      // Next/Previous level shortcuts
      if (e.key === "+" || e.key === "=") {
        nextLevel();
        return;
      }
      if (e.key === "-" || e.key === "_") {
        previousLevel();
        return;
      }

      keysRef.current[e.key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Game loop
    const gameLoop = () => {
      if (!ctx || !ballRef.current || !paddleRef.current) return;

      // Update screen shake
      if (screenShakeRef.current.intensity > 0) {
        screenShakeRef.current.x =
          (Math.random() - 0.5) * screenShakeRef.current.intensity;
        screenShakeRef.current.y =
          (Math.random() - 0.5) * screenShakeRef.current.intensity;
        screenShakeRef.current.intensity *= GameConfig.SCREEN_SHAKE_DECAY;
        if (screenShakeRef.current.intensity < 0.1) {
          screenShakeRef.current.intensity = 0;
          screenShakeRef.current.x = 0;
          screenShakeRef.current.y = 0;
        }
      }

      // Update particles
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.update();
        return !particle.isDead();
      });

      // Update power-ups
      powerUpsRef.current = powerUpsRef.current.filter((powerUp) => {
        powerUp.update();
        if (powerUp.isOffScreen(GameConfig.CANVAS_HEIGHT)) {
          return false;
        }
        // Check collision with paddle
        if (
          powerUp.collidesWithPaddle(
            paddleRef.current!.x,
            paddleRef.current!.y,
            paddleRef.current!.width,
            paddleRef.current!.height
          )
        ) {
          // Activate power-up
          if (powerUp.type === "paddleSize") {
            paddleRef.current!.activateSizePowerUp(
              GameConfig.PADDLE_SIZE_POWERUP_DURATION,
              GameConfig.PADDLE_SIZE_POWERUP_MULTIPLIER
            );
          } else if (powerUp.type === "slowBall") {
            ballRef.current!.setSpeedMultiplier(
              GameConfig.SLOW_BALL_SPEED_MULTIPLIER
            );
            slowBallPowerUpExpiresAtRef.current =
              Date.now() + GameConfig.SLOW_BALL_POWERUP_DURATION;
          } else if (powerUp.type === "destroyRow") {
            // Instant effect - destroy bottommost row
            destroyBottomRow();
          }
          return false; // Remove power-up
        }
        return true;
      });

      // Update paddle power-ups
      paddleRef.current.updatePowerUps();

      // Update ball slow power-up
      if (
        slowBallPowerUpExpiresAtRef.current > 0 &&
        Date.now() >= slowBallPowerUpExpiresAtRef.current
      ) {
        ballRef.current.setSpeedMultiplier(1.0);
        slowBallPowerUpExpiresAtRef.current = 0;
      }

      // Update power-up display
      setActivePowerUps({
        paddleSize: paddleRef.current.sizePowerUpActive
          ? paddleRef.current.getSizePowerUpRemainingTime()
          : 0,
        slowBall:
          slowBallPowerUpExpiresAtRef.current > 0
            ? Math.max(0, slowBallPowerUpExpiresAtRef.current - Date.now())
            : 0,
      });

      // Apply screen shake transform
      ctx.save();
      ctx.translate(screenShakeRef.current.x, screenShakeRef.current.y);

      // Clear canvas
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);

      // Handle input
      if (
        keysRef.current["ArrowLeft"] ||
        keysRef.current["a"] ||
        keysRef.current["A"]
      ) {
        paddleRef.current.moveLeft();
      }
      if (
        keysRef.current["ArrowRight"] ||
        keysRef.current["d"] ||
        keysRef.current["D"]
      ) {
        paddleRef.current.moveRight();
      }
      paddleRef.current.update(GameConfig.CANVAS_WIDTH);

      // Update ball
      ballRef.current.update();

      // Check wall collisions with position correction to prevent sticking
      if (ballRef.current.x - ballRef.current.radius <= 0) {
        ballRef.current.baseDx = -ballRef.current.baseDx;
        ballRef.current.dx =
          ballRef.current.baseDx * ballRef.current.speedMultiplier;
        ballRef.current.x = ballRef.current.radius + 0.5; // Push away from wall
        for (let i = 0; i < GameConfig.PARTICLE_COUNT_WALL_HIT; i++) {
          particlesRef.current.push(
            new Particle(ballRef.current.x, ballRef.current.y, "#64C8FF")
          );
        }
        soundManagerRef.current?.playHit();
      } else if (
        ballRef.current.x + ballRef.current.radius >=
        GameConfig.CANVAS_WIDTH
      ) {
        ballRef.current.baseDx = -ballRef.current.baseDx;
        ballRef.current.dx =
          ballRef.current.baseDx * ballRef.current.speedMultiplier;
        ballRef.current.x =
          GameConfig.CANVAS_WIDTH - ballRef.current.radius - 0.5; // Push away from wall
        for (let i = 0; i < GameConfig.PARTICLE_COUNT_WALL_HIT; i++) {
          particlesRef.current.push(
            new Particle(ballRef.current.x, ballRef.current.y, "#64C8FF")
          );
        }
        soundManagerRef.current?.playHit();
      }
      if (ballRef.current.y - ballRef.current.radius <= 0) {
        ballRef.current.baseDy = -ballRef.current.baseDy;
        ballRef.current.dy =
          ballRef.current.baseDy * ballRef.current.speedMultiplier;
        ballRef.current.y = ballRef.current.radius + 0.5; // Push away from wall
        for (let i = 0; i < GameConfig.PARTICLE_COUNT_WALL_HIT; i++) {
          particlesRef.current.push(
            new Particle(ballRef.current.x, ballRef.current.y, "#64C8FF")
          );
        }
        soundManagerRef.current?.playHit();
      }

      // Check bottom boundary (level reset)
      if (
        ballRef.current.y + ballRef.current.radius >=
        GameConfig.CANVAS_HEIGHT
      ) {
        resetLevel();
        ctx.restore();
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // Check paddle collision
      const paddleCollision = checkBallRectCollision(
        ballRef.current.x,
        ballRef.current.y,
        ballRef.current.radius,
        paddleRef.current.x,
        paddleRef.current.y,
        paddleRef.current.width,
        paddleRef.current.height
      );

      if (paddleCollision.collides && ballRef.current.dy > 0) {
        // Calculate hit position on paddle (affects bounce angle)
        const hitPos =
          (ballRef.current.x - paddleRef.current.x) / paddleRef.current.width;
        const angle = (hitPos - 0.5) * Math.PI * 0.5; // -PI/4 to PI/4
        // Calculate base speed (without multiplier)
        const baseSpeed = Math.sqrt(
          ballRef.current.baseDx ** 2 + ballRef.current.baseDy ** 2
        );
        ballRef.current.baseDx = Math.sin(angle) * baseSpeed;
        ballRef.current.baseDy = -Math.abs(Math.cos(angle) * baseSpeed);
        // Apply speed multiplier
        ballRef.current.dx =
          ballRef.current.baseDx * ballRef.current.speedMultiplier;
        ballRef.current.dy =
          ballRef.current.baseDy * ballRef.current.speedMultiplier;
        ballRef.current.y = paddleRef.current.y - ballRef.current.radius;

        for (let i = 0; i < GameConfig.PARTICLE_COUNT_PADDLE_HIT; i++) {
          particlesRef.current.push(
            new Particle(ballRef.current.x, ballRef.current.y, "#00D4FF")
          );
        }
        soundManagerRef.current?.playHit();
      }

      // Check brick collisions
      bricksRef.current = bricksRef.current.filter((brick) => {
        if (!brick.visible) return false;
        return !handleBrickCollision(brick);
      });

      // Check level completion
      if (bricksRef.current.length === 0) {
        completeLevel();
        ctx.restore();
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // Render everything
      paddleRef.current.draw(ctx);
      ballRef.current.draw(ctx);
      bricksRef.current.forEach((brick) => {
        if (brick.visible) {
          brick.draw(ctx);
        }
      });
      powerUpsRef.current.forEach((powerUp) => powerUp.draw(ctx));
      particlesRef.current.forEach((particle) => particle.draw(ctx));

      ctx.restore();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [level, initializeLevel, changeLevel, nextLevel, previousLevel]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="mb-4 flex gap-6 items-center flex-wrap justify-center">
        <div className="text-2xl font-bold text-white drop-shadow-lg">
          Level: <span className="text-cyan-300">{level}</span>
        </div>
        <div className="text-2xl font-bold text-white drop-shadow-lg">
          Score: <span className="text-yellow-300">{score}</span>
        </div>
        {(activePowerUps.paddleSize > 0 || activePowerUps.slowBall > 0) && (
          <div className="flex gap-4 text-sm text-white">
            {activePowerUps.paddleSize > 0 && (
              <div className="bg-green-500/30 px-3 py-1 rounded">
                Paddle Size: {(activePowerUps.paddleSize / 1000).toFixed(1)}s
              </div>
            )}
            {activePowerUps.slowBall > 0 && (
              <div className="bg-yellow-500/30 px-3 py-1 rounded">
                Slow Ball: {(activePowerUps.slowBall / 1000).toFixed(1)}s
              </div>
            )}
          </div>
        )}
        {/* Level Navigation Controls */}
        <div className="flex gap-2 items-center">
          <button
            onClick={previousLevel}
            disabled={level <= 1}
            className="px-3 py-1 bg-cyan-500/30 hover:bg-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
            title="Previous Level (-)"
          >
            ←
          </button>
          <input
            type="number"
            min="1"
            value={level}
            onChange={(e) => {
              const newLevel = parseInt(e.target.value);
              if (!isNaN(newLevel) && newLevel >= 1) {
                changeLevel(newLevel);
              }
            }}
            className="w-16 px-2 py-1 bg-slate-800/50 text-white text-center rounded border border-cyan-400/50 focus:border-cyan-400 focus:outline-none"
            title="Enter level number (1-9)"
          />
          <button
            onClick={nextLevel}
            className="px-3 py-1 bg-cyan-500/30 hover:bg-cyan-500/50 text-white rounded transition-colors"
            title="Next Level (+)"
          >
            →
          </button>
        </div>
      </div>
      {showLevelTransition && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="text-6xl font-bold text-white drop-shadow-2xl">
            Level {level + 1}
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={GameConfig.CANVAS_WIDTH}
        height={GameConfig.CANVAS_HEIGHT}
        className="border-4 border-cyan-400 rounded-lg shadow-2xl shadow-cyan-500/50 bg-gradient-to-b from-slate-900 to-slate-800"
      />
      <div className="mt-4 text-white/70 text-sm text-center">
        <div>Use ← → arrow keys or A/D to move the paddle</div>
        <div className="mt-1 text-xs">
          Level Navigation: Press 1-9 to jump to level, +/- for next/previous
        </div>
      </div>
    </div>
  );
}