import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-purple-black to-pink-white font-sans">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center py-32 px-16 text-center">
        <div className="space-y-8 animate-fade-in">
          <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-300 animate-pulse drop-shadow-2xl">
            BRICK BREAKER
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 font-semibold drop-shadow-lg max-w-2xl mx-auto">
            Classic arcade style brick breaking action! Break all the bricks to win.
          </p>

          <div className="pt-8">
            <Link
              href="/game"
              className="inline-block px-12 py-4 text-2xl font-bold text-black bg-gradient-to-r from-white to-cyan-500 rounded-full shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/70 transition-all duration-300 hover:scale-110 hover:from-cyan-400 hover:to-white border-2 border-white/30 hover:border-white/60"
            >
              PLAY NOW
            </Link>
          </div>

          <div className="pt-8 text-white/70 text-sm space-y-2">
            <p> Use ← → arrow keys or A/D to move the paddle</p>
            <p> Break all bricks to win!</p>
            <p> Don't let the ball fall!</p>
          </div>
        </div>

        {/* Animated background particles */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
