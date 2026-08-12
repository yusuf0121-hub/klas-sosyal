import { useEffect, useRef, useState } from 'react';

const GRID = 17;
const SPEED = 120;

type Point = { x: number; y: number };

export default function SnakeGame(_props: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [running, setRunning] = useState(false);
  const snakeRef = useRef<Point[]>([{ x: 8, y: 8 }]);
  const dirRef = useRef<Point>({ x: 1, y: 0 });
  const foodRef = useRef<Point>({ x: 4, y: 4 });
  const loopRef = useRef<number | null>(null);

  function reset() {
    snakeRef.current = [{ x: 8, y: 8 }];
    dirRef.current = { x: 1, y: 0 };
    foodRef.current = { x: 4, y: 4 };
    setScore(0);
    setGameOver(false);
    setRunning(true);
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const d = dirRef.current;
      if (e.key === 'ArrowUp' && d.y === 0) dirRef.current = { x: 0, y: -1 };
      else if (e.key === 'ArrowDown' && d.y === 0) dirRef.current = { x: 0, y: 1 };
      else if (e.key === 'ArrowLeft' && d.x === 0) dirRef.current = { x: -1, y: 0 };
      else if (e.key === 'ArrowRight' && d.x === 0) dirRef.current = { x: 1, y: 0 };
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cell = canvas.width / GRID;

    loopRef.current = window.setInterval(() => {
      const snake = snakeRef.current;
      const dir = dirRef.current;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID || snake.some((s) => s.x === head.x && s.y === head.y)) {
        setGameOver(true);
        setRunning(false);
        return;
      }

      const newSnake = [head, ...snake];
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        setScore((s) => s + 1);
        let nf: Point;
        do {
          nf = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
        } while (newSnake.some((s) => s.x === nf.x && s.y === nf.y));
        foodRef.current = nf;
      } else {
        newSnake.pop();
      }
      snakeRef.current = newSnake;

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(foodRef.current.x * cell + cell / 2, foodRef.current.y * cell + cell / 2, cell / 2.5, 0, Math.PI * 2);
      ctx.fill();

      newSnake.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? '#0ea5e9' : '#38bdf8';
        ctx.fillRect(s.x * cell + 1, s.y * cell + 1, cell - 2, cell - 2);
      });
    }, SPEED);

    return () => { if (loopRef.current) clearInterval(loopRef.current); };
  }, [running]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-slate-700">Skor: {score}</span>
        <button onClick={reset} className="px-4 py-1.5 bg-sky-500 text-white text-sm rounded-lg hover:bg-sky-600 transition-colors">
          {gameOver ? 'Tekrar Oyna' : 'Başla'}
        </button>
      </div>
      <canvas ref={canvasRef} width={340} height={340} className="w-full rounded-xl bg-slate-50 mx-auto block" />
      {gameOver && (
        <p className="text-center mt-3 text-sm text-rose-500 font-medium">Oyun bitti! Skor: {score}</p>
      )}
      <p className="text-center mt-3 text-xs text-slate-400">Yön tuşlarıyla oynayın</p>
    </div>
  );
}
