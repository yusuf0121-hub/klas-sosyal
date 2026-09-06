import { useState } from 'react';
import { Home as HomeIcon, Film, RefreshCw } from 'lucide-react';
import { useFeed, useReels } from '@/hooks/useFeed';
import PostCard from '@/components/PostCard';

type Props = {
  onProfileClick: (userId: string) => void;
};

type FeedMode = 'all' | 'reels';

export default function HomeScreen({ onProfileClick }: Props) {
  const { posts, loading, error, reload } = useFeed();
  const { reels, loading: reelsLoading } = useReels();
  const [mode, setMode] = useState<FeedMode>('all');

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
          <div className="space-y-4">
            {reels.map((r) => (
              <div key={r.id} className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg">
                <div className="flex items-center gap-3 p-3">
                  <button onClick={() => onProfileClick(r.user_id)} className="shrink-0">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 flex items-center justify-center text-xs font-bold text-white`}>
                      {r.profile?.display_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  </button>
                  <button onClick={() => onProfileClick(r.user_id)} className="font-semibold text-white text-sm hover:underline">
                    {r.profile?.display_name}
                  </button>
                </div>
                <video src={r.video_url ?? undefined} controls autoPlay loop playsInline className="w-full max-h-[500px] object-cover" />
                <div className="p-3">
                  {r.content && <p className="text-white text-sm mb-2 whitespace-pre-wrap break-words">{r.content}</p>}
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-sm text-slate-300">
                      <HomeIcon className="w-4 h-4" /> {r.like_count ?? 0}
                    </span>
                    <span className="text-sm text-slate-300">{r.comment_count ?? 0} yorum</span>
                  </div>
                </div>
              </div>
            ))}
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
