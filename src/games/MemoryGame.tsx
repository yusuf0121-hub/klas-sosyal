import { useEffect, useState } from 'react';

const EMOJIS = ['🎮', '🎯', '🎲', '🏆', '⭐', '🎨', '🚀', '💎'];

type Card = { id: number; emoji: string; flipped: boolean; matched: boolean };

export default function MemoryGame(_props: { onBack: () => void }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  function shuffle(): Card[] {
    const pairs = [...EMOJIS, ...EMOJIS];
    return pairs
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
  }

  function start() {
    setCards(shuffle());
    setFlipped([]);
    setMoves(0);
    setWon(false);
  }

  useEffect(() => { start(); }, []);

  useEffect(() => {
    if (flipped.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = flipped;
      if (cards[a].emoji === cards[b].emoji) {
        setCards((prev) => prev.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)));
        setFlipped([]);
      } else {
        const timer = setTimeout(() => {
          setCards((prev) => prev.map((c, i) => (i === a || i === b ? { ...c, flipped: false } : c)));
          setFlipped([]);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [flipped, cards]);

  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.matched)) {
      setWon(true);
    }
  }, [cards]);

  function flip(i: number) {
    if (flipped.length === 2 || cards[i].flipped || cards[i].matched) return;
    setCards((prev) => prev.map((c, idx) => (idx === i ? { ...c, flipped: true } : c)));
    setFlipped((prev) => [...prev, i]);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-slate-700">Hamle: {moves}</span>
        <button onClick={start} className="px-4 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors">
          Yeniden
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2 max-w-[320px] mx-auto">
        {cards.map((card, i) => (
          <button
            key={card.id}
            onClick={() => flip(i)}
            className="aspect-square rounded-xl flex items-center justify-center text-2xl transition-all"
            style={{
              background: card.flipped || card.matched ? '#fff' : 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
              border: card.matched ? '2px solid #34d399' : '2px solid #e2e8f0',
              transform: card.flipped || card.matched ? 'scale(1)' : 'scale(1)',
            }}
          >
            {card.flipped || card.matched ? card.emoji : ''}
          </button>
        ))}
      </div>
      {won && (
        <p className="text-center mt-4 text-sm font-medium text-emerald-600">Tebrikler! {moves} hamlede bitirdin!</p>
      )}
    </div>
  );
}
