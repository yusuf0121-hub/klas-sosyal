import { useEffect, useState } from 'react';
import { ArrowLeft, Ban, Flag, VolumeX, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type Props = { onClose: () => void };
type Relation = { id: string; target_user_id: string; created_at: string; target?: { display_name?: string | null } | null };

export default function ModerationScreen({ onClose }: Props) {
  const { user } = useAuth();
  const [blocked, setBlocked] = useState<Relation[]>([]);
  const [muted, setMuted] = useState<Relation[]>([]);
  const [reportText, setReportText] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    if (!user) return;
    const [blocks, mutes] = await Promise.all([
      supabase.from('user_blocks').select('*, target:profiles!user_blocks_target_user_id_fkey(display_name)').eq('user_id', user.id),
      supabase.from('user_mutes').select('*, target:profiles!user_mutes_target_user_id_fkey(display_name)').eq('user_id', user.id),
    ]);
    setBlocked((blocks.data ?? []) as unknown as Relation[]);
    setMuted((mutes.data ?? []) as unknown as Relation[]);
  }
  useEffect(() => { void load(); }, [user]);

  async function remove(table: 'user_blocks' | 'user_mutes', targetUserId: string) {
    if (!user) return;
    await supabase.from(table).delete().eq('user_id', user.id).eq('target_user_id', targetUserId);
    await load();
  }

  async function submitReport() {
    if (!user || !reportText.trim()) return;
    const { error } = await supabase.from('reports').insert({ reporter_id: user.id, reason: reportText.trim(), status: 'open' });
    setMessage(error ? 'Rapor gönderilemedi.' : 'Rapor moderasyon ekibine gönderildi.');
    if (!error) setReportText('');
  }

  return <section className="mx-auto max-w-xl space-y-4 px-4 py-5 text-slate-900"><div className="flex items-center gap-3"><button onClick={onClose} className="rounded-xl border border-slate-200 px-3 py-2"><ArrowLeft className="h-4 w-4" /></button><h1 className="text-xl font-bold">Gizlilik ve moderasyon</h1></div><div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><h2 className="flex items-center gap-2 font-semibold"><Ban className="h-4 w-4 text-rose-500" /> Engellenen hesaplar</h2>{blocked.length ? blocked.map((item) => <div key={item.id} className="mt-3 flex items-center justify-between text-sm"><span>{item.target?.display_name ?? 'Kullanıcı'}</span><button onClick={() => void remove('user_blocks', item.target_user_id)} className="rounded-lg border px-3 py-1.5">Engeli kaldır</button></div>) : <p className="mt-2 text-sm text-slate-400">Engellenen hesap yok.</p>}</div><div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><h2 className="flex items-center gap-2 font-semibold"><VolumeX className="h-4 w-4 text-amber-500" /> Sessize alınan hesaplar</h2>{muted.length ? muted.map((item) => <div key={item.id} className="mt-3 flex items-center justify-between text-sm"><span>{item.target?.display_name ?? 'Kullanıcı'}</span><button onClick={() => void remove('user_mutes', item.target_user_id)} className="rounded-lg border px-3 py-1.5">Sesi aç</button></div>) : <p className="mt-2 text-sm text-slate-400">Sessize alınan hesap yok.</p>}</div><div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><h2 className="flex items-center gap-2 font-semibold"><Flag className="h-4 w-4 text-sky-500" /> İçerik raporla</h2><textarea value={reportText} onChange={(event) => setReportText(event.target.value)} rows={3} placeholder="Sorunu ve mümkünse gönderi bağlantısını yaz..." className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm" /><button onClick={() => void submitReport()} className="mt-3 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white">Rapor gönder</button>{message && <p className="mt-2 text-sm text-slate-500">{message}</p>}</div><div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900"><ShieldAlert className="mb-2 h-5 w-5" />Güvenlik ve gizlilik kontrolleri yalnızca senin hesabına uygulanır.</div></section>;
}
