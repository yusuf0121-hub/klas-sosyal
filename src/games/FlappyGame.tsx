import { useEffect, useRef, useState } from 'react';

const GRAVITY = 0.4;
const JUMP = -7;
const PIPE_WIDTH = 50;
const PIPE_GAP = 140;
const PIPE_SPACING = 200;

export default function FlappyGame(_props: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [running, setRunning] = useState(false);
  const stateRef = useRef({
    birdY: 200,
    birdV: 0,
    pipes: [] as { x: number; gapY: number; passed: boolean }[],
    frame: 0,
  });

  function reset() {
    stateRef.current = { birdY: 200, birdV: 0, pipes: [], frame: 0 };
    setScore(0);
    setGameOver(false);
    setRunning(true);
  }

  function jump() {
    if (!running && !gameOver) { reset(); return; }
    if (running) stateRef.current.birdV = JUMP;
  }

  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    let raf: number;

    function loop() {
      const s = stateRef.current;
      s.frame++;
      s.birdV += GRAVITY;
      s.birdY += s.birdV;

      if (s.frame % 80 === 0 || s.pipes.length === 0) {
        s.pipes.push({ x: W, gapY: 60 + Math.random() * (H - PIPE_GAP - 120), passed: false });
      }

      s.pipes.forEach((p) => { p.x -= 2.5; });
      s.pipes = s.pipes.filter((p) => p.x > -PIPE_WIDTH);

      const birdX = 60;
      const birdSize = 20;

      // Collision
      for (const p of s.pipes) {
        if (birdX + birdSize > p.x && birdX - birdSize < p.x + PIPE_WIDTH) {
          if (s.birdY - birdSize < p.gapY || s.birdY + birdSize > p.gapY + PIPE_GAP) {
            setGameOver(true);
            setRunning(false);
            return;
          }
        }
        if (!p.passed && p.x + PIPE_WIDTH < birdX) {
          p.passed = true;
          setScore((sc) => sc + 1);
        }
      }

      if (s.birdY > H || s.birdY < 0) {
        setGameOver(true);
        setRunning(false);
        return;
      }

      const ctx2 = ctx!;
    // Draw
      ctx2.fillStyle = '#0f172a';
      ctx2.fillRect(0, 0, W, H);

      ctx2.fillStyle = '#fbbf24';
      ctx2.beginPath();
      ctx2.arc(birdX, s.birdY, birdSize, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.fillStyle = '#f97316';
      ctx2.beginPath();
      ctx2.arc(birdX + 12, s.birdY - 4, 4, 0, Math.PI * 2);
      ctx2.fill();

      ctx2.fillStyle = '#38bdf8';
      s.pipes.forEach((p) => {
        ctx2.fillRect(p.x, 0, PIPE_WIDTH, p.gapY);
        ctx2.fillRect(p.x, p.gapY + PIPE_GAP, PIPE_WIDTH, H - p.gapY - PIPE_GAP);
      });

      raf = requestAnimationFrame(loop);
    }
    loop();
    return () => cancelAnimationFrame(raf);
  }, [running]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-slate-700">Skor: {score}</span>
        <button onClick={reset} className="px-4 py-1.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors">
          {gameOver ? 'Tekrar Oyna' : 'Başla'}
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={340}
        height={420}
        onClick={jump}
        className="w-full rounded-xl bg-slate-900 mx-auto block cursor-pointer"
      />
      {gameOver && (
        <p className="text-center mt-3 text-sm text-rose-500 font-medium">Oyun bitti! Skor: {score}</p>
      )}
      <p className="text-center mt-3 text-xs text-slate-400">Ekrana tıklayarak zıpla</p>
    </div>
  );
}
