import { useState } from 'react';
import { ExternalLink, Play, Youtube } from 'lucide-react';

type Props = {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
};

export default function YouTubeVideoCard({ id, title, channelTitle, thumbnail }: Props) {
  const [playing, setPlaying] = useState(false);

  return <>
    <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <button type="button" onClick={() => setPlaying(true)} className="group relative block aspect-video w-full overflow-hidden bg-slate-950 text-left" aria-label={`${title} videosunu uygulama içinde oynat`}>
        <img src={thumbnail} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        <span className="absolute inset-0 flex items-center justify-center bg-slate-950/10 transition-colors group-hover:bg-slate-950/25"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-rose-600 shadow-lg"><Play className="ml-0.5 h-5 w-5 fill-current" /></span></span>
      </button>
      <div className="p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-900">{title}</h3>
        <div className="mt-2 flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600"><Youtube className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-500">{channelTitle}</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">YouTube</span>
        </div>
      </div>
    </article>
    {playing && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => { if (event.target === event.currentTarget) setPlaying(false); }}>
      <section className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center gap-3 p-4"><div className="min-w-0 flex-1"><h2 className="line-clamp-2 text-sm font-semibold text-slate-900">{title}</h2><p className="mt-1 truncate text-xs text-slate-500">{channelTitle}</p></div><a href={`https://www.youtube.com/watch?v=${encodeURIComponent(id)}`} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-semibold text-slate-600"><ExternalLink className="h-3.5 w-3.5" /> YouTube&apos;da aç</a><button type="button" onClick={() => setPlaying(false)} aria-label="Oynatıcıyı kapat" className="rounded-lg border px-3 py-2 text-sm font-semibold text-slate-600">Kapat</button></header>
        <iframe src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`} title={title} className="aspect-video w-full bg-slate-950" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      </section>
    </div>}
  </>;
}
