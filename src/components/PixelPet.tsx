import { useEffect, useState } from 'react';
import { Gamepad2, Settings, Utensils } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type PetShape = 'round' | 'square' | 'star';
type FloatingHeart = { id: number; left: number };

export default function PixelPet() {
  const { user } = useAuth();
  const [pet, setPet] = useState({ name: 'Piksel', xp: 0, level: 1, likes_fed: 0, comments_fed: 0 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Seni bekliyor...');
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [bouncing, setBouncing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftName, setDraftName] = useState('Piksel');
  const [shape, setShape] = useState<PetShape>('round');

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase.from('pixel_pets').select('name,xp,level,likes_fed,comments_fed').eq('user_id', user.id).maybeSingle().then(async ({ data }) => {
      if (data) { if (active) { setPet(data); setDraftName(data.name); } }
      else {
        const { data: created } = await supabase.from('pixel_pets').insert({ user_id: user.id }).select('name,xp,level,likes_fed,comments_fed').single();
        if (active && created) { setPet(created); setDraftName(created.name); }
      }
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [user]);

  const giveAffection = async () => {
    const nextXp = pet.xp + 1;
    setPet((current) => ({ ...current, xp: nextXp, level: Math.floor(nextXp / 100) + 1 }));
    setBouncing(true);
    setHearts((current) => [...current, { id: Date.now(), left: 25 + Math.random() * 50 }]);
    window.setTimeout(() => setBouncing(false), 320);
    window.setTimeout(() => setHearts((current) => current.slice(1)), 900);
    if (user) await supabase.from('pixel_pets').update({ xp: nextXp, level: Math.floor(nextXp / 100) + 1 }).eq('user_id', user.id);
  };

  const saveSettings = async () => {
    const name = draftName.trim().slice(0, 18) || 'Piksel';
    setPet((current) => ({ ...current, name }));
    setDraftName(name);
    setSettingsOpen(false);
    if (user) await supabase.from('pixel_pets').update({ name }).eq('user_id', user.id);
  };

  const progress = pet.xp % 100;
  if (loading) return <div className="mb-5 h-56 animate-pulse rounded-2xl bg-slate-100" />;
  return (
    <section className="mb-5 overflow-hidden rounded-2xl border-2 border-orange-200 bg-[#fffaf3] p-4 text-slate-900 shadow-[4px_4px_0_#fed7aa]" aria-label="Piksel kedi evcil hayvanı">
      <div className="flex items-start justify-between gap-3">
        <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-orange-500">PİKSEL PET // 01</p><h2 className="mt-1 text-lg font-black">{pet.name} · Seviye {pet.level}</h2></div>
        <button type="button" onClick={() => setSettingsOpen((open) => !open)} className="rounded-lg p-2 text-slate-500 transition hover:bg-orange-100" aria-label="Kediyi özelleştir"><Settings className="h-4 w-4" /></button>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <div className={`cat-stage cat-stage-${shape}`}>
          {hearts.map((heart) => <span key={heart.id} className="cat-heart" style={{ left: `${heart.left}%` }}>♥</span>)}
          <button type="button" onClick={giveAffection} className={`cat-sprite ${bouncing ? 'cat-bounce' : ''}`} aria-label={`${pet.name} ile sevgi kazan`} />
        </div>
        <div className="min-w-0 flex-1"><div className="flex items-center justify-between text-xs font-bold"><span>Sevgi Seviyesi</span><span className="text-orange-500">{pet.xp} XP</span></div><div className="mt-2 h-3 overflow-hidden rounded-full border border-orange-200 bg-orange-100"><div className="h-full rounded-full bg-orange-400 transition-all duration-500" style={{ width: `${Math.max(progress, 3)}%` }} /></div><p className="mt-2 text-xs text-slate-500">{status}</p></div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => { setStatus('Tok ve mutlu!'); giveAffection(); }} className="flex items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-100 px-3 py-2 text-xs font-bold text-orange-700 transition hover:bg-orange-200"><Utensils className="h-4 w-4" /> Kediye Mama Ver</button><button type="button" onClick={() => { setStatus('Mırlıyor...'); giveAffection(); }} className="flex items-center justify-center gap-2 rounded-lg border border-orange-200 bg-white px-3 py-2 text-xs font-bold text-orange-700 transition hover:bg-orange-50"><Gamepad2 className="h-4 w-4" /> Oyna</button></div>
      {settingsOpen && <div className="mt-3 grid gap-3 rounded-xl border border-orange-200 bg-white p-3"><label className="text-xs font-bold">Kedinin adı<input value={draftName} onChange={(event) => setDraftName(event.target.value)} maxLength={18} className="mt-1 w-full rounded-lg border border-orange-200 px-3 py-2 text-sm outline-none focus:border-orange-400" /></label><div><p className="text-xs font-bold">Kart şekli</p><div className="mt-2 flex gap-2">{(['round', 'square', 'star'] as PetShape[]).map((option) => <button key={option} type="button" onClick={() => setShape(option)} className={`rounded-lg border px-3 py-1.5 text-xs capitalize ${shape === option ? 'border-orange-500 bg-orange-100 text-orange-700' : 'border-slate-200'}`}>{option === 'round' ? 'Yuvarlak' : option === 'square' ? 'Kare' : 'Yıldız'}</button>)}</div></div><button type="button" onClick={saveSettings} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">Kaydet</button></div>}
    </section>
  );
}
