import { useEffect, useState } from 'react';
import { ArrowLeft, Search, UserRound } from 'lucide-react';
import { supabase, type Profile } from '@/lib/supabase';
import Avatar from '@/components/Avatar';

type FollowListModalProps = {
  userId: string;
  initialTab: 'followers' | 'following';
  onClose: () => void;
  onProfileClick: (userId: string) => void;
};

type FollowRow = { follower_id?: string; following_id?: string; profile?: Profile | Profile[] | null };

export default function FollowListModal({ userId, initialTab, onClose, onProfileClick }: FollowListModalProps) {
  const [tab, setTab] = useState(initialTab);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const column = tab === 'followers' ? 'follower_id' : 'following_id';
      const relation = tab === 'followers' ? 'profile:profiles!follows_follower_id_fkey(*)' : 'profile:profiles!follows_following_id_fkey(*)';
      const { data } = await supabase.from('follows').select(`${column}, ${relation}`).eq(tab === 'followers' ? 'following_id' : 'follower_id', userId);
      if (active) {
        setProfiles(((data ?? []) as unknown as FollowRow[]).map((row) => Array.isArray(row.profile) ? row.profile[0] : row.profile).filter(Boolean) as Profile[]);
        setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [tab, userId]);

  const filtered = profiles.filter((profile) => `${profile.display_name ?? ''} ${profile.email ?? ''}`.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr')));

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-xl mx-auto min-h-full px-4 py-5">
        <header className="flex items-center gap-3 mb-5">
          <button onClick={onClose} aria-label="Listeyi kapat" className="p-2 -ml-2 rounded-full hover:bg-muted text-foreground"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="font-bold text-xl text-foreground">Bağlantılar</h1>
        </header>
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl mb-4">
          {(['followers', 'following'] as const).map((item) => (
            <button key={item} onClick={() => setTab(item)} className={`py-2 rounded-lg text-sm font-medium transition-colors ${tab === item ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
              {item === 'followers' ? 'Takipçiler' : 'Takip ettikleri'}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted text-muted-foreground mb-4">
          <Search className="w-4 h-4" /><span className="sr-only">Kişi ara</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kişi ara" className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground" />
        </label>
        {loading ? <p className="text-center text-sm text-muted-foreground py-10">Yükleniyor...</p> : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground"><UserRound className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>Henüz kimse yok.</p></div>
        ) : (
          <div className="space-y-1">{filtered.map((profile) => (
            <button key={profile.id} onClick={() => onProfileClick(profile.id)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted text-left transition-colors">
              <Avatar url={profile.avatar_url} id={profile.id} name={profile.display_name ?? 'Kullanıcı'} size="md" />
              <span className="min-w-0"><strong className="block truncate text-sm text-foreground">{profile.display_name ?? 'İsimsiz kullanıcı'}</strong><span className="block truncate text-xs text-muted-foreground">{profile.email ?? 'kullanıcı'}</span></span>
            </button>
          ))}</div>
        )}
      </div>
    </div>
  );
}
