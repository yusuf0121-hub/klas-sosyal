import { useEffect, useState } from 'react';
import { Sparkles, UserPlus } from 'lucide-react';
import { supabase, type Profile } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type Props = { onProfileClick: (userId: string) => void };

export default function AccountSuggestions({ onProfileClick }: Props) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadSuggestions() {
      if (!user) return;
      setLoading(true);
      const [{ data: follows }, { data: likedVideoPosts }, { data: allProfiles }] = await Promise.all([
        supabase.from('follows').select('following_id').eq('follower_id', user.id),
        supabase.from('likes').select('post_id').eq('user_id', user.id).limit(50),
        supabase.from('profiles').select('*').neq('id', user.id).limit(100),
      ]);
      const followedIds = new Set((follows ?? []).map((row) => row.following_id));
      const likedPostIds = (likedVideoPosts ?? []).map((row) => row.post_id);
      let reelAuthorIds: string[] = [];
      if (likedPostIds.length) {
        const { data: reels } = await supabase.from('posts').select('user_id').in('id', likedPostIds).not('video_url', 'is', null);
        reelAuthorIds = (reels ?? []).map((row) => row.user_id);
      }
      const reelAuthorSet = new Set(reelAuthorIds);
      const ranked = (allProfiles ?? []).filter((profile) => !followedIds.has(profile.id)).map((profile) => ({
        profile: profile as Profile,
        score: (reelAuthorSet.has(profile.id) ? 5 : 0) + (profile.interests?.length ? 1 : 0),
      })).sort((a, b) => b.score - a.score).slice(0, 6).map((item) => item.profile);
      if (active) { setProfiles(ranked); setFollowing(followedIds); setLoading(false); }
    }
    void loadSuggestions();
    return () => { active = false; };
  }, [user]);

  async function follow(profileId: string) {
    if (!user || following.has(profileId)) return;
    await supabase.from('follows').insert({ follower_id: user.id, following_id: profileId });
    setFollowing((current) => new Set(current).add(profileId));
    setProfiles((current) => current.filter((profile) => profile.id !== profileId));
  }

  if (!user || (!loading && profiles.length === 0)) return null;
  return <section className="mb-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm" aria-labelledby="account-suggestions-title">
    <div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-500" /><h2 id="account-suggestions-title" className="font-semibold text-slate-800">Size önerilerimiz</h2><span className="text-xs text-slate-400">Reels ve takiplerine göre</span></div>
    {loading ? <div className="flex gap-3 overflow-hidden">{[1, 2, 3].map((item) => <div key={item} className="h-24 min-w-28 animate-pulse rounded-xl bg-slate-100" />)}</div> : <div className="flex gap-3 overflow-x-auto pb-1">{profiles.map((profile) => <article key={profile.id} className="min-w-36 rounded-xl border border-slate-100 p-3"><button type="button" onClick={() => onProfileClick(profile.id)} className="w-full text-left"><div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 font-bold text-white">{profile.display_name?.[0]?.toUpperCase() ?? '?'}</div><p className="truncate text-center text-sm font-semibold text-slate-700">{profile.display_name ?? 'Kullanıcı'}</p><p className="mt-1 truncate text-center text-xs text-slate-400">Klas Sosyal kullanıcısı</p></button><button type="button" onClick={() => void follow(profile.id)} className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-sky-500 px-2 py-1.5 text-xs font-semibold text-white"><UserPlus className="h-3.5 w-3.5" /> Takip et</button></article>)}</div>}
  </section>;
}
