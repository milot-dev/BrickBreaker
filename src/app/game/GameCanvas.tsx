"use client";

import { useEffect, useRef, useState } from "react";
import { Ball } from "./gameObjects/Ball";
import { Paddle } from "./gameObjects/Paddle";
import { Brick } from "./gameObjects/Brick";
import { SoundManager } from "./utils/SoundManager";
import { Particle } from "./utils/Particle";

interface GameCanvasProps {
  onGameEnd: (won: boolean, score: number) => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const BRICK_ROWS = 5;
const BRICK_COLS = 10;
const BRICK_WIDTH = 70;
const BRICK_HEIGHT = 25;
const BRICK_PADDING = 5;
const BRICK_OFFSET_TOP = 10;
const BRICK_OFFSET_LEFT = (CANVAS_WIDTH - (BRICK_COLS * BRICK_WIDTH + (BRICK_COLS - 1) * BRICK_PADDING)) / 2;

export default function GameCanvas({ onGameEnd }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const gameLoopRef = useRef<number>(0);
  const ballRef = useRef<Ball | null>(null);
  const paddleRef = useRef<Paddle | null>(null);
  const bricksRef = useRef<Brick[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const soundManagerRef = useRef<SoundManager | null>(null);
  const scoreRef = useRef(0);
  const bricksDestroyedRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const screenShakeRef = useRef({ x: 0, y: 0, intensity: 0 });

  // Initialize game objects
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize sound manager
    soundManagerRef.current = new SoundManager();

    // Initialize score ref and speed
    scoreRef.current = 0;
    bricksDestroyedRef.current = 0;
    particlesRef.current = [];
    screenShakeRef.current = { x: 0, y: 0, intensity: 0 };
    setScore(0);

    // Initialize paddle (faster speed)
    paddleRef.current = new Paddle(
      CANVAS_WIDTH / 2 - 50,
      CANVAS_HEIGHT - 30,
      100,
      15
    );
    paddleRef.current.speed = 10;

    // Initialize ball (faster initial speed)
    ballRef.current = new Ball(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50, 8, -6, -6);

    // Initialize bricks
    bricksRef.current = [];
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
      "#F7DC6F",
    ];

    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        const x = col * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
        const y = row * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
        const brick = new Brick(
          x,
          y,
          BRICK_WIDTH,
          BRICK_HEIGHT,
          colors[row % colors.length],
          row * BRICK_COLS + col
        );
        bricksRef.current.push(brick);
      }
    }

    // Keyboard event handlers
    const handleKeyDown = (e: KeyboardEvent) => {
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
        screenShakeRef.current.intensity *= 0.9;
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

      // Apply screen shake transform
      ctx.save();
      ctx.translate(screenShakeRef.current.x, screenShakeRef.current.y);

      // Clear canvas
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Update paddle position
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
      paddleRef.current.update(CANVAS_WIDTH);

      // Store previous ball position for collision detection
      const prevBallX = ballRef.current.x;
      const prevBallY = ballRef.current.y;

      // Update ball position
      ballRef.current.update();

      // Check wall collisions
      if (
        ballRef.current.x - ballRef.current.radius <= 0 ||
        ballRef.current.x + ballRef.current.radius >= CANVAS_WIDTH
      ) {
        ballRef.current.dx = -ballRef.current.dx;
        // Add particles on wall hit
        for (let i = 0; i < 3; i++) {
          particlesRef.current.push(
            new Particle(ballRef.current.x, ballRef.current.y, "#64C8FF")
          );
        }
        soundManagerRef.current?.playHit();
      }
      if (ballRef.current.y - ballRef.current.radius <= 0) {
        ballRef.current.dy = -ballRef.current.dy;
        // Add particles on wall hit
        for (let i = 0; i < 3; i++) {
          particlesRef.current.push(
            new Particle(ballRef.current.x, ballRef.current.y, "#64C8FF")
          );
        }
        soundManagerRef.current?.playHit();
      }

      // Check bottom boundary (game over)
      if (ballRef.current.y + ballRef.current.radius >= CANVAS_HEIGHT) {
        soundManagerRef.current?.playGameOver();
        onGameEnd(false, scoreRef.current);
        return;
      }

      // Check paddle collision
      if (
        ballRef.current.y + ballRef.current.radius >= paddleRef.current.y &&
        ballRef.current.x >= paddleRef.current.x &&
        ballRef.current.x <= paddleRef.current.x + paddleRef.current.width &&
        ballRef.current.dy > 0
      ) {
        // Calculate hit position on paddle (affects bounce angle)
        const hitPos =
          (ballRef.current.x - paddleRef.current.x) / paddleRef.current.width;
        const angle = (hitPos - 0.5) * Math.PI * 0.5; // -PI/4 to PI/4
        const speed = Math.sqrt(
          ballRef.current.dx ** 2 + ballRef.current.dy ** 2
        );
        ballRef.current.dx = Math.sin(angle) * speed;
        ballRef.current.dy = -Math.abs(Math.cos(angle) * speed);
        ballRef.current.y = paddleRef.current.y - ballRef.current.radius;

        // Add particles on paddle hit
        for (let i = 0; i < 5; i++) {
          particlesRef.current.push(
            new Particle(ballRef.current.x, ballRef.current.y, "#00D4FF")
          );
        }

        soundManagerRef.current?.playHit();
      }

      // Check brick collisions with improved detection
      bricksRef.current = bricksRef.current.filter((brick) => {
        if (!brick.visible) return false;

        const ball = ballRef.current!;

        // Improved collision detection: check if ball overlaps with brick
        // Also check previous position to catch fast-moving balls
        const ballLeft = ball.x - ball.radius;
        const ballRight = ball.x + ball.radius;
        const ballTop = ball.y - ball.radius;
        const ballBottom = ball.y + ball.radius;

        const prevBallLeft = prevBallX - ball.radius;
        const prevBallRight = prevBallX + ball.radius;
        const prevBallTop = prevBallY - ball.radius;
        const prevBallBottom = prevBallY + ball.radius;

        // Check if ball currently overlaps with brick
        const currentlyOverlapping =
          ballRight >= brick.x &&
          ballLeft <= brick.x + brick.width &&
          ballBottom >= brick.y &&
          ballTop <= brick.y + brick.height;

        // Check if ball passed through brick (for fast-moving balls)
        // This checks if the ball's path intersected the brick
        const brickLeft = brick.x;
        const brickRight = brick.x + brick.width;
        const brickTop = brick.y;
        const brickBottom = brick.y + brick.height;

        // Check if ball's movement path intersects brick
        // We check if the ball's bounding box (swept from previous to current position) overlaps with brick
        const sweptLeft = Math.min(prevBallLeft, ballLeft);
        const sweptRight = Math.max(prevBallRight, ballRight);
        const sweptTop = Math.min(prevBallTop, ballTop);
        const sweptBottom = Math.max(prevBallBottom, ballBottom);

        const sweptOverlaps =
          sweptRight >= brickLeft &&
          sweptLeft <= brickRight &&
          sweptBottom >= brickTop &&
          sweptTop <= brickBottom;

        // Only count as collision if ball is actually in contact with brick
        // (either currently overlapping or swept through it)
        if (currentlyOverlapping || sweptOverlaps) {
          // Calculate movement direction
          const ballPrevDx = ball.x - prevBallX;
          const ballPrevDy = ball.y - prevBallY;

          // Determine collision side based on which edge the ball crossed
          // Check which side of the brick the ball entered from
          let hitFromLeft = false;
          let hitFromRight = false;
          let hitFromTop = false;
          let hitFromBottom = false;

          if (prevBallRight <= brickLeft && ballRight > brickLeft) {
            hitFromLeft = true;
          }
          if (prevBallLeft >= brickRight && ballLeft < brickRight) {
            hitFromRight = true;
          }
          if (prevBallBottom <= brickTop && ballBottom > brickTop) {
            hitFromTop = true;
          }
          if (prevBallTop >= brickBottom && ballTop < brickBottom) {
            hitFromBottom = true;
          }

          // Determine bounce direction based on which side was hit
          // Priority: if hit from left/right, bounce horizontally; if top/bottom, bounce vertically
          if (hitFromLeft || hitFromRight) {
            ball.dx = -ball.dx;
            // Position ball outside brick horizontally
            if (hitFromLeft) {
              ball.x = brickLeft - ball.radius;
            } else {
              ball.x = brickRight + ball.radius;
            }
          } else if (hitFromTop || hitFromBottom) {
            ball.dy = -ball.dy;
            // Position ball outside brick vertically
            if (hitFromTop) {
              ball.y = brickTop - ball.radius;
            } else {
              ball.y = brickBottom + ball.radius;
            }
          } else {
            // Fallback: use movement direction
            if (Math.abs(ballPrevDx) > Math.abs(ballPrevDy)) {
              ball.dx = -ball.dx;
              if (ballPrevDx > 0) {
                ball.x = brickLeft - ball.radius;
              } else {
                ball.x = brickRight + ball.radius;
              }
            } else {
              ball.dy = -ball.dy;
              if (ballPrevDy > 0) {
                ball.y = brickTop - ball.radius;
              } else {
                ball.y = brickBottom + ball.radius;
              }
            }
          }

          // Create particles when brick is destroyed
          const brickCenterX = brick.x + brick.width / 2;
          const brickCenterY = brick.y + brick.height / 2;
          for (let i = 0; i < 8; i++) {
            particlesRef.current.push(
              new Particle(brickCenterX, brickCenterY, brick.color)
            );
          }

          // Add screen shake
          screenShakeRef.current.intensity = 3;

          // Increase speed when brick is destroyed (2% increase per brick)
          bricksDestroyedRef.current += 1;
          const speedIncrease = 1.02; // 2% increase
          ball.dx *= speedIncrease;
          ball.dy *= speedIncrease;

          setScore((prev) => {
            const newScore = prev + 10;
            scoreRef.current = newScore;
            return newScore;
          });
          soundManagerRef.current?.playBrickBreak();
          return false; // Remove brick
        }
        return true;
      });

      // Check win condition
      if (bricksRef.current.length === 0) {
        soundManagerRef.current?.playWin();
        onGameEnd(true, scoreRef.current);
        return;
      }

      // Draw paddle
      paddleRef.current.draw(ctx);

      // Draw ball
      ballRef.current.draw(ctx);

      // Draw bricks
      bricksRef.current.forEach((brick) => {
        if (brick.visible) {
          brick.draw(ctx);
        }
      });

      // Draw particles
      particlesRef.current.forEach((particle) => {
        particle.draw(ctx);
      });

      // Restore transform (remove screen shake)
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
  }, [onGameEnd]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="mb-4">
        <div className="text-2xl font-bold text-white drop-shadow-lg">
          Score: <span className="text-yellow-300 animate-pulse">{score}</span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-cyan-400 rounded-lg shadow-2xl shadow-cyan-500/50 bg-gradient-to-b from-slate-900 to-slate-800"
      />
      <div className="mt-4 text-white/70 text-sm">
        Use ← → arrow keys or A/D to move the paddle
      </div>
    </div>
  );
}
