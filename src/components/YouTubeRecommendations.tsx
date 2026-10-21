import { useEffect, useState } from 'react';
import { Play, RefreshCw, X } from 'lucide-react';

type Video = { id: string; title: string; channelTitle: string; thumbnail: string; url: string };

export default function YouTubeRecommendations() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/youtube?q=Türkiye gündem teknoloji spor');
      const data = await response.json() as { results?: Video[] };
      setVideos((data.results ?? []).slice(0, 4));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);
  if (!videos.length && !loading) return null;

  return (
    <>
      <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div><h2 className="font-semibold text-slate-800">YouTube önerileri</h2><p className="text-xs text-slate-400">Videoları Klas Sosyal içinde izle</p></div>
          <button type="button" onClick={() => void load()} aria-label="YouTube önerilerini yenile" className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {videos.map((video) => (
            <button key={video.id} type="button" onClick={() => setSelectedVideo(video)} className="group overflow-hidden rounded-xl border border-slate-100 text-left">
              <div className="relative"><img src={video.thumbnail} alt={`${video.title} video küçük resmi`} className="aspect-video w-full object-cover transition group-hover:scale-105" /><span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white transition group-hover:bg-black/30"><Play className="h-8 w-8 opacity-0 transition group-hover:opacity-100" /></span></div>
              <div className="p-2"><p className="line-clamp-2 text-xs font-semibold text-slate-700">{video.title}</p><p className="mt-1 truncate text-[11px] text-slate-400">{video.channelTitle}</p></div>
            </button>
          ))}
        </div>
      </section>
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label="Video oynatıcı" onClick={() => setSelectedVideo(null)}>
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-slate-950 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 p-3 text-white"><p className="truncate text-sm font-semibold">{selectedVideo.title}</p><button type="button" onClick={() => setSelectedVideo(null)} aria-label="Videoyu kapat"><X className="h-5 w-5" /></button></div>
            <div className="aspect-video w-full"><iframe src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&rel=0`} title={selectedVideo.title} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>
          </div>
        </div>
      )}
    </>
  );
}
