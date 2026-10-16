import { useEffect, useState } from 'react';
import { Play, RefreshCw } from 'lucide-react';

type Video = { id: string; title: string; channelTitle: string; thumbnail: string; url: string };

export default function YouTubeRecommendations() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/youtube?q=Türkiye gündem teknoloji spor');
      const data = await response.json() as { results?: Video[] };
      setVideos((data.results ?? []).slice(0, 4));
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);
  if (!videos.length && !loading) return null;
  return <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><div><h2 className="font-semibold text-slate-800">YouTube önerileri</h2><p className="text-xs text-slate-400">İlgi alanlarına göre videolar</p></div><button type="button" onClick={() => void load()} aria-label="YouTube önerilerini yenile" className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></div><div className="grid grid-cols-2 gap-3">{videos.map((video) => <a key={video.id} href={video.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-slate-100"><img src={video.thumbnail} alt="" className="aspect-video w-full object-cover transition group-hover:scale-105" /><div className="p-2"><p className="line-clamp-2 text-xs font-semibold text-slate-700">{video.title}</p><p className="mt-1 truncate text-[11px] text-slate-400">{video.channelTitle}</p></div></a>)}</div><div className="mt-3 flex items-center gap-1 text-[11px] text-slate-400"><Play className="h-3 w-3" /> YouTube üzerinden açılır</div></section>;
}
