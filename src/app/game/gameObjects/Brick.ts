export class Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  visible: boolean;
  id: number;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    id: number
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.visible = true;
    this.id = id;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.visible) return;

    // Enhanced glow effect
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;

    // Main brick with enhanced gradient
    const gradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x,
      this.y + this.height
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(0.5, this.lightenColor(this.color, 0.1));
    gradient.addColorStop(1, this.darkenColor(this.color, 0.3));

    ctx.fillStyle = gradient;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.shadowBlur = 0;

    // Enhanced border with glow
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 2;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 5;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.shadowBlur = 0;

    // Enhanced inner highlight
    const highlightGradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x,
      this.y + this.height * 0.4
    );
    highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
    highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = highlightGradient;
    ctx.fillRect(this.x, this.y, this.width, this.height * 0.4);
  }

  private lightenColor(color: string, amount: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + 255 * amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + 255 * amount);
    const b = Math.min(255, (num & 0xff) + 255 * amount);
    return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
  }

  private darkenColor(color: string, amount: number): string {
    // Simple darkening for hex colors
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.max(0, ((num >> 16) & 0xff) * (1 - amount));
    const g = Math.max(0, ((num >> 8) & 0xff) * (1 - amount));
    const b = Math.max(0, (num & 0xff) * (1 - amount));
    return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
  }
}
