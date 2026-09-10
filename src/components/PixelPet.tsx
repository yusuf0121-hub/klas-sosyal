import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export default function PixelPet() {
  const { user } = useAuth();
  const [pet, setPet] = useState({ name: 'Piksel', xp: 0, level: 1, likes_fed: 0, comments_fed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase.from('pixel_pets').select('name,xp,level,likes_fed,comments_fed').eq('user_id', user.id).maybeSingle().then(async ({ data }) => {
      if (data) { if (active) setPet(data); }
      else {
        const { data: created } = await supabase.from('pixel_pets').insert({ user_id: user.id }).select('name,xp,level,likes_fed,comments_fed').single();
        if (active && created) setPet(created);
      }
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [user]);

  const progress = pet.xp % 100;
  if (loading) return <div className="mb-5 h-28 animate-pulse rounded-2xl bg-slate-100" />;
  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-slate-100 bg-slate-950 p-4 text-white shadow-sm" aria-label="Piksel evcil hayvanı">
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-xl border-4 border-emerald-300 bg-emerald-950 text-4xl" style={{ imageRendering: 'pixelated' }}>◉</div>
        <div className="min-w-0 flex-1"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-widest text-emerald-300">Piksel evcil hayvanı</p><h2 className="text-lg font-bold">{pet.name} · Seviye {pet.level}</h2></div><span className="text-xs text-slate-400">{pet.xp} XP</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-300 transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-xs text-slate-400">Beğeni ve yorumlarınla büyür.</p></div>
      </div>
    </section>
  );
}
