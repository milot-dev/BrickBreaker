import { GameConfig } from "../config/gameConfig";

export type PowerUpType = "paddleSize" | "slowBall" | "destroyRow";

export class PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  size: number;
  fallSpeed: number;

  constructor(x: number, y: number, type: PowerUpType) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = GameConfig.POWERUP_SIZE;
    this.fallSpeed = GameConfig.POWERUP_FALL_SPEED;
  }

  /**
   * Update power-up position (falls downward)
   */
  update() {
    this.y += this.fallSpeed;
  }

  /**
   * Check if power-up is below the canvas (should be removed)
   */
  isOffScreen(canvasHeight: number): boolean {
    return this.y > canvasHeight;
  }

  /**
   * Check collision with paddle
   */
  collidesWithPaddle(
    paddleX: number,
    paddleY: number,
    paddleWidth: number,
    paddleHeight: number
  ): boolean {
    return (
      this.x < paddleX + paddleWidth &&
      this.x + this.size > paddleX &&
      this.y < paddleY + paddleHeight &&
      this.y + this.size > paddleY
    );
  }

  /**
   * Draw power-up on canvas
   */
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Power-up background with glow
    let shadowColor = "#FFFF00";
    if (this.type === "paddleSize") {
      shadowColor = "#00FF00";
    } else if (this.type === "slowBall") {
      shadowColor = "#FFFF00";
    } else if (this.type === "destroyRow") {
      shadowColor = "#FF0000";
    }
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 10;

    // Draw icon based on type
    if (this.type === "paddleSize") {
      // Draw paddle icon (rectangle)
      ctx.fillStyle = "#00FF00";
      ctx.fillRect(
        this.x,
        this.y + this.size * 0.3,
        this.size,
        this.size * 0.4
      );
    } else if (this.type === "slowBall") {
      // Draw slow ball icon (circle)
      ctx.fillStyle = "#FFFF00";
      ctx.beginPath();
      ctx.arc(
        this.x + this.size / 2,
        this.y + this.size / 2,
        this.size * 0.4,
        0,
        Math.PI * 2
      );
      ctx.fill();
    } else if (this.type === "destroyRow") {
      // Draw destroy row icon (horizontal line with X)
      ctx.fillStyle = "#FF0000";
      // Draw horizontal line
      ctx.fillRect(
        this.x + this.size * 0.1,
        this.y + this.size * 0.45,
        this.size * 0.8,
        this.size * 0.1
      );
      // Draw X marks
      ctx.strokeStyle = "#FF0000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x + this.size * 0.2, this.y + this.size * 0.2);
      ctx.lineTo(this.x + this.size * 0.8, this.y + this.size * 0.8);
      ctx.moveTo(this.x + this.size * 0.8, this.y + this.size * 0.2);
      ctx.lineTo(this.x + this.size * 0.2, this.y + this.size * 0.8);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
