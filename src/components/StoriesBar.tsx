import { useCallback, useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { supabase, type Profile } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type Story = {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  created_at: string;
  expires_at: string;
  profile?: Profile;
};

export default function StoriesBar({ onProfileClick }: { onProfileClick?: (userId: string) => void }) {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Story | null>(null);

  const loadStories = useCallback(async () => {
    const { data } = await supabase
      .from('stories')
      .select('*, profile:profiles!stories_user_id_fkey(*)')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    setStories((data ?? []) as Story[]);
  }, []);

  useEffect(() => { loadStories(); }, [loadStories]);

  async function publishStory(e: React.FormEvent) {
    e.preventDefault();
    if (!user || (!content.trim() && !mediaUrl.trim())) return;
    setSaving(true);
    const { data } = await supabase.from('stories').insert({
      user_id: user.id,
      content: content.trim(),
      media_url: mediaUrl.trim() || null,
    }).select('*, profile:profiles!stories_user_id_fkey(*)').single();
    if (data) setStories((current) => [data as Story, ...current]);
    setContent('');
    setMediaUrl('');
    setOpen(false);
    setSaving(false);
  }

  return (
    <>
      <section className="mb-5 overflow-x-auto" aria-label="Hikâyeler">
        <div className="flex gap-3 min-w-max pb-1">
          <button type="button" onClick={() => setOpen(true)} className="flex w-16 flex-col items-center gap-1.5">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-sky-400 bg-white text-sky-500 shadow-sm"><Plus className="h-5 w-5" /></span>
            <span className="max-w-16 truncate text-xs text-slate-500">Hikâyen</span>
          </button>
          {stories.map((story) => (
            <button key={story.id} type="button" onClick={() => setSelected(story)} className="flex w-16 flex-col items-center gap-1.5">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 p-0.5 shadow-sm"><span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white text-sm font-bold text-slate-700">{story.media_url ? <img src={story.media_url} alt="" className="h-full w-full object-cover" /> : story.profile?.display_name?.[0]?.toUpperCase() ?? '?'}</span></span>
              <span className="max-w-16 truncate text-xs text-slate-500">{story.profile?.display_name ?? 'Kullanıcı'}</span>
            </button>
          ))}
        </div>
      </section>

      {(open || selected) && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setOpen(false); setSelected(null); }}>
        <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">{selected ? 'Hikâye' : 'Yeni hikâye'}</h2><button type="button" onClick={() => { setOpen(false); setSelected(null); }} aria-label="Kapat"><X className="h-5 w-5 text-slate-500" /></button></div>
          {selected ? <div className="space-y-3"><p className="text-sm font-semibold text-slate-800">{selected.profile?.display_name}</p>{selected.media_url && <img src={selected.media_url} alt="Hikâye görseli" className="max-h-80 w-full rounded-xl object-cover" />}<p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{selected.content}</p><p className="text-xs text-slate-400">24 saat içinde kaybolur.</p></div> : <form onSubmit={publishStory} className="space-y-3"><textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} maxLength={300} placeholder="Bugün ne paylaşmak istiyorsun?" className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400" /><input type="url" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="Görsel bağlantısı (isteğe bağlı)" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400" /><button type="submit" disabled={saving || (!content.trim() && !mediaUrl.trim())} className="h-10 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-40">{saving ? 'Paylaşılıyor...' : 'Hikâyeyi paylaş'}</button></form>}
        </div>
      </div>}
    </>
  );
}
