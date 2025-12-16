# Brick Breaker Game

A simplified, beginner friendly Brick Breaker game built with Next.js, React, and TypeScript. Break all the bricks to advance to the next level!

## Game Overview

### Description

Brick Breaker is a classic arcade style game where you control a paddle to bounce a ball and break bricks. The game features:

- **Level Progression**: Multiple levels with gradually increasing difficulty
- **Power Ups**: Collect power ups that drop from broken bricks
- **Simple Scoring**: Earn points for each brick you break
- **Relaxing Gameplay**: No lives system just reset the level and try again!

### Controls

- **Arrow Keys (← →)** or **A/D Keys**: Move the paddle left and right
- The paddle automatically keeps the ball in play

### Level Navigation

You can manually change levels using keyboard shortcuts or UI controls:

**Keyboard Shortcuts:**

- **Number Keys (1-9)**: Jump directly to that level
- **+ or =**: Go to next level
- **- or \_**: Go to previous level

**UI Controls:**

- **Previous Button (←)**: Go to previous level (disabled on level 1)
- **Level Input Field**: Type a number to jump to that level
- **Next Button (→)**: Go to next level

Level changes immediately reset the game state and load the new level's pattern.

### Power Ups

Power ups randomly drop from destroyed bricks (15% chance):

1. **Paddle Size Increase** (Green Icon)

   - Temporarily increases paddle width by 50%
   - Duration: 10 seconds
   - Makes it easier to catch the ball

2. **Slow Ball** (Yellow Icon)

   - Reduces ball speed by 50%
   - Duration: 8 seconds
   - Gives you more time to react

3. **Destroy Row** (Red Icon)
   - Instantly destroys the bottommost row of bricks
   - Instant effect (no duration)
   - Awards points for all destroyed bricks
   - Great for clearing difficult rows quickly

Active power ups with durations are displayed in the top UI with a countdown timer.

## Project Structure

```
src/app/game/
├── config/
│   └── gameConfig.ts          # Centralized game configuration
├── gameObjects/
│   ├── Ball.ts                 # Ball physics and rendering
│   ├── Brick.ts                # Brick rendering
│   ├── Paddle.ts               # Paddle with power up support
│   └── PowerUp.ts              # Power up drop system
├── utils/
│   ├── Particle.ts             # Particle effects
│   └── SoundManager.ts         # Audio feedback
├── GameCanvas.tsx              # Main game loop and logic
└── page.tsx                    # Game page wrapper
```

### File Responsibilities

- **gameConfig.ts**: All tunable game constants (speeds, sizes, durations, etc.)
- **Ball.ts**: Handles ball movement, collision, and rendering with speed multiplier support
- **Brick.ts**: Simple brick rendering with color gradients
- **Paddle.ts**: Paddle movement, bounds checking, and power up size modifications
- **PowerUp.ts**: Power up drop mechanics, collision detection, and rendering
- **GameCanvas.tsx**: Main game loop, collision detection, level management, and rendering
- **Particle.ts**: Particle effects for visual feedback
- **SoundManager.ts**: Web Audio API sound effects

## Core Systems

### Ball & Paddle Logic

The ball moves continuously and bounces off:

- **Walls**: Left, right, and top boundaries
- **Paddle**: Angle of bounce depends on where the ball hits the paddle
- **Bricks**: Bounces based on which side of the brick was hit

The paddle moves horizontally based on keyboard input and stays within canvas bounds.

### Power Up System

1. **Spawning**: When a brick is destroyed, there's a 15% chance a power up will drop
2. **Collection**: Power ups fall downward and are collected when they touch the paddle
3. **Activation**: Power ups activate immediately upon collection
4. **Types**:
   - **Duration based**: Paddle Size Increase and Slow Ball have fixed durations (see Configuration)
   - **Instant**: Destroy Row activates immediately with no duration
5. **Display**: Active power ups with durations show a countdown timer in the UI

### Level Progression

Levels are procedurally generated with increasing difficulty:

- **Brick Layouts**: Each level uses a different pattern that cycles every 8 levels:
  - **Level 1**: Pattern 0 (Full grid)
  - **Level 2**: Pattern 1 (Checkerboard)
  - **Level 3**: Pattern 2 (Pyramid)
  - **Level 4**: Pattern 3 (Hollow center)
  - **Level 5**: Pattern 4 (Side columns)
  - **Level 6**: Pattern 5 (Diagonal stripes)
  - **Level 7**: Pattern 6 (Concentric rings)
  - **Level 8**: Pattern 7 (Sparse random)
  - **Level 9+**: Cycles back to Pattern 0
- **Brick Rows**: Starting at 5 rows, increases by 1 every 3 levels
- **Ball Speed**: Increases by 5% per level
- **Level Reset**: If the ball falls below the paddle, the current level resets (score is preserved)
- **Manual Level Selection**: Use keyboard shortcuts (1-9, +, -) or UI controls to jump between levels

### Scoring

- **Points per Brick**: 10 points (configurable)
- **Score Persistence**: Score is maintained across level resets
- **No Multipliers**: Simple, straightforward scoring system

