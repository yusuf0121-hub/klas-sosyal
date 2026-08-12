import { useEffect, useState } from 'react';
import { Search as SearchIcon, Users, Film, Video } from 'lucide-react';
import { supabase, type Profile, type Post } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import Avatar from '@/components/Avatar';

type Props = {
  onProfileClick: (userId: string) => void;
};

type SearchMode = 'users' | 'videos';

export default function SearchScreen({ onProfileClick }: Props) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('users');
  const [userResults, setUserResults] = useState<Profile[]>([]);
  const [videoResults, setVideoResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggested, setSuggested] = useState<Profile[]>([]);

  useEffect(() => {
    async function loadSuggested() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id ?? '')
        .limit(10);
      setSuggested((data ?? []) as Profile[]);
    }
    loadSuggested();
  }, [user?.id]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setUserResults([]);
      setVideoResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      if (mode === 'users') {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .ilike('display_name', `%${q}%`)
          .limit(20);
        setUserResults((data ?? []) as Profile[]);
      } else {
        const { data } = await supabase
          .from('posts')
          .select('*, profile:profiles!posts_user_id_fkey(*)')
          .not('video_url', 'is', null)
          .ilike('content', `%${q}%`)
          .order('created_at', { ascending: false })
          .limit(20);
        setVideoResults((data ?? []) as Post[]);
      }
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, mode]);

  const showSuggested = !query.trim() && mode === 'users';

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Keşfet</h1>

      {/* Search mode toggle */}
      <div className="flex gap-2 p-1 bg-white border border-slate-100 rounded-xl mb-4 shadow-sm">
        <button
          onClick={() => { setMode('users'); setQuery(''); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'users' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Kullanıcılar
        </button>
        <button
          onClick={() => { setMode('videos'); setQuery(''); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'videos' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Video className="w-4 h-4" />
          Videolar
        </button>
      </div>

      <div className="relative mb-6">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={mode === 'users' ? 'Kullanıcı ara...' : 'Video ara...'}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all shadow-sm"
        />
      </div>

      {showSuggested && (
        <div className="flex items-center gap-2 mb-4 text-slate-400">
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">Önerilen kullanıcılar</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 animate-pulse">
              <div className="w-12 h-12 bg-slate-100 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="w-32 h-4 bg-slate-100 rounded" />
                <div className="w-48 h-3 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : mode === 'users' ? (
        (query.trim() ? userResults : suggested).length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-sm">Sonuç bulunamadı.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(query.trim() ? userResults : suggested).map((p) => (
              <button
                key={p.id}
                onClick={() => onProfileClick(p.id)}
                className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-sky-200 transition-all text-left"
              >
                <Avatar name={p.display_name} id={p.id} url={p.avatar_url} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{p.display_name}</p>
                  {p.bio && <p className="text-xs text-slate-400 truncate mt-0.5">{p.bio}</p>}
                </div>
              </button>
            ))}
          </div>
        )
      ) : videoResults.length === 0 ? (
        <div className="text-center py-16">
          <Film className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            {query.trim() ? 'Video bulunamadı.' : 'Video aramak için yazmaya başla.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {videoResults.map((v) => (
            <button
              key={v.id}
              onClick={() => onProfileClick(v.user_id)}
              className="bg-slate-900 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <video src={v.video_url ?? undefined} muted playsInline className="w-full h-32 object-cover" />
              <div className="p-2">
                <p className="text-white text-xs truncate">{v.content || 'Video'}</p>
                <p className="text-slate-400 text-[10px] mt-0.5 truncate">{v.profile?.display_name}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
