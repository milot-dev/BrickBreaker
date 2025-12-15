"use client";

interface GameOverProps {
  won: boolean;
  score: number;
  onRestart: () => void;
}

export default function GameOver({ won, score, onRestart }: GameOverProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center space-y-8 animate-fade-in">
        {won ? (
          <>
            <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-green-300 to-cyan-300 animate-pulse drop-shadow-2xl">
              YOU WIN!
            </h1>
            <div className="text-4xl animate-bounce">🎉</div>
          </>
        ) : (
          <>
            <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-pink-400 to-orange-400 animate-pulse drop-shadow-2xl">
              GAME OVER
            </h1>
            <div className="text-4xl animate-bounce">💥</div>
          </>
        )}

        <div className="space-y-4">
          <p className="text-3xl md:text-4xl text-white font-semibold drop-shadow-lg">
            Final Score
          </p>
          <p className="text-5xl md:text-6xl font-bold text-yellow-300 drop-shadow-lg animate-pulse">
            {score}
          </p>
        </div>

        <button
          onClick={onRestart}
          className="mt-8 px-12 py-4 text-2xl font-bold text-black bg-gradient-to-r from-white to-cyan-500 rounded-full shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/70 transition-all duration-300 hover:scale-110 hover:from-cyan-400 hover:to-white border-2 border-white/30 hover:border-white/60"
        >
          PLAY AGAIN
        </button>
      </div>

      {/* Confetti effect for win */}
      {won && (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: "-10%",
                backgroundColor: [
                  "#FFD700",
                  "#FF6B6B",
                  "#4ECDC4",
                  "#45B7D1",
                  "#FFA07A",
                ][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
