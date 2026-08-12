import { useEffect, useRef, useState } from 'react';
import {
  Settings, UserPlus, UserCheck, ArrowLeft, Save, Award, Coins, BadgeCheck,
  X, ShoppingBag, Shield, Crown, Bookmark, Camera, Grid3x3, Gamepad2, Palette,
} from 'lucide-react';
import { supabase, type Profile, type Post } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { timeAgo } from '@/lib/utils';
import { uploadAvatar } from '@/lib/upload';
import Avatar from '@/components/Avatar';
import PostCard from '@/components/PostCard';
import BadgesScreen from '@/screens/BadgesScreen';
import GamesScreen from '@/screens/GamesScreen';
import ThemesScreen from '@/screens/ThemesScreen';
import { Coin } from '@/lib/customIcons';

const COIN_PACKS = [
  { coins: 100, price: '₺9,99', desc: 'Başlangıç paketi' },
  { coins: 500, price: '₺39,99', desc: 'Popüler paket' },
  { coins: 1000, price: '₺69,99', desc: 'En iyi değer' },
  { coins: 5000, price: '₺299,99', desc: 'Premium paket' },
];

/**
 * Alt bar 3 sekmeye indirildiği için Oyun ve Tema alanları
 * profil sekmeleri olarak buraya gömüldü.
 */
type ProfileTab = 'posts' | 'saved' | 'games' | 'themes';

const PROFILE_TABS: { id: ProfileTab; label: string; icon: typeof Grid3x3 }[] = [
  { id: 'posts', label: 'Gönderiler', icon: Grid3x3 },
  { id: 'saved', label: 'Kaydedilenler', icon: Bookmark },
  { id: 'games', label: 'Oyunlar', icon: Gamepad2 },
  { id: 'themes', label: 'Temalar', icon: Palette },
];

type Props = {
  userId: string;
  onBack: () => void;
  onProfileClick: (id: string) => void;
  isAdmin?: boolean;
  onAdminClick?: () => void;
};

