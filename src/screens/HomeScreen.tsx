import { useEffect, useRef, useState } from 'react';
import { Home as HomeIcon, Film, Music2, Radio, RefreshCw, Heart, MessageCircle, Share2, Bookmark, Send, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useFeed, useReels } from '@/hooks/useFeed';
import PostCard from '@/components/PostCard';
import StoriesBar from '@/components/StoriesBar';
import CommunityLeaderboard from '@/components/CommunityLeaderboard';
import AccountSuggestions from '@/components/AccountSuggestions';
import YouTubeReelsFeed from '@/components/YouTubeReelsFeed';

type Props = {
  onProfileClick: (userId: string) => void;
  onCreateClick?: () => void;
  onLiveClick?: () => void;
};

type FeedMode = 'all' | 'reels' | 'music';

export default function HomeScreen({ onProfileClick, onCreateClick, onLiveClick }: Props) {
  const { user } = useAuth();
  const { posts, loading, error, reload } = useFeed();
  const { reels, loading: reelsLoading, loadingMore, hasMore, loadMore } = useReels();
  const [mode, setMode] = useState<FeedMode>('all');
  const reelsEndRef = useRef<HTMLDivElement>(null);
  const speedTimer = useRef<number | null>(null);
  const [localReels, setLocalReels] = useState(reels);
  const [speedingReel, setSpeedingReel] = useState<string | null>(null);
  const [feedSearch, setFeedSearch] = useState('');

  const isReelsMode = () => mode === 'reels';
  const isMediaMode = () => mode !== 'all';

  function startReelSpeed(event: React.PointerEvent<HTMLElement>, reelId: string) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const isSide = event.clientX - bounds.left < 88 || bounds.right - event.clientX < 88;
    if (!isSide) return;
    const video = event.currentTarget.querySelector('video');
    if (!video) return;
    speedTimer.current = window.setTimeout(() => { video.playbackRate = 2; setSpeedingReel(reelId); }, 260);
  }

  function stopReelSpeed(event: React.PointerEvent<HTMLElement>) {
    if (speedTimer.current) window.clearTimeout(speedTimer.current);
    const video = event.currentTarget.querySelector('video');
    if (video) video.playbackRate = 1;
    setSpeedingReel(null);
  }

  function likeFromDoubleTap(reelId: string, liked: boolean) {
    if (!liked) void toggleReelLike(reelId, false);
  }
  useEffect(() => setLocalReels(reels), [reels]);

  async function toggleReelLike(reelId: string, liked: boolean) {
    if (!user) return;
    if (liked) await supabase.from('likes').delete().eq('post_id', reelId).eq('user_id', user.id);
    else await supabase.from('likes').insert({ post_id: reelId, user_id: user.id });
    setLocalReels((items) => items.map((item) => item.id === reelId ? { ...item, liked_by_me: !liked, like_count: Math.max(0, (item.like_count ?? 0) + (liked ? -1 : 1)) } : item));
  }

  async function saveReel(reelId: string, saved: boolean) {
    if (!user) return;
    if (saved) await supabase.from('saved_posts').delete().eq('post_id', reelId).eq('user_id', user.id);
    else await supabase.from('saved_posts').insert({ post_id: reelId, user_id: user.id });
    setLocalReels((items) => items.map((item) => item.id === reelId ? { ...item, saved_by_me: !saved } : item));
  }

  async function shareReel(reelId: string) {
    if (navigator.share) await navigator.share({ title: 'Klas Sosyal Reels', url: `${window.location.origin}/?post=${reelId}` });
    else await navigator.clipboard?.writeText(`${window.location.origin}/?post=${reelId}`);
    if (user) await supabase.from('shares').insert({ post_id: reelId, user_id: user.id });
  }

  useEffect(() => {
    if (mode !== 'reels' || !reelsEndRef.current) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) loadMore(); }, { rootMargin: '500px' });
    observer.observe(reelsEndRef.current);
    return () => observer.disconnect();
  }, [loadMore, mode, reels.length]);

  return (
    <div className={isReelsMode() ? 'fixed inset-0 z-30 overflow-hidden bg-black' : 'mx-auto max-w-xl px-4 py-6 pb-24'}>
      <div className={isReelsMode() ? 'absolute left-4 right-4 top-4 z-20' : 'mb-4 flex items-center justify-between'}>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Akış</h1>
          <p className="text-sm text-slate-400">Son gönderiler</p>
        </div>
        <button
          onClick={reload}
          className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-500 hover:text-sky-500 hover:border-sky-200 transition-all"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {mode === 'all' && <><div className="mb-4 flex gap-2"><button type="button" onClick={onLiveClick} className="flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white"><Radio className="h-4 w-4" />Canlı yayın aç</button></div><div className="mb-4 relative"><input value={feedSearch} onChange={(event) => setFeedSearch(event.target.value)} placeholder="Kullanıcı, video veya içerik ara..." className="w-full rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-sky-300" aria-label="Ana akışta ara" /></div><StoriesBar onProfileClick={onProfileClick} />
      <AccountSuggestions onProfileClick={onProfileClick} />
      <button type="button" onClick={onCreateClick} className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-sm transition hover:border-sky-200 hover:shadow-md"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-white shadow-md shadow-cyan-500/25"><img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-OTzNTsYYiW0eTD6Pm4ME6sUB961RFi.png" alt="" className="h-6 w-6 rounded-full object-cover [filter:invert(1)] [mix-blend-mode:screen]" /></div><div><p className="text-sm font-semibold text-slate-700">Video veya reels paylaş</p><p className="text-xs text-slate-400">Fotoğraf, video, GIF veya müzik ekle</p></div><Send className="ml-auto h-4 w-4 text-slate-400" /></button>
      <CommunityLeaderboard />
      <div className="mb-5 flex gap-2 rounded-xl border border-slate-100 bg-white p-1 shadow-sm">
        <button type="button" onClick={() => setMode('all')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}><HomeIcon className="w-4 h-4" />Tümü</button>
        <button type="button" onClick={() => setMode('reels')} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700"><Film className="w-4 h-4" />Reels</button>
        <button type="button" onClick={() => setMode('music')} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700"><Music2 className="w-4 h-4" />Müzikler</button>
      </div>
      <YouTubeReelsFeed mode="feed" searchQuery={feedSearch} />
      </>}



      {isMediaMode() ? (
        <YouTubeReelsFeed mode={mode === 'music' ? 'music' : 'reels'} onBack={() => setMode('all')} />
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="w-32 h-4 bg-slate-100 rounded" />
                  <div className="w-48 h-3 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="mt-3 w-full h-32 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center">
          <p className="text-rose-600 text-sm">{error}</p>
          <button onClick={reload} className="mt-3 text-sm font-medium text-rose-600 hover:underline">
            Tekrar dene
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
            <HomeIcon className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700">Henüz gönderi yok</h3>
          <p className="text-sm text-slate-400 mt-1">��lk gönderiyi sen paylaş!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.filter((p) => !feedSearch.trim() || `${p.content ?? ''} ${p.profile?.display_name ?? ''}`.toLocaleLowerCase('tr-TR').includes(feedSearch.toLocaleLowerCase('tr-TR'))).map((p) => (
            <PostCard key={p.id} post={p} onProfileClick={onProfileClick} onPostDeleted={reload} />
          ))}
        </div>
      )}
    </div>
  );
}
