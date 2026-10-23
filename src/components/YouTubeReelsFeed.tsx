import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Play, RefreshCw, Search, Music2, X, Bookmark, Share2, Flag, Bell, Mic } from 'lucide-react';

type Video = { id: string; title: string; channelTitle: string; thumbnail: string };

export default function YouTubeReelsFeed({ mode = 'reels', onBack, searchQuery = '' }: { mode?: 'reels' | 'music' | 'feed'; onBack?: () => void; searchQuery?: string }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'video' | 'music'>(mode === 'music' ? 'music' : 'video');
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<Video | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [creatorVideos, setCreatorVideos] = useState<Video[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [historyIds, setHistoryIds] = useState<string[]>([]);
  const [mediaList, setMediaList] = useState<'recommended' | 'saved' | 'history'>('recommended');
  const [followedCreators, setFollowedCreators] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('Tümü');
  const [hasMore, setHasMore] = useState(true);
  const [watchedTopics, setWatchedTopics] = useState<string[]>([]);
  const pageRef = useRef(0);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  async function load(reset = false) {
    if (loadingRef.current || (!hasMore && !reset)) return;
    loadingRef.current = true; setLoading(true);
    const page = reset ? 0 : pageRef.current;
    try {
      const interests = searchQuery.trim() || (watchedTopics.length ? watchedTopics.join(' ') : 'Türkiye gündem teknoloji spor müzik bilim oyun haber');
      const categoryTerm = categoryFilter === 'Tümü' ? '' : categoryFilter;
      const rotations = mode === 'music' ? ['official music', 'song', 'live music', 'audio'] : mode === 'feed' ? ['belgesel', 'haber', 'teknoloji', 'spor', 'eğitim'] : ['shorts', 'short video', 'youtube shorts', 'viral', 'keşfet'];
      const category = mode === 'reels' ? 'reels' : mode === 'feed' ? 'feed' : 'all';
      const response = await fetch(`/api/youtube?category=${category}&q=${encodeURIComponent(`${interests} ${categoryTerm} ${rotations[page % rotations.length]} ${page + 1}`)}`);
      const data = await response.json(); const incoming = (data.results ?? []) as Video[];
      setVideos((current) => reset ? incoming : [...current, ...incoming.filter((item) => !current.some((old) => old.id === item.id))]);
      pageRef.current = page + 1; setHasMore(incoming.length > 0);
    } finally { loadingRef.current = false; setLoading(false); }
  }

  async function searchMedia() {
    const value = query.trim(); if (!value) return;
    setLoading(true);
    try {
      const suffix = searchMode === 'music' ? ' official music audio' : ' shorts';
      const category = mode === 'reels' ? 'reels' : mode === 'feed' ? 'feed' : 'all';
      const response = await fetch(`/api/youtube?category=${category}&q=${encodeURIComponent(`${value}${suffix}`)}`);
      const data = await response.json(); setSearchResults((data.results ?? []) as Video[]);
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(true); }, [watchedTopics]);
  useEffect(() => {
    const sentinel = sentinelRef.current; if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) void load(); }, { rootMargin: '600px' });
    observer.observe(sentinel); return () => observer.disconnect();
  }, [videos.length, hasMore]);

  async function openCreator(channelTitle: string) {
    setSelectedCreator(channelTitle);
    const response = await fetch(`/api/youtube?q=${encodeURIComponent(`${channelTitle} videos`)}`);
    const data = await response.json();
    setCreatorVideos((data.results ?? []) as Video[]);
  }

  function playVideo(video: Video) {
    setActive((current) => current === video.id ? null : video.id);
    setHistoryIds((current) => [video.id, ...current.filter((id) => id !== video.id)].slice(0, 30));
    if (searchMode === 'video') {
      const topics = video.title.split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 3).slice(0, 3);
      setWatchedTopics((current) => Array.from(new Set([...topics, ...current])).slice(0, 6));
    }
  }

  const renderCard = (video: Video, compact = false) => { const initials = video.channelTitle.trim().slice(0, 2).toUpperCase(); return <article key={video.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${compact ? '' : 'mx-auto w-full max-w-md'}`}><div className="flex items-center gap-3 border-b px-3 py-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-400 text-xs font-bold text-white">{initials || 'KS'}</div><div className="min-w-0 flex-1"><button type="button" onClick={() => void openCreator(video.channelTitle)} title={`${video.channelTitle} profilini görüntüle`} className="flex min-w-0 items-center gap-1 text-left"><span className="truncate text-sm font-semibold text-slate-900">{video.channelTitle || 'Klas Sosyal üreticisi'}</span><BadgeCheck className="h-4 w-4 shrink-0 text-rose-500" aria-label="Doğrulanmış içerik üreticisi" /></button><div className="flex items-center gap-2"><button type="button" onClick={() => setFollowedCreators((current) => current.includes(video.channelTitle) ? current.filter((name) => name !== video.channelTitle) : [...current, video.channelTitle])} className="text-[11px] font-semibold text-rose-500">{followedCreators.includes(video.channelTitle) ? 'Takiptesin' : 'Takip et'}</button><p className="text-[11px] text-slate-500">Klas Sosyal içerik üreticisi</p></div></div></div><button type="button" className={`relative block w-full bg-slate-950 text-left ${compact ? 'aspect-video' : 'aspect-[9/14]'}`} onClick={() => compact && searchMode === 'music' ? setSelectedMusic(video) : playVideo(video)} aria-label={`${video.title} ${searchMode === 'music' ? 'müziğini dinle' : 'videosunu oynat'}`}>{active === video.id ? <iframe src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1&playsinline=1&rel=0`} title={video.title} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" /> : <><img src={video.thumbnail} alt={`${video.title} küçük resmi`} className="h-full w-full object-cover" /><span className="absolute inset-0 flex items-center justify-center bg-black/25 text-white"><Play className="h-12 w-12" /></span></>}</button><div className="p-3"><p className="font-semibold text-slate-900">{video.title}</p><div className="mt-3 flex items-center gap-3"><button type="button" onClick={() => setSavedIds((current) => current.includes(video.id) ? current.filter((id) => id !== video.id) : [...current, video.id])} className={`flex items-center gap-1 text-xs font-semibold ${savedIds.includes(video.id) ? 'text-amber-500' : 'text-slate-500'}`}><Bookmark className="h-4 w-4" fill={savedIds.includes(video.id) ? 'currentColor' : 'none'} /> {savedIds.includes(video.id) ? 'Kaydedildi' : 'Kaydet'}</button><button type="button" onClick={() => void navigator.share?.({ title: video.title, url: `https://www.youtube.com/watch?v=${video.id}` })} className="text-slate-500" aria-label="Paylaş"><Share2 className="h-4 w-4" /></button><button type="button" onClick={() => window.alert('İçerik bildirimin alındı.')} className="ml-auto text-slate-400" aria-label="İçeriği bildir"><Flag className="h-4 w-4" /></button></div><p className="mt-1 text-xs text-slate-500">{video.channelTitle} · {searchMode === 'music' ? 'Müzik' : 'Reels'}</p></div></article>; }

  return <section className="space-y-4" aria-label="Klas Sosyal Reels"><div className="flex items-start justify-between"><div className="flex items-start gap-3">{onBack && <button type="button" onClick={onBack} className="rounded-xl border px-3 py-2 text-sm font-semibold text-slate-600">Tümü</button>}<div><p className="text-xs font-semibold uppercase tracking-wider text-rose-500">{mode === 'music' ? 'Müzikler' : mode === 'feed' ? 'Videolar' : 'Reels'}</p><h2 className="text-xl font-bold">{mode === 'music' ? 'Müzik keşfet ve dinle' : mode === 'feed' ? 'Ana akış videoları' : 'Sana özel Reels'}</h2><p className="text-sm text-slate-500">{mode === 'music' ? 'Şarkı ve sanatçı ara, müzikleri Klas Sosyal içinde dinle.' : 'İzlediklerine göre yenilenen Klas Sosyal akışı.'}</p></div></div><button type="button" onClick={() => void load(true)} aria-label="Reels yenile" className="rounded-xl border p-2"><RefreshCw className={loading ? 'animate-spin' : ''} /></button></div>
    {mode === 'music' && <div className="rounded-2xl border bg-white p-3 shadow-sm">{mode === 'music' && <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-violet-700"><Music2 className="h-4 w-4" /> Müzik arama alanı</div>}<div className="flex gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) void searchMedia(); }} placeholder={mode === 'music' ? 'Şarkı veya sanatçı ara' : searchMode === 'music' ? 'Şarkı veya sanatçı ara' : 'YouTube videosu ara'} className="min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm" /><button type="button" onClick={() => void searchMedia()} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Ara</button><button type="button" onClick={() => { const SpeechRecognition = (window as Window & { webkitSpeechRecognition?: new () => { lang: string; start: () => void; onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void } }).webkitSpeechRecognition; if (!SpeechRecognition) return; const recognition = new SpeechRecognition(); recognition.lang = 'tr-TR'; recognition.onresult = (event) => setQuery(event.results[0][0].transcript); recognition.start(); }} className="rounded-xl border px-3 py-2 text-slate-600" aria-label="Sesli ara"><Mic className="h-4 w-4" /></button></div>{searchResults.length > 0 && <div className="mt-3 grid gap-3 sm:grid-cols-2">{searchResults.map((video) => renderCard(video, true))}</div>}</div>}
    {selectedCreator && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4" role="dialog" aria-modal="true"><div className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-white"><div className="flex items-center gap-3 border-b p-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-400 text-lg font-bold text-white">{selectedCreator.slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-1"><h3 className="truncate text-lg font-bold">{selectedCreator}</h3><BadgeCheck className="h-5 w-5 text-rose-500" /></div><p className="text-sm text-slate-500">Klas Sosyal içerik üreticisi · YouTube’dan katıldı</p></div><button type="button" onClick={() => setSelectedCreator(null)} aria-label="Profili kapat"><X /></button></div><div className="grid gap-3 p-4 sm:grid-cols-2">{creatorVideos.map((video) => <button type="button" key={video.id} onClick={() => { setSelectedCreator(null); playVideo(video); }} className="overflow-hidden rounded-xl border text-left"><img src={video.thumbnail} alt="" className="aspect-video w-full object-cover" /><p className="line-clamp-2 p-2 text-sm font-semibold">{video.title}</p></button>)}{creatorVideos.length === 0 && <p className="col-span-full py-8 text-center text-sm text-slate-500">Üreticinin videoları yükleniyor...</p>}</div></div></div>}
    {selectedMusic && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white"><div className="flex items-center justify-between p-3"><strong className="truncate">{selectedMusic.title}</strong><button type="button" onClick={() => setSelectedMusic(null)} aria-label="Müzik oynatıcıyı kapat"><X /></button></div><iframe src={`https://www.youtube.com/embed/${selectedMusic.id}?autoplay=1&rel=0`} title={selectedMusic.title} className="aspect-video w-full" allow="autoplay; encrypted-media" /></div></div>}
    <div className="flex gap-2 overflow-x-auto pb-1">{['Tümü', 'Haber', 'Spor', 'Teknoloji', 'Oyun', 'Eğitim', 'Müzik'].map((category) => <button type="button" key={category} onClick={() => { setCategoryFilter(category); pageRef.current = 0; setHasMore(true); void load(true); }} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${categoryFilter === category ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-200 text-slate-500'}`}>{category}</button>)}</div><div className="flex gap-2 overflow-x-auto rounded-2xl border bg-white p-1"><button type="button" onClick={() => setMediaList('recommended')} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold ${mediaList === 'recommended' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>Önerilen</button><button type="button" onClick={() => setMediaList('saved')} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold ${mediaList === 'saved' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>Kaydedilenler ({savedIds.length})</button><button type="button" onClick={() => setMediaList('history')} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold ${mediaList === 'history' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>Geçmiş ({historyIds.length})</button></div><div className="space-y-5">{(mediaList === 'recommended' ? videos : videos.filter((video) => (mediaList === 'saved' ? savedIds : historyIds).includes(video.id))).map((video) => renderCard(video))}</div><div ref={sentinelRef} className="flex min-h-16 items-center justify-center text-sm text-slate-500">{loading ? 'Daha fazla içerik yükleniyor...' : !hasMore ? 'Şimdilik tüm Reels içeriklerini gördün.' : ''}</div></section>;
}
