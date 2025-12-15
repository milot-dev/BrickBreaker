/**
 * Centralized game configuration
 * All tunable game constants are defined here for easy adjustment
 */

export const GameConfig = {
  // Canvas dimensions
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,

  // Brick layout
  BRICK_ROWS_START: 5, // Starting number of brick rows
  BRICK_COLS: 10, // Number of brick columns
  BRICK_WIDTH: 70,
  BRICK_HEIGHT: 25,
  BRICK_PADDING: 5,
  BRICK_OFFSET_TOP: 10,
  // BRICK_OFFSET_LEFT is calculated dynamically

  // Ball physics
  BALL_RADIUS: 8,
  BALL_BASE_SPEED: 6, // Base speed for dx and dy
  BALL_SPEED_INCREASE_PER_LEVEL: 0.05, // 5% speed increase per level
  BALL_START_X_OFFSET: 0, // Relative to canvas center
  BALL_START_Y_OFFSET: -50, // Above paddle

  // Paddle properties
  PADDLE_WIDTH: 100,
  PADDLE_HEIGHT: 15,
  PADDLE_SPEED: 10,
  PADDLE_Y_OFFSET: 30, // Distance from bottom of canvas
  PADDLE_SIZE_POWERUP_MULTIPLIER: 1.5, // 50% increase
  PADDLE_SIZE_POWERUP_DURATION: 10000, // 10 seconds in milliseconds

  // Power-up settings
  POWERUP_SPAWN_RATE: 0.15, // 15% chance to drop from destroyed brick
  POWERUP_FALL_SPEED: 3, // Pixels per frame
  POWERUP_SIZE: 20, // Width and height of power-up icon
  SLOW_BALL_POWERUP_DURATION: 8000, // 8 seconds in milliseconds
  SLOW_BALL_SPEED_MULTIPLIER: 0.5, // 50% speed reduction

  // Scoring
  POINTS_PER_BRICK: 10,
  RESET_SCORE_ON_LEVEL_RESET: false, // Keep score when level resets

  // Level progression
  BRICK_ROWS_INCREASE_INTERVAL: 3, // Add 1 row every 3 levels
  LEVEL_TRANSITION_DELAY: 1500, // Milliseconds to show level transition

  // Visual effects
  PARTICLE_COUNT_WALL_HIT: 3,
  PARTICLE_COUNT_PADDLE_HIT: 5,
  PARTICLE_COUNT_BRICK_BREAK: 8,
  SCREEN_SHAKE_INTENSITY: 3,
  SCREEN_SHAKE_DECAY: 0.9,

  // Brick colors
  BRICK_COLORS: [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
  ],
} as const;

/**
 * Calculate brick offset from left edge of canvas
 */
export function getBrickOffsetLeft(): number {
  const totalBrickWidth =
    GameConfig.BRICK_COLS * GameConfig.BRICK_WIDTH +
    (GameConfig.BRICK_COLS - 1) * GameConfig.BRICK_PADDING;
  return (GameConfig.CANVAS_WIDTH - totalBrickWidth) / 2;
}

/**
 * Calculate number of brick rows for a given level
 */
export function getBrickRowsForLevel(level: number): number {
  const additionalRows = Math.floor((level - 1) / GameConfig.BRICK_ROWS_INCREASE_INTERVAL);
  return GameConfig.BRICK_ROWS_START + additionalRows;
}

/**
 * Calculate ball speed multiplier for a given level
 */
export function getBallSpeedMultiplierForLevel(level: number): number {
  return 1 + (level - 1) * GameConfig.BALL_SPEED_INCREASE_PER_LEVEL;
}

