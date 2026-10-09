import { useEffect, useRef, useState } from 'react';
import { Home as HomeIcon, Film, RefreshCw, Heart, MessageCircle, Share2, Bookmark, Send, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useFeed, useReels } from '@/hooks/useFeed';
import PostCard from '@/components/PostCard';
import StoriesBar from '@/components/StoriesBar';
import CommunityLeaderboard from '@/components/CommunityLeaderboard';

type Props = {
  onProfileClick: (userId: string) => void;
  onCreateClick?: () => void;
};

type FeedMode = 'all' | 'reels';

export default function HomeScreen({ onProfileClick, onCreateClick }: Props) {
  const { user } = useAuth();
  const { posts, loading, error, reload } = useFeed();
  const { reels, loading: reelsLoading, loadingMore, hasMore, loadMore } = useReels();
  const [mode, setMode] = useState<FeedMode>('all');
  const reelsEndRef = useRef<HTMLDivElement>(null);
  const [localReels, setLocalReels] = useState(reels);
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
    <div className="max-w-xl mx-auto px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-4">
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

      <StoriesBar onProfileClick={onProfileClick} />
      <button type="button" onClick={onCreateClick} className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-sm transition hover:border-sky-200 hover:shadow-md"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 text-white"><Plus className="h-5 w-5" /></div><div><p className="text-sm font-semibold text-slate-700">Video veya reels paylaş</p><p className="text-xs text-slate-400">Fotoğraf, video, GIF veya müzik ekle</p></div><Send className="ml-auto h-4 w-4 text-slate-400" /></button>
      <CommunityLeaderboard />
    
      {/* Feed mode toggle */}
      <div className="flex gap-2 p-1 bg-white border border-slate-100 rounded-xl mb-5 shadow-sm">
        <button
          onClick={() => setMode('all')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <HomeIcon className="w-4 h-4" />
          Tümü
        </button>
        <button
          onClick={() => setMode('reels')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'reels' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Film className="w-4 h-4" />
          Reels
        </button>
      </div>

      {mode === 'reels' ? (
        reelsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-900 rounded-2xl animate-pulse h-80" />
            ))}
          </div>
        ) : reels.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
              <Film className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-700">Henüz reels yok</h3>
            <p className="text-sm text-slate-400 mt-1">Video paylaşan ilk kişi sen ol!</p>
          </div>
        ) : (
          <div className="space-y-4 snap-y snap-mandatory max-h-[calc(100vh-180px)] overflow-y-auto overscroll-contain rounded-2xl">
            {localReels.map((r) => (
              <article key={r.id} className="relative overflow-hidden rounded-2xl bg-slate-900 shadow-lg snap-start">
                <div className="flex items-center gap-3 p-3"><button onClick={() => onProfileClick(r.user_id)} className="shrink-0"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 text-sm font-bold text-white">{r.profile?.display_name?.[0]?.toUpperCase() ?? '?'}</div></button><div className="min-w-0"><button onClick={() => onProfileClick(r.user_id)} className="font-semibold text-white text-sm hover:underline">{r.profile?.display_name ?? 'Kullanıcı'}</button><p className="text-xs text-slate-400">Reels videosu</p></div></div>
                <video src={r.video_url ?? undefined} controls autoPlay loop playsInline className="w-full max-h-[560px] object-cover" />
                <div className="flex items-center justify-between gap-2 border-t border-white/10 p-3"><div className="flex items-center gap-4"><button type="button" onClick={() => void toggleReelLike(r.id, Boolean(r.liked_by_me))} className={`flex items-center gap-1.5 text-sm ${r.liked_by_me ? 'text-rose-400' : 'text-slate-300'}`}><Heart className="h-5 w-5" fill={r.liked_by_me ? 'currentColor' : 'none'} /> {r.like_count ?? 0}</button><button type="button" className="flex items-center gap-1.5 text-sm text-slate-300"><MessageCircle className="h-5 w-5" /> {r.comment_count ?? 0}</button><button type="button" onClick={() => void shareReel(r.id)} className="text-slate-300" aria-label="Reels paylaş"><Share2 className="h-5 w-5" /></button></div><button type="button" onClick={() => void saveReel(r.id, Boolean(r.saved_by_me))} className={r.saved_by_me ? 'text-amber-400' : 'text-slate-300'} aria-label="Reels kaydet"><Bookmark className="h-5 w-5" fill={r.saved_by_me ? 'currentColor' : 'none'} /></button></div>
                <div className="px-3 pb-4">{r.content && <p className="text-sm text-white whitespace-pre-wrap break-words">{r.content}</p>}<p className="mt-2 text-xs text-slate-400">{r.profile?.display_name ?? 'Kullanıcı'} tarafından paylaşıldı</p></div>
              </article>
            ))}
            <div ref={reelsEndRef} className="h-12 flex items-center justify-center" aria-live="polite">
              {loadingMore && <span className="text-xs text-slate-400">Yeni reelsler yükleniyor...</span>}
              {!hasMore && reels.length > 0 && <span className="text-xs text-slate-400">Şimdilik tüm reelsleri gördün.</span>}
            </div>
          </div>
        )
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
          <p className="text-sm text-slate-400 mt-1">İlk gönderiyi sen paylaş!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onProfileClick={onProfileClick} onPostDeleted={reload} />
          ))}
        </div>
      )}
    </div>
  );
}
