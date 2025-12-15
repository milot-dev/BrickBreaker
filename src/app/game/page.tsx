"use client";

import { useState } from "react";
import GameCanvas from "./GameCanvas";
import GameOver from "./GameOver";

export type GameState = "playing" | "won" | "lost";

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState>("playing");
  const [finalScore, setFinalScore] = useState(0);

  const handleGameEnd = (won: boolean, score: number) => {
    setFinalScore(score);
    setGameState(won ? "won" : "lost");
  };

  const handleRestart = () => {
    setGameState("playing");
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-black via-purple-black to-pink-white">
      {gameState === "playing" && <GameCanvas onGameEnd={handleGameEnd} />}
      {(gameState === "won" || gameState === "lost") && (
        <GameOver
          won={gameState === "won"}
          score={finalScore}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
