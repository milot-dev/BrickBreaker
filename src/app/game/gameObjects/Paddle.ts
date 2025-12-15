export class Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  color: string;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = 7;
    this.color = "#00D4FF";
  }

  moveLeft() {
    this.x -= this.speed;
  }

  moveRight() {
    this.x += this.speed;
  }

  update(canvasWidth: number) {
    // Keep paddle within bounds
    if (this.x < 0) {
      this.x = 0;
    }
    if (this.x + this.width > canvasWidth) {
      this.x = canvasWidth - this.width;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Enhanced glow effect
    const gradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x,
      this.y + this.height
    );
    gradient.addColorStop(0, "rgba(0, 212, 255, 0.9)");
    gradient.addColorStop(0.5, "rgba(0, 180, 255, 1)");
    gradient.addColorStop(1, "rgba(0, 150, 255, 1)");

    // Enhanced shadow/glow
    ctx.shadowColor = "#00D4FF";
    ctx.shadowBlur = 20;
    ctx.fillStyle = gradient;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.shadowBlur = 0;

    // Enhanced border with glow
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#00D4FF";
    ctx.shadowBlur = 10;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.shadowBlur = 0;

    // Enhanced highlight
    const highlightGradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x,
      this.y + this.height * 0.4
    );
    highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.5)");
    highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = highlightGradient;
    ctx.fillRect(this.x, this.y, this.width, this.height * 0.4);
  }
}