## Configuration

All game parameters can be adjusted in `src/app/game/config/gameConfig.ts`:

### Paddle Settings

```typescript
PADDLE_WIDTH: 100,              // Base paddle width in pixels
PADDLE_HEIGHT: 15,             // Paddle height in pixels
PADDLE_SPEED: 10,              // Paddle movement speed
PADDLE_SIZE_POWERUP_MULTIPLIER: 1.5,  // Size increase multiplier
PADDLE_SIZE_POWERUP_DURATION: 10000,   // Duration in milliseconds
```

### Ball Settings

```typescript
BALL_RADIUS: 8,                              // Ball radius in pixels
BALL_BASE_SPEED: 6,                          // Base speed for dx and dy
BALL_SPEED_INCREASE_PER_LEVEL: 0.05,         // 5% speed increase per level
```

### Power Up Settings

```typescript
POWERUP_SPAWN_RATE: 0.15,                    // 15% chance to drop
POWERUP_FALL_SPEED: 3,                       // Pixels per frame
SLOW_BALL_POWERUP_DURATION: 8000,            // Duration in milliseconds
SLOW_BALL_SPEED_MULTIPLIER: 0.5,             // 50% speed reduction
```

### Level Settings

```typescript
BRICK_ROWS_START: 5,                         // Starting number of rows
BRICK_ROWS_INCREASE_INTERVAL: 3,             // Add 1 row every 3 levels
LEVEL_TRANSITION_DELAY: 1500,                // Transition delay in milliseconds
```

### Scoring Settings

```typescript
POINTS_PER_BRICK: 10,                        // Points awarded per brick
RESET_SCORE_ON_LEVEL_RESET: false,           // Keep score when level resets
```

## Running the Game

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Setup Instructions

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start Development Server**

   ```bash
   npm run dev
   ```

3. **Open in Browser**

   Navigate to [http://localhost:3001](http://localhost:3001)

   (Note: The game runs on port 3001 by default)

### Build for Production

```bash
npm run build
npm start
```

## How It Works

### Game Loop

The game uses `requestAnimationFrame` for smooth 60 FPS gameplay:

1. **Update Phase**: Update all game objects (ball, paddle, power ups, particles)
2. **Collision Detection**: Check collisions between ball and walls, paddle, bricks
3. **State Management**: Handle level completion, power up expiration, score updates
4. **Rendering Phase**: Draw all game objects to the canvas

### Level Reset Logic

When the ball falls below the paddle:

- Current level is reset (same level number)
- Ball and paddle return to starting positions
- Bricks are regenerated with the same layout
- Score is preserved (unless `RESET_SCORE_ON_LEVEL_RESET` is true)
- Game continues - no game over screen

### Manual Level Selection

The game supports manual level navigation for testing and gameplay:

- **Immediate Level Change**: When you change levels manually, the game immediately:
  - Resets all game objects (ball, paddle, bricks, power ups)
  - Generates the new level's pattern
  - Maintains or resets score based on configuration
- **Keyboard Shortcuts**: Quick level navigation without interrupting gameplay
- **UI Controls**: Visual level selector with input field and navigation buttons

### Collision Detection

Uses simple AABB (Axis Aligned Bounding Box) collision detection:

- Ball is treated as a circle
- Bricks and paddle are rectangles
- Collision side is determined by minimum overlap distance
- Ball position is corrected to prevent overlap

## Future Extensions

### Adding New Power Ups

1. Add new type to `PowerUpType` in `PowerUp.ts`:

   ```typescript
   export type PowerUpType =
     | "paddleSize"
     | "slowBall"
     | "destroyRow"
     | "yourNewPowerUp";
   ```

2. Add rendering logic in `PowerUp.draw()` to display the power up icon

3. Add activation logic in `GameCanvas.tsx` power up collection handler (around line 432)

4. Update power up spawn logic in `GameCanvas.tsx` (around line 351) to include the new type in random selection

5. If the power up has a duration, add configuration values in `gameConfig.ts` and update the power up display state

### Adding New Level Patterns

Modify `getLevelLayoutPattern()` in `GameCanvas.tsx` to add new layout types. The pattern selection uses `(level - 1) % 8` to cycle through 8 patterns, so adding more patterns requires updating the modulo value and adding new cases to the switch statement.

### Adjusting Difficulty

Modify these values in `gameConfig.ts`:

- `BALL_SPEED_INCREASE_PER_LEVEL`: How much faster each level gets
- `BRICK_ROWS_INCREASE_INTERVAL`: How often to add more rows
- `BRICK_ROWS_START`: Starting number of rows

## Technologies Used

- **Next.js 16**: React framework
- **React 19**: UI library
- **TypeScript**: Type safe JavaScript
- **Tailwind CSS**: Styling
- **Canvas API**: 2D rendering
- **Web Audio API**: Sound effects

## Contributors
Milot Hyseni
Shend Hetemi

## License

This project is open source and available for learning and modification. Developed as a college project for Game Development subject.
