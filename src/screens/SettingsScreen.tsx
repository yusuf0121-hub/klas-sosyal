import { useState } from 'react';
import { Bell, Lock, LogOut, Moon, Save, Shield, UserRound } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/ThemeProvider';
import { usePushNotifications } from '@/hooks/usePushNotifications';

type Props = { onClose: () => void };

export default function SettingsScreen({ onClose }: Props) {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { isDark, reduceMotion, setReduceMotion, textColor, subtextColor, cardBg, cardBorder } = useTheme();
  const { permission, subscribing, requestPermission, enabled } = usePushNotifications();
  const [name, setName] = useState(profile?.display_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [email, setEmail] = useState(profile?.email ?? user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function exportData() {
    if (!user) return;
    const [{ data: profileData }, { data: postsData }, { data: messagesData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('posts').select('*').eq('user_id', user.id),
      supabase.from('messages').select('*').eq('sender_id', user.id),
    ]);
    const blob = new Blob([JSON.stringify({ profile: profileData, posts: postsData ?? [], messages: messagesData ?? [] }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'klas-sosyal-verilerim.json'; link.click(); URL.revokeObjectURL(url);
  }

  async function saveProfile() {
    if (!user) return;
    setSaving(true); setMessage('');
    const { error } = await supabase.from('profiles').update({ display_name: name.trim(), bio: bio.trim() || null, email: email.trim().toLowerCase() }).eq('id', user.id);
    setMessage(error ? 'Ayarlar kaydedilemedi.' : 'Ayarlar kaydedildi.');
    if (!error) await refreshProfile();
    setSaving(false);
  }

  return <section className="mx-auto max-w-xl space-y-4 px-4 py-5" style={{ color: textColor }}>
    <div className="flex items-center gap-3"><button onClick={onClose} className="rounded-xl px-3 py-2" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>Geri</button><h1 className="text-xl font-bold">Ayarlar</h1></div>
    <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}><h2 className="mb-4 flex items-center gap-2 font-semibold"><UserRound className="h-4 w-4" /> Profil</h2><div className="space-y-3"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Görünen ad" className="w-full rounded-xl border bg-transparent px-3 py-2" /><textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" rows={3} className="w-full rounded-xl border bg-transparent px-3 py-2" /><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="E-posta" className="w-full rounded-xl border bg-transparent px-3 py-2" /><button onClick={saveProfile} disabled={saving} className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>{message && <p className="text-sm" style={{ color: subtextColor }}>{message}</p>}</div></div>
    <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}><h2 className="mb-3 flex items-center gap-2 font-semibold"><Shield className="h-4 w-4" /> Güvenlik</h2><p className="text-sm" style={{ color: subtextColor }}>Şifre değişikliği için giriş ekranındaki “Şifreni mi unuttun?” akışını kullanabilirsin.</p><button onClick={() => void signOut()} className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 font-semibold text-rose-600"><LogOut className="h-4 w-4" /> Tüm oturumu kapat</button></div>
    <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}><h2 className="mb-3 flex items-center gap-2 font-semibold"><Bell className="h-4 w-4" /> Bildirimler</h2><p className="text-sm" style={{ color: subtextColor }}>{permission === 'unsupported' ? 'Bu tarayıcı telefon bildirimlerini desteklemiyor.' : enabled ? 'Telefon bildirimleri açık.' : 'Telefon bildirimlerini açarak yeni mesaj ve etkileşimlerden haberdar ol.'}</p>{permission !== 'unsupported' && !enabled && <button type="button" onClick={() => void requestPermission()} disabled={subscribing} className="mt-3 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{subscribing ? 'Açılıyor...' : 'Telefon bildirimlerini aç'}</button>}</div>
    <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}><h2 className="mb-3 flex items-center gap-2 font-semibold"><Shield className="h-4 w-4" /> Veri ve hesap</h2><p className="text-sm" style={{ color: subtextColor }}>Klas Sosyal verilerinin bir kopyasını indirebilirsin.</p><button type="button" onClick={() => void exportData()} className="mt-3 rounded-xl border px-4 py-2 text-sm font-semibold" style={{ borderColor: cardBorder }}>Verilerimi indir</button></div>
    <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}><h2 className="mb-3 flex items-center gap-2 font-semibold"><Moon className="h-4 w-4" /> Görünüm</h2><label className="flex items-center justify-between text-sm"><span>{isDark ? 'Koyu tema aktif' : 'Açık tema aktif'}</span><span className="text-xs" style={{ color: subtextColor }}>Profil temalarından değiştir</span></label><label className="mt-3 flex items-center justify-between text-sm"><span>Animasyonları azalt</span><input type="checkbox" checked={reduceMotion} onChange={(e) => setReduceMotion(e.target.checked)} /></label></div>
  </section>;
}
