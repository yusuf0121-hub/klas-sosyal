import { useEffect, useRef, useState } from 'react';
import { Play, RefreshCw, X } from 'lucide-react';

type Video = { id: string; title: string; channelTitle: string; thumbnail: string; url: string };

export default function YouTubeRecommendations() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

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

  useEffect(() => {
    if (!videos.length) return;
    setActiveVideoId((current) => current && videos.some((video) => video.id === current) ? current : videos[0].id);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      const id = visible?.target.getAttribute('data-video-id');
      if (id) setActiveVideoId(id);
    }, { threshold: [0.35, 0.65, 0.9] });
    Object.values(cardRefs.current).forEach((card) => card && observer.observe(card));
    return () => observer.disconnect();
  }, [videos]);
  if (!videos.length && !loading) return null;

  return (
    <>
      <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div><h2 className="font-semibold text-slate-800">YouTube önerileri</h2><p className="text-xs text-slate-400">Videoları Klas Sosyal içinde izle</p></div>
          <button type="button" onClick={() => void load()} aria-label="YouTube önerilerini yenile" className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {videos.map((video) => {
            const isActive = activeVideoId === video.id;
            return (
              <article key={video.id} ref={(element) => { cardRefs.current[video.id] = element; }} data-video-id={video.id} className="group overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                <button type="button" onClick={() => setSelectedVideo(video)} className="relative block aspect-video w-full overflow-hidden text-left" aria-label={`${video.title} videosunu aç`}>
                  {isActive ? <iframe src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1&controls=1&playsinline=1&rel=0`} title={video.title} className="pointer-events-none h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" /> : <><img src={video.thumbnail} alt={`${video.title} video küçük resmi`} className="h-full w-full object-cover transition group-hover:scale-105" /><span className="absolute inset-0 flex items-center justify-center bg-black/20 text-white"><Play className="h-8 w-8" /></span></>}
                </button>
                <div className="p-2"><p className="line-clamp-2 text-xs font-semibold text-slate-700">{video.title}</p><p className="mt-1 truncate text-[11px] text-slate-400">{video.channelTitle} · {isActive ? 'Oynatılıyor (sessiz)' : 'Sırada'}</p></div>
              </article>
            );
          })}
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
