"use client";

import GameCanvas from "./GameCanvas";

export default function GamePage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-black via-purple-black to-pink-white">
      <GameCanvas />
    </div>
  );
}
