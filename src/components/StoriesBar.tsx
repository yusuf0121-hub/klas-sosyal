import { useCallback, useEffect, useState } from 'react';
import { Plus, X, Heart, Send } from 'lucide-react';
import { uploadStory } from '@/lib/upload';
import { supabase, type Profile } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type Story = {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  created_at: string;
  expires_at: string;
  music_video_id?: string | null;
  music_title?: string | null;
  music_channel?: string | null;
  profile?: Profile;
};

export default function StoriesBar({ onProfileClick }: { onProfileClick?: (userId: string) => void }) {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<Story | null>(null);
  const [reaction, setReaction] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [musicQuery, setMusicQuery] = useState('');
  const [musicResults, setMusicResults] = useState<Array<{ id: string; title: string; channelTitle: string }>>([]);
  const [music, setMusic] = useState<{ id: string; title: string; channelTitle: string } | null>(null);

  const loadStories = useCallback(async () => {
    const now = new Date().toISOString();
    let visibleUserIds: string[] | null = null;
    if (user) {
      const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
      visibleUserIds = [user.id, ...(follows ?? []).map((follow) => follow.following_id)];
    }
    let query = supabase.from('stories').select('*, profile:profiles!stories_user_id_fkey(*)').gt('expires_at', now).order('created_at', { ascending: false });
    if (visibleUserIds) query = query.in('user_id', visibleUserIds);
    const { data } = await query;
    setStories((data ?? []) as Story[]);
  }, [user]);

  useEffect(() => { loadStories(); }, [loadStories]);

  async function handlePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const url = await uploadStory(user.id, file);
    if (url) setMediaUrl(url);
    setUploading(false);
  }

  async function openStory(story: Story) {
    setSelected(story);
    setReaction(null);
    setReply('');
    const { count } = await supabase.from('story_views').select('id', { count: 'exact', head: true }).eq('story_id', story.id);
    setViewerCount(count ?? 0);
    if (user && story.user_id !== user.id) await supabase.from('story_views').upsert({ story_id: story.id, viewer_id: user.id }, { onConflict: 'story_id,viewer_id' });
  }

  async function reactToStory(value: string) {
    if (!selected || !user) return;
    setReaction(value);
    await supabase.from('story_reactions').upsert({ story_id: selected.id, user_id: user.id, reaction: value }, { onConflict: 'story_id,user_id' });
  }

  async function sendStoryReply(event: React.FormEvent) {
    event.preventDefault();
    if (!reply.trim() || !selected || !user) return;
    await supabase.from('story_replies').insert({ story_id: selected.id, user_id: user.id, content: reply.trim() });
    setReply('');
  }

  async function publishStory(e: React.FormEvent) {
    e.preventDefault();
    if (!user || (!content.trim() && !mediaUrl.trim())) return;
    setSaving(true);
    const { data } = await supabase.from('stories').insert({
      user_id: user.id,
      content: content.trim(),
      media_url: mediaUrl.trim() || null,
      music_video_id: music?.id ?? null,
      music_title: music?.title ?? null,
      music_channel: music?.channelTitle ?? null,
    }).select('*, profile:profiles!stories_user_id_fkey(*)').single();
    if (data) setStories((current) => [data as Story, ...current]);
    setContent('');
    setMediaUrl('');
    setMusic(null);
    setMusicResults([]);
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
            <button key={story.id} type="button" onClick={() => void openStory(story)} className="flex w-16 flex-col items-center gap-1.5">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 p-0.5 shadow-sm"><span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white text-sm font-bold text-slate-700">{story.media_url ? <img src={story.media_url} alt="" className="h-full w-full object-cover" /> : story.profile?.display_name?.[0]?.toUpperCase() ?? '?'}</span></span>
              <span className="max-w-16 truncate text-xs text-slate-500">{story.profile?.display_name ?? 'Kullanıcı'}</span>
            </button>
          ))}
        </div>
      </section>

      {(open || selected) && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setOpen(false); setSelected(null); }}>
        <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">{selected ? 'Hikâye' : 'Yeni hikâye'}</h2><button type="button" onClick={() => { setOpen(false); setSelected(null); }} aria-label="Kapat"><X className="h-5 w-5 text-slate-500" /></button></div>
          {selected ? <div className="space-y-3"><p className="text-sm font-semibold text-slate-800">{selected.profile?.display_name}</p>{selected.media_url && <img src={selected.media_url} alt="Hikâye görseli" className="max-h-80 w-full rounded-xl object-cover" />}<p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{selected.content}</p>{selected.music_video_id && <div className="rounded-xl bg-violet-50 p-3"><p className="text-xs font-semibold text-violet-800">Müzik: {selected.music_title}</p><iframe src={`https://www.youtube.com/embed/${selected.music_video_id}?autoplay=1&mute=0&controls=1&playsinline=1`} title={selected.music_title ?? 'Hikâye müziği'} className="mt-2 h-20 w-full rounded-lg" allow="autoplay; encrypted-media" /></div>}<div className="flex items-center justify-between"><div className="flex gap-2">{['❤️', '👏', '😂', '🔥'].map((item) => <button type="button" key={item} onClick={() => void reactToStory(item)} className={`rounded-full border px-3 py-1.5 text-lg ${reaction === item ? 'border-sky-400 bg-sky-50' : 'border-slate-200'}`}>{item}</button>)}</div><span className="text-xs text-slate-400">{viewerCount} görüntülenme</span></div><form onSubmit={sendStoryReply} className="flex gap-2"><input value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Hikâyeye yanıt ver..." className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" /><button type="submit" className="rounded-xl bg-sky-500 px-3 text-white" aria-label="Yanıt gönder"><Send className="h-4 w-4" /></button></form><p className="text-xs text-slate-400">24 saat içinde kaybolur.</p></div> : <form onSubmit={publishStory} className="space-y-3"><textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} maxLength={300} placeholder="Bugün ne paylaşmak istiyorsun?" className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400" /><div className="rounded-xl border border-violet-200 bg-violet-50 p-3"><div className="mb-2 text-sm font-semibold text-violet-800">Hikâyene müzik ekle</div><div className="flex gap-2"><input value={musicQuery} onChange={(event) => setMusicQuery(event.target.value)} placeholder="Şarkı veya sanatçı ara" className="min-w-0 flex-1 rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm" /><button type="button" onClick={async () => { const response = await fetch(`/api/youtube?q=${encodeURIComponent(`${musicQuery} official audio`)}`); const data = await response.json(); setMusicResults((data.results ?? []).slice(0, 4)); }} className="rounded-lg bg-violet-500 px-3 text-sm font-semibold text-white">Ara</button></div>{musicResults.length > 0 && <div className="mt-2 space-y-1">{musicResults.map((item) => <button type="button" key={item.id} onClick={() => { setMusic(item); setMusicResults([]); }} className="block w-full truncate rounded-lg bg-white px-2 py-1.5 text-left text-xs">{item.title} · {item.channelTitle}</button>)}</div>}{music && <p className="mt-2 truncate text-xs text-violet-700">Seçildi: {music.title}</p>}</div><label className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-dashed border-sky-300 bg-sky-50 text-sm font-semibold text-sky-700">{uploading ? 'Fotoğraf yükleniyor...' : mediaUrl ? 'Fotoğraf seçildi' : 'Fotoğraflardan hikâye ekle'}<input type="file" accept="image/*" onChange={handlePhoto} className="sr-only" /></label>{mediaUrl && <img src={mediaUrl} alt="Hikâye önizlemesi" className="max-h-48 w-full rounded-xl object-cover" />}<button type="submit" disabled={saving || (!content.trim() && !mediaUrl.trim())} className="h-10 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-40">{saving ? 'Paylaşılıyor...' : 'Hikâyeyi paylaş'}</button></form>}
        </div>
      </div>}
    </>
  );
}
