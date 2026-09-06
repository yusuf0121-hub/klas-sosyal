import { useEffect, useState } from 'react';
import { X, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { ALL_BADGES, BADGE_CATEGORIES, TIER_COLORS, TIER_ICONS, type BadgeCategory } from '@/lib/badges';

type Props = {
  onClose: () => void;
};

export default function BadgesScreen({ onClose }: Props) {
  const { user } = useAuth();
  const [earnedIds, setEarnedIds] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<BadgeCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data } = await supabase.from('user_badges').select('badge_id').eq('user_id', user!.id);
      setEarnedIds(new Set((data ?? []).map((b) => b.badge_id)));
      setLoading(false);
    }
    load();
  }, [user]);

  const filtered = filter === 'all' ? ALL_BADGES : ALL_BADGES.filter((b) => b.category === filter);
  const earnedCount = earnedIds.size;
  const totalCount = ALL_BADGES.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto">
      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Rozetler</h1>
          <button onClick={onClose} className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-600 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">İlerleme</span>
            <span className="text-sm font-bold text-sky-600">{earnedCount} / {totalCount}</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all"
              style={{ width: `${(earnedCount / totalCount) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">Toplam {totalCount} rozetten {earnedCount} tanesini kazandın!</p>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filter === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-100'
            }`}
          >
            Tümü
          </button>
          {BADGE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                filter === cat.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Badge grid */}
        {loading ? (
          <div className="grid grid-cols-4 gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-square bg-white rounded-2xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {filtered.map((badge) => {
              const earned = earnedIds.has(badge.id);
              const colors = TIER_COLORS[badge.tier] ?? TIER_COLORS['Çaylak'];
              const icon = TIER_ICONS[badge.tier] ?? '🏆';
              return (
                <div
                  key={badge.id}
                  className={`relative rounded-2xl border p-2 flex flex-col items-center justify-center aspect-square text-center transition-all ${
                    earned ? `${colors.bg} ${colors.border}` : 'bg-white border-slate-100 opacity-60'
                  }`}
                  title={badge.description}
                >
                  <span className={`text-2xl mb-1 ${earned ? '' : 'grayscale'}`}>
                    {earned ? icon : <Lock className="w-5 h-5 text-slate-400" />}
                  </span>
                  <span className={`text-[9px] font-medium leading-tight ${earned ? colors.text : 'text-slate-400'}`}>
                    {badge.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
