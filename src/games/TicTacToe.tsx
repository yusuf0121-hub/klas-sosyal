import { useState } from 'react';

type Cell = 'X' | 'O' | null;

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWin(board: Cell[]): Cell {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function bestMove(board: Cell[], ai: Cell, human: Cell): number {
  let best = -Infinity;
  let move = -1;
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = ai;
      const score = minimax(board, 0, false, ai, human);
      board[i] = null;
      if (score > best) { best = score; move = i; }
    }
  }
  return move;
}

function minimax(board: Cell[], depth: number, isMax: boolean, ai: Cell, human: Cell): number {
  const winner = checkWin(board);
  if (winner === ai) return 10 - depth;
  if (winner === human) return depth - 10;
  if (board.every(Boolean)) return 0;

  if (isMax) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = ai;
        best = Math.max(best, minimax(board, depth + 1, false, ai, human));
        board[i] = null;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = human;
        best = Math.min(best, minimax(board, depth + 1, true, ai, human));
        board[i] = null;
      }
    }
    return best;
  }
}

export default function TicTacToe(_props: { onBack: () => void }) {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [winner, setWinner] = useState<Cell | 'draw' | null>(null);
  const [scores, setScores] = useState({ you: 0, ai: 0 });

  function play(i: number) {
    if (board[i] || winner) return;
    const newBoard = [...board];
    newBoard[i] = 'X';
    let w = checkWin(newBoard);
    if (w) { setWinner(w); setScores((s) => ({ ...s, you: s.you + 1 })); return; }
    if (newBoard.every(Boolean)) { setWinner('draw'); return; }

    const aiMove = bestMove(newBoard, 'O', 'X');
    newBoard[aiMove] = 'O';
    w = checkWin(newBoard);
    if (w) { setWinner(w); setScores((s) => ({ ...s, ai: s.ai + 1 })); return; }
    if (newBoard.every(Boolean)) { setWinner('draw'); return; }
    setBoard(newBoard);
  }

  function reset() {
    setBoard(Array(9).fill(null));
    setWinner(null);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4 text-sm">
          <span className="font-semibold text-sky-600">Sen: {scores.you}</span>
          <span className="font-semibold text-rose-500">AI: {scores.ai}</span>
        </div>
        <button onClick={reset} className="px-4 py-1.5 bg-sky-500 text-white text-sm rounded-lg hover:bg-sky-600 transition-colors">
          Sıfırla
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => play(i)}
            className="aspect-square bg-slate-50 rounded-xl text-3xl font-bold flex items-center justify-center hover:bg-slate-100 transition-colors"
            style={{ color: cell === 'X' ? '#0ea5e9' : '#ef4444' }}
          >
            {cell}
          </button>
        ))}
      </div>
      {winner && (
        <p className="text-center mt-4 text-sm font-medium text-slate-700">
          {winner === 'draw' ? 'Berabere!' : winner === 'X' ? 'Kazandın!' : 'AI kazandı!'}
        </p>
      )}
    </div>
  );
}
