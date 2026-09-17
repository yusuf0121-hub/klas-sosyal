import { useEffect, useState } from 'react';
import { Flame, Medal, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Leader = {
  user_id: string;
  points: number;
  streak_days: number;
  debate_score: number;
  profile?: { display_name: string | null; avatar_url: string | null } | null;
};

export default function CommunityLeaderboard() {
  const [leaders, setLeaders] = useState<Leader[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await supabase
        .from('community_stats')
        .select('user_id, points, streak_days, debate_score, profile:profiles!community_stats_user_id_fkey(display_name, avatar_url)')
        .order('debate_score', { ascending: false })
        .order('points', { ascending: false })
        .limit(3);
      if (active) setLeaders((data ?? []) as unknown as Leader[]);
    }
    load();
    return () => { active = false; };
  }, []);

  if (!leaders.length) return null;

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-sky-50 p-4 shadow-sm" aria-labelledby="leaderboard-title">
      <div className="mb-3 flex items-center justify-between">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">Bugünün sahnesi</p><h2 id="leaderboard-title" className="text-lg font-bold text-slate-900">Tartışma liderleri</h2></div>
        <Trophy className="h-6 w-6 text-amber-500" aria-hidden="true" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {leaders.map((leader, index) => {
          const rank = index + 1;
          return <div key={leader.user_id} className={`rounded-xl border p-3 text-center ${rank === 1 ? 'border-amber-300 bg-amber-100/70' : 'border-slate-200 bg-white/80'}`}>
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{leader.profile?.display_name?.[0]?.toUpperCase() ?? '?'}</div>
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-slate-500"><Medal className="h-3.5 w-3.5" aria-hidden="true" /> {rank}. sıra</div>
            <p className="mt-1 truncate text-sm font-semibold text-slate-900">{leader.profile?.display_name ?? 'Kullanıcı'}</p>
            <p className="mt-1 text-xs text-slate-500">{leader.debate_score} tartışma</p>
            <p className="mt-1 flex items-center justify-center gap-1 text-xs font-medium text-orange-600"><Flame className="h-3.5 w-3.5" aria-hidden="true" /> {leader.streak_days} gün</p>
          </div>;
        })}
      </div>
    </section>
  );
}
