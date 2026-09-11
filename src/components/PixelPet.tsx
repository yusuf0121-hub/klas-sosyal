import { useEffect, useMemo, useState } from 'react';
import { Heart, Settings, ShoppingBag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type PetShape = 'round' | 'square' | 'star';
type PetColor = 'orange' | 'cream' | 'gray' | 'black';
type ShopItem = { id: string; name: string; category: 'outfit' | 'habitat'; price: number; accent: string };
type Pet = { name: string; xp: number; level: number; hunger: number; last_interaction_at: string; color: PetColor; shape: PetShape; outfit: string; habitat: string };
type FloatingHeart = { id: number; left: number };

const SHOP_ITEMS: ShopItem[] = [
  { id: 'detective-cap', name: 'Dedektif Kasketi', category: 'outfit', price: 30, accent: '#8b5e3c' },
  { id: 'crown', name: 'Kral Tacı', category: 'outfit', price: 60, accent: '#f5b700' },
  { id: 'pirate-hat', name: 'Korsan Şapkası', category: 'outfit', price: 45, accent: '#242424' },
  { id: 'heart-glasses', name: 'Kalp Gözlük', category: 'outfit', price: 35, accent: '#f97316' },
  { id: 'scarf', name: 'Örgü Atkı', category: 'outfit', price: 25, accent: '#dc2626' },
  { id: 'angel-wings', name: 'Melek Kanatları', category: 'outfit', price: 80, accent: '#e5e7eb' },
  { id: 'cardboard-box', name: 'Klasik Kargo Kutusu', category: 'habitat', price: 20, accent: '#a16207' },
  { id: 'wooden-crate', name: 'Meyve Kasa Kutusu', category: 'habitat', price: 35, accent: '#92400e' },
  { id: 'gift-box', name: 'Hediye Kutusu', category: 'habitat', price: 45, accent: '#dc2626' },
  { id: 'cat-tent', name: 'Kedi Evi', category: 'habitat', price: 55, accent: '#a855f7' },
  { id: 'mushroom-house', name: 'Mantar Evi', category: 'habitat', price: 70, accent: '#ef4444' },
  { id: 'crystal-cave', name: 'Kristal Mağara', category: 'habitat', price: 90, accent: '#c084fc' },
];

const defaultPet: Pet = { name: 'Piksel', xp: 0, level: 1, hunger: 100, last_interaction_at: new Date().toISOString(), color: 'orange', shape: 'round', outfit: 'none', habitat: 'cardboard-box' };

export default function PixelPet() {
  const { user, profile, refreshProfile } = useAuth();
  const [pet, setPet] = useState<Pet>(defaultPet);
  const [loading, setLoading] = useState(true);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [bouncing, setBouncing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [draftName, setDraftName] = useState(defaultPet.name);
  const [tab, setTab] = useState<'outfit' | 'habitat'>('outfit');

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase.from('pixel_pets').select('name,xp,level,hunger,last_interaction_at,color,shape,outfit,habitat').eq('user_id', user.id).maybeSingle().then(async ({ data }) => {
      let next = data as Pet | null;
      if (!next) {
        const { data: created } = await supabase.from('pixel_pets').insert({ user_id: user.id }).select('name,xp,level,hunger,last_interaction_at,color,shape,outfit,habitat').single();
        next = created as Pet | null;
      }
      if (active && next) {
        const hoursAway = Math.max(0, (Date.now() - new Date(next.last_interaction_at).getTime()) / 36e5);
        const hunger = Math.max(0, next.hunger - Math.floor(hoursAway / 24) * 20);
        setPet({ ...next, hunger });
        setDraftName(next.name);
        if (hunger !== next.hunger) await supabase.from('pixel_pets').update({ hunger }).eq('user_id', user.id);
      }
      if (active) setLoading(false);
    }, () => {
      if (active) {
        setPet(defaultPet);
        setDraftName(defaultPet.name);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [user]);

  const savePet = async (patch: Partial<Pet>) => {
    setPet((current) => ({ ...current, ...patch }));
    if (user) {
      const { error } = await supabase.from('pixel_pets').update(patch).eq('user_id', user.id);
      if (error) console.warn('[v0] Pet update skipped:', error.message);
    }
  };

  const giveAffection = async () => {
    const nextXp = pet.xp + 1;
    const next = { xp: nextXp, level: Math.floor(nextXp / 100) + 1, hunger: Math.min(100, pet.hunger + 2), last_interaction_at: new Date().toISOString() };
    setPet((current) => ({ ...current, ...next }));
    setBouncing(true);
    setHearts((current) => [...current, { id: Date.now(), left: 25 + Math.random() * 50 }]);
    window.setTimeout(() => setBouncing(false), 320);
    window.setTimeout(() => setHearts((current) => current.slice(1)), 900);
    if (user) {
      const { error } = await supabase.from('pixel_pets').update(next).eq('user_id', user.id);
      if (error) console.warn('[v0] Pet affection sync skipped:', error.message);
    }
  };

  const saveSettings = async () => {
    const name = draftName.trim().slice(0, 18) || 'Piksel';
    await savePet({ name });
    setDraftName(name);
    setSettingsOpen(false);
  };

  const buyOrEquip = async (item: ShopItem) => {
    const currentCoins = profile?.coins ?? 0;
    if (!user || currentCoins < item.price) return;
    const patch = item.category === 'outfit' ? { outfit: item.id } : { habitat: item.id };
    const { error } = await supabase.from('profiles').update({ coins: currentCoins - item.price }).eq('id', user.id);
    if (error) return;
    await savePet(patch);
    await refreshProfile();
  };

  const progress = pet.xp % 100;
  const affection = Math.max(0, Math.min(100, pet.hunger));
  const isSad = affection < 35;
  const selectedItems = useMemo(() => SHOP_ITEMS.filter((item) => item.category === tab), [tab]);

  if (loading) return <div className="mb-5 h-48 animate-pulse rounded-2xl bg-slate-100" />;
  return (
    <section className="mb-5 overflow-hidden rounded-2xl border-2 border-orange-200 bg-[#fffaf3] p-4 text-slate-900 shadow-[4px_4px_0_#fed7aa]" aria-label="Piksel kedi evcil hayvanı">
      <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-orange-500">PİKSEL PET // 01</p><h2 className="mt-1 text-lg font-black">{pet.name} · Seviye {pet.level}</h2></div><div className="flex gap-1"><button type="button" onClick={() => setShopOpen((open) => !open)} className="rounded-lg p-2 text-slate-500 transition hover:bg-orange-100" aria-label="Kedi mağazasını aç"><ShoppingBag className="h-4 w-4" /></button><button type="button" onClick={() => setSettingsOpen((open) => !open)} className="rounded-lg p-2 text-slate-500 transition hover:bg-orange-100" aria-label="Kediyi özelleştir"><Settings className="h-4 w-4" /></button></div></div>
      <div className="mt-3 flex items-center gap-4"><div className={`cat-stage cat-stage-${pet.shape} cat-habitat-${pet.habitat} cat-color-${pet.color}`}><span className="cat-habitat-mark" aria-hidden="true" />{hearts.map((heart) => <span key={heart.id} className="cat-heart" style={{ left: `${heart.left}%` }}>♥</span>)}<button type="button" onClick={giveAffection} className={`cat-sprite ${bouncing ? 'cat-bounce' : ''} ${isSad ? 'cat-sad' : ''}`} aria-label={`${pet.name} ile sevgi kazan`} />{pet.outfit !== 'none' && <span className={`cat-outfit cat-outfit-${pet.outfit}`} aria-hidden="true" />}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between text-xs font-bold"><span>Sevgi Seviyesi</span><span className="text-orange-500">{pet.xp} XP</span></div><div className="mt-2 h-3 overflow-hidden rounded-full border border-orange-200 bg-orange-100"><div className="h-full rounded-full bg-orange-400 transition-all duration-500" style={{ width: `${Math.max(progress, 3)}%` }} /></div><div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-500"><span className="flex items-center gap-1"><Heart className="h-3 w-3 fill-orange-400 text-orange-400" /> İlgi {affection}%</span><span>{profile?.coins ?? 0} Coin</span></div></div></div>
      {settingsOpen && <div className="mt-3 grid gap-3 rounded-xl border border-orange-200 bg-white p-3"><label className="text-xs font-bold">Kedinin adı<input value={draftName} onChange={(event) => setDraftName(event.target.value)} maxLength={18} className="mt-1 w-full rounded-lg border border-orange-200 px-3 py-2 text-sm outline-none focus:border-orange-400" /></label><div><p className="text-xs font-bold">Renk</p><div className="mt-2 flex gap-2">{(['orange', 'cream', 'gray', 'black'] as PetColor[]).map((color) => <button key={color} type="button" onClick={() => savePet({ color })} className={`h-7 w-7 rounded-full border-2 ${pet.color === color ? 'border-slate-900' : 'border-white'}`} style={{ backgroundColor: color === 'orange' ? '#f97316' : color === 'cream' ? '#fde68a' : color === 'gray' ? '#94a3b8' : '#1f2937' }} aria-label={`${color} renk`} />)}</div></div><div><p className="text-xs font-bold">Kedi şekli</p><div className="mt-2 flex gap-2">{(['round', 'square', 'star'] as PetShape[]).map((shape) => <button key={shape} type="button" onClick={() => savePet({ shape })} className={`rounded-lg border px-3 py-1.5 text-xs ${pet.shape === shape ? 'border-orange-500 bg-orange-100 text-orange-700' : 'border-slate-200'}`}>{shape === 'round' ? 'Yuvarlak' : shape === 'square' ? 'Kare' : 'Yıldız'}</button>)}</div></div><button type="button" onClick={saveSettings} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">Adı kaydet</button></div>}
      {shopOpen && <div className="mt-3 rounded-xl border border-orange-200 bg-white p-3"><div className="flex items-center justify-between"><p className="flex items-center gap-2 text-sm font-black"><ShoppingBag className="h-4 w-4 text-orange-500" /> Kedi Mağazası</p><span className="text-xs font-bold text-orange-500">{profile?.coins ?? 0} coin</span></div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => setTab('outfit')} className={`rounded-lg px-2 py-2 text-xs font-bold ${tab === 'outfit' ? 'bg-orange-100 text-orange-700' : 'bg-slate-50'}`}>Giydir</button><button type="button" onClick={() => setTab('habitat')} className={`rounded-lg px-2 py-2 text-xs font-bold ${tab === 'habitat' ? 'bg-orange-100 text-orange-700' : 'bg-slate-50'}`}>Yuvalar</button></div><div className="mt-3 grid grid-cols-2 gap-2">{selectedItems.map((item) => <button key={item.id} type="button" onClick={() => buyOrEquip(item)} disabled={(profile?.coins ?? 0) < item.price} className="flex items-center justify-between rounded-lg border border-slate-100 p-2 text-left text-xs transition hover:border-orange-300 disabled:opacity-40"><span><span className="block font-bold">{item.name}</span><span className="text-slate-500">{item.price} coin</span></span><span className="h-5 w-5 rounded-full" style={{ backgroundColor: item.accent }} /></button>)}</div></div>}
    </section>
  );
}
