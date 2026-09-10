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
    <section className="mb-5 overflow-hidden rounded-2xl border border-orange-100 bg-[#fffaf3] p-4 text-slate-900 shadow-sm" aria-label="Piksel kedi evcil hayvanı">
      <div className="flex items-center gap-4">
        <div className="cat-stage" aria-label="Animasyonlu piksel kedi" role="img">
          <div className="cat-sprite" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-widest text-orange-500">Piksel kedi</p><h2 className="text-lg font-bold">{pet.name} · Seviye {pet.level}</h2></div>
            <span className="shrink-0 text-xs font-semibold text-orange-500">{pet.xp} XP</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-orange-100"><div className="h-full rounded-full bg-orange-400 transition-all" style={{ width: `${progress}%` }} /></div>
          <p className="mt-2 text-xs text-slate-500">Beğeni ve yorumlarınla beslenen küçük dostun.</p>
        </div>
      </div>
    </section>
  );
}
