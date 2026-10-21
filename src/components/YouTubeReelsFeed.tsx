import { useEffect, useState } from 'react';
import { Play, RefreshCw } from 'lucide-react';

type Video = { id: string; title: string; channelTitle: string; thumbnail: string };

export default function YouTubeReelsFeed() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function load() {
    setLoading(true);
    try { const response = await fetch('/api/youtube?q=Türkiye müzik teknoloji spor keşfet'); const data = await response.json(); setVideos(data.results ?? []); } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  return <section className="space-y-4" aria-label="Klas Sosyal Reels"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-rose-500">Reels</p><h2 className="text-xl font-bold">Sana özel akış</h2><p className="text-sm text-slate-500">Klas Sosyal&apos;de paylaşılmış gibi izleyebileceğin kısa videolar.</p></div><button type="button" onClick={() => void load()} aria-label="Reels yenile" className="rounded-xl border p-2"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></div><div className="space-y-5">{videos.map((video) => <article key={video.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm"><button type="button" className="relative block aspect-[9/14] w-full bg-slate-950 text-left" onClick={() => setActive(active === video.id ? null : video.id)} aria-label={`${video.title} videosunu oynat`}>{active === video.id ? <iframe src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1&playsinline=1&rel=0`} title={video.title} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" /> : <><img src={video.thumbnail} alt={`${video.title} küçük resmi`} className="h-full w-full object-cover" /><span className="absolute inset-0 flex items-center justify-center bg-black/25 text-white"><Play className="h-12 w-12" /></span></>}</button><div className="p-3"><p className="font-semibold">{video.title}</p><p className="mt-1 text-xs text-slate-500">{video.channelTitle} · Reels</p></div></article>)}</div></section>;
}
