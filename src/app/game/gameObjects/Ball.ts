export class Ball {
  x: number;
  y: number;
  radius: number;
  dx: number;
  dy: number;
  color: string;
  trail: Array<{ x: number; y: number; alpha: number }>;

  constructor(x: number, y: number, radius: number, dx: number, dy: number) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.dx = dx;
    this.dy = dy;
    this.color = "#FFFFFF";
    this.trail = [];
  }

  update() {
    // Add current position to trail
    this.trail.push({ x: this.x, y: this.y, alpha: 1.0 });

    // Limit trail length and fade
    if (this.trail.length > 8) {
      this.trail.shift();
    }

    // Fade trail
    this.trail.forEach((point) => {
      point.alpha *= 0.85;
    });

    this.x += this.dx;
    this.y += this.dy;
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Draw trail
    this.trail.forEach((point, index) => {
      if (point.alpha > 0.1) {
        ctx.save();
        ctx.globalAlpha = point.alpha * 0.5;
        const trailSize = this.radius * (0.5 + index * 0.1);
        const gradient = ctx.createRadialGradient(
          point.x,
          point.y,
          0,
          point.x,
          point.y,
          trailSize
        );
        gradient.addColorStop(0, "rgba(100, 200, 255, 0.8)");
        gradient.addColorStop(1, "rgba(100, 200, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(point.x, point.y, trailSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    // Outer glow
    const gradient = ctx.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      this.radius * 2.5
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.4, "rgba(100, 200, 255, 0.9)");
    gradient.addColorStop(0.7, "rgba(150, 220, 255, 0.5)");
    gradient.addColorStop(1, "rgba(100, 200, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Main ball with enhanced glow
    const ballGradient = ctx.createRadialGradient(
      this.x - this.radius * 0.3,
      this.y - this.radius * 0.3,
      0,
      this.x,
      this.y,
      this.radius
    );
    ballGradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    ballGradient.addColorStop(0.5, "rgba(150, 220, 255, 0.9)");
    ballGradient.addColorStop(1, "rgba(100, 200, 255, 0.8)");

    ctx.fillStyle = ballGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Enhanced highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.beginPath();
    ctx.arc(
      this.x - this.radius * 0.3,
      this.y - this.radius * 0.3,
      this.radius * 0.4,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}