export default function ProfileScreen({ userId, onBack, onProfileClick, isAdmin, onAdminClick }: Props) {
  const { user, profile: myProfile, signOut, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editInterests, setEditInterests] = useState('');
  const [editSocialLink, setEditSocialLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);
  const [showCoinStore, setShowCoinStore] = useState(false);
  const [postTab, setPostTab] = useState<ProfileTab>('posts');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwn = user?.id === userId;

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (!active) return;
      setProfile(p as Profile | null);

      const { data: userPosts } = await supabase
        .from('posts')
        .select('*, profile:profiles!posts_user_id_fkey(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!active) return;
      setPosts((userPosts ?? []) as Post[]);

      if (isOwn) {
        const { data: saved } = await supabase
          .from('saved_posts')
          .select('post:posts(*, profile:profiles!posts_user_id_fkey(*))')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (active) setSavedPosts(((saved ?? []).map((s) => s.post as unknown as Post).filter(Boolean)));
      }

      const { count: fc } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId);
      if (active) setFollowerCount(fc ?? 0);
      const { count: fgc } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId);
      if (active) setFollowingCount(fgc ?? 0);
      const { count: bc } = await supabase.from('user_badges').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      if (active) setBadgeCount(bc ?? 0);

      if (user && !isOwn) {
        const { data: f } = await supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', userId).maybeSingle();
        if (active) setIsFollowing(!!f);
      }
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [userId, user, isOwn]);

  async function toggleFollow() {
    if (!user || isOwn) return;
    if (isFollowing) {
      setIsFollowing(false);
      setFollowerCount((c) => c - 1);
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId);
    } else {
      setIsFollowing(true);
      setFollowerCount((c) => c + 1);
      await supabase.from('follows').insert({ follower_id: user.id, following_id: userId });
      await supabase.rpc('ensure_dm', { p_other_user_id: userId });
    }
  }

  function startEdit() {
    setEditName(profile?.display_name ?? '');
    setEditBio(profile?.bio ?? '');
    setEditCity(profile?.city ?? '');
    setEditInterests(profile?.interests?.join(', ') ?? '');
    setEditSocialLink(profile?.social_link ?? '');
    setEditing(true);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const interests = editInterests.split(',').map((s) => s.trim()).filter(Boolean);
    await supabase.from('profiles').update({
      display_name: editName.trim(),
      bio: editBio.trim() || null,
      city: editCity.trim() || null,
      interests: interests.length > 0 ? interests : null,
      social_link: editSocialLink.trim() || null,
    }).eq('id', user.id);
    await refreshProfile();
    setProfile((prev) => prev ? { ...prev, display_name: editName.trim(), bio: editBio.trim() || null, city: editCity.trim() || null, interests: interests.length > 0 ? interests : null, social_link: editSocialLink.trim() || null } : prev);
    setEditing(false);
    setSaving(false);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    const url = await uploadAvatar(user.id, file);
    if (url) {
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
      await refreshProfile();
      setProfile((prev) => prev ? { ...prev, avatar_url: url } : prev);
    }
    setUploadingAvatar(false);
  }

  if (showBadges) return <BadgesScreen onClose={() => setShowBadges(false)} />;

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 pb-24">
        <div className="animate-pulse space-y-4">
          <div className="w-full h-32 bg-slate-100 rounded-2xl" />
          <div className="w-24 h-24 bg-slate-100 rounded-full -mt-12" />
          <div className="w-40 h-6 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 pb-24 text-center">
        <p className="text-slate-400">Kullanıcı bulunamadı.</p>
        <button onClick={onBack} className="mt-4 text-sm text-sky-500 hover:underline">Geri dön</button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-24">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
      <div className="flex items-center gap-3 mb-4">
        {!isOwn && (
          <button onClick={onBack} className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-600 hover:text-slate-900 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-xl font-bold text-slate-900">Profil</h1>
      </div>

      {/* Banner */}
      <div className="relative h-32 bg-gradient-to-br from-sky-400 via-emerald-400 to-teal-400 rounded-2xl mb-0 overflow-hidden">
        {profile.banner_url && <img src={profile.banner_url} alt="" className="w-full h-full object-cover" />}
      </div>

      {/* Profile header */}
      <div className="bg-white rounded-b-2xl border border-slate-100 border-t-0 shadow-sm px-6 pt-0 pb-6 relative">
        <div className="-mt-12 mb-4 relative inline-block">
          <Avatar name={profile.display_name} id={profile.id} url={profile.avatar_url} size="xl" />
          {isOwn && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-7 h-7 bg-sky-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-sky-600 transition-colors disabled:opacity-50"
              title="Avatar değiştir"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          )}
          {uploadingAvatar && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            {editing ? (
              <form onSubmit={saveEdit} className="space-y-3 mt-2">
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-400" placeholder="İsim" />
                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={2} maxLength={160} placeholder="Bio" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-400 resize-none" />
                <input type="text" value={editCity} onChange={(e) => setEditCity(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-400" placeholder="Şehir" />
                <input type="text" value={editInterests} onChange={(e) => setEditInterests(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-400" placeholder="İlgi alanları (virgülle ayır)" />
                <input type="url" value={editSocialLink} onChange={(e) => setEditSocialLink(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-400" placeholder="Sosyal medya linki" />
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 disabled:opacity-50">
                    <Save className="w-4 h-4" /> Kaydet
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-slate-500 rounded-lg hover:bg-slate-50">İptal</button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xl font-bold text-slate-900">{profile.display_name}</h2>
                  {profile.verified && <BadgeCheck className="w-5 h-5 text-sky-500" />}
                  {profile.is_vip && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-[10px] font-bold rounded-full">
                      <Crown className="w-2.5 h-2.5" /> VIP
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400">{timeAgo(profile.created_at)} önce katıldı</p>
                {profile.bio && <p className="text-sm text-slate-600 mt-2">{profile.bio}</p>}
                {profile.city && <p className="text-xs text-slate-400 mt-1">📍 {profile.city}</p>}
                {profile.interests && profile.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {profile.interests.map((tag) => <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{tag}</span>)}
                  </div>
                )}
                {profile.social_link && <a href={profile.social_link} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-500 hover:underline mt-2 inline-block">Sosyal medya linki</a>}
              </>
            )}
          </div>
        </div>

        {!editing && (
          <div className="flex gap-6 pt-4 border-t border-slate-50">
            <div><span className="text-lg font-bold text-slate-900">{posts.length}</span><span className="text-sm text-slate-400 ml-1">gönderi</span></div>
            <div><span className="text-lg font-bold text-slate-900">{followerCount}</span><span className="text-sm text-slate-400 ml-1">takipçi</span></div>
            <div><span className="text-lg font-bold text-slate-900">{followingCount}</span><span className="text-sm text-slate-400 ml-1">takip</span></div>
          </div>
        )}

        {!editing && (
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowBadges(true)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-50 text-amber-700 text-sm font-medium rounded-xl hover:bg-amber-100 transition-colors">
              <Award className="w-4 h-4" /> {badgeCount} Rozet
            </button>
            {isOwn && (
              <button onClick={() => setShowCoinStore(true)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sky-50 text-sky-700 text-sm font-medium rounded-xl hover:bg-sky-100 transition-colors">
                <Coin className="w-4 h-4" /> {profile.coins} Coin
              </button>
            )}
          </div>
        )}

        {!editing && (
          <div className="flex gap-2 mt-3">
            {isOwn ? (
              <>
                <button onClick={startEdit} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-50 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-100 transition-colors">
                  <Settings className="w-4 h-4" /> Düzenle
                </button>
                {isAdmin && (
                  <button onClick={onAdminClick} className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-sm font-medium rounded-xl hover:shadow-md transition-all flex items-center gap-1.5">
                    <Shield className="w-4 h-4" /> Yönetici
                  </button>
                )}
                <button onClick={signOut} className="px-4 py-2.5 bg-rose-50 text-rose-600 text-sm font-medium rounded-xl hover:bg-rose-100 transition-colors">Çıkış</button>
              </>
            ) : (
              <button onClick={toggleFollow} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all ${isFollowing ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-gradient-to-r from-sky-500 to-emerald-500 text-white shadow-sm hover:shadow-md'}`}>
                {isFollowing ? <><UserCheck className="w-4 h-4" /> Takip Ediliyor</> : <><UserPlus className="w-4 h-4" /> Takip Et</>}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Profil sekmeleri (Gönderiler / Kaydedilenler / Oyunlar / Temalar) */}
      {isOwn && (
        <div className="flex gap-1.5 mt-4 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }} role="tablist">
          {PROFILE_TABS.map((t) => {
            const Icon = t.icon;
            const isActive = postTab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setPostTab(t.id)}
                className={`flex-1 shrink-0 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${isActive ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-100'}`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Oyunlar sekmesi */}
      {isOwn && postTab === 'games' && (
        <div className="-mx-4">
          <GamesScreen onProfileClick={onProfileClick} />
        </div>
      )}

      {/* Temalar sekmesi */}
      {isOwn && postTab === 'themes' && (
        <div className="-mx-4">
          <ThemesScreen />
        </div>
      )}

      {/* Gönderiler / Kaydedilenler */}
      <div className={`space-y-4 mt-4 ${isOwn && (postTab === 'games' || postTab === 'themes') ? 'hidden' : ''}`}>
        {postTab === 'saved' && isOwn ? (
          savedPosts.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Henüz kaydedilen gönderi yok.</p>
            </div>
          ) : (
            savedPosts.map((p) => (
              <PostCard key={p.id} post={{ ...p, profile: p.profile ?? undefined }} onProfileClick={onProfileClick} />
            ))
          )
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400">Henüz gönderi yok.</p>
          </div>
        ) : (
          posts.map((p) => (
            <PostCard
              key={p.id}
              post={{ ...p, profile: p.profile ?? (isOwn ? myProfile ?? undefined : undefined) }}
              onProfileClick={onProfileClick}
              onPostDeleted={() => setPosts((prev) => prev.filter((x) => x.id !== p.id))}
            />
          ))
        )}
      </div>

      {/* Coin Store Modal */}
      {showCoinStore && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowCoinStore(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Coin className="w-6 h-6 text-amber-500" />
                <h2 className="text-lg font-bold text-slate-900">Coin Mağazası</h2>
              </div>
              <button onClick={() => setShowCoinStore(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 rounded-xl">
              <Coin className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-semibold text-amber-700">Mevcut: {profile.coins} coin</span>
            </div>
            <div className="space-y-3">
              {COIN_PACKS.map((pack) => (
                <div key={pack.coins} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <Coin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{pack.coins} Coin</p>
                      <p className="text-xs text-slate-400">{pack.desc}</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors">{pack.price}</button>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4 text-center">Coin satın almak için ödeme altyapısının yapılandırılması gerekir.</p>
          </div>
        </div>
      )}
    </div>
  );
}
