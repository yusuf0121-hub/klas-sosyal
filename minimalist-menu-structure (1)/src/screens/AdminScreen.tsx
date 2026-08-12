import { useEffect, useState } from 'react';
import {
  Shield, Users, FileText, Gamepad2, Trash2, Search, BadgeCheck,
  Coins, ArrowLeft as ArrowLeftIcon, TrendingUp, MessageSquare, X, Crown,
  Flag, Ban, Undo2, CheckCircle2, BarChart3,
} from 'lucide-react';
import { supabase, type Profile, type Game } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Coin } from '@/lib/customIcons';
import Avatar from '@/components/Avatar';

type Post = {
  id: string;
  content: string | null;
  user_id: string;
  created_at: string;
};

type Report = {
  id: string;
  reporter_id: string;
  post_id: string | null;
  reported_user_id: string | null;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reporter?: Profile;
  post?: Post;
  reported_user?: Profile;
};

type Tab = 'overview' | 'users' | 'posts' | 'games' | 'reports';

export default function AdminScreen({ onBack }: { onBack: () => void }) {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [users, setUsers] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [postAuthors, setPostAuthors] = useState<Record<string, Profile>>({});
  const [gameCreators, setGameCreators] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ users: 0, posts: 0, games: 0, messages: 0 });
  const [reports, setReports] = useState<Report[]>([]);
  const [reportProfiles, setReportProfiles] = useState<Record<string, Profile>>({});
  const [reportPosts, setReportPosts] = useState<Record<string, Post>>({});

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [usersRes, postsRes, gamesRes, msgCount, reportsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('posts').select('id, content, user_id, created_at').order('created_at', { ascending: false }).limit(100),
      supabase.from('games').select('*').order('created_at', { ascending: false }),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(50),
    ]);

    setUsers(usersRes.data ?? []);
    setPosts(postsRes.data ?? []);
    setGames(gamesRes.data ?? []);
    setReports((reportsRes.data ?? []) as Report[]);
    setStats({
      users: usersRes.data?.length ?? 0,
      posts: postsRes.data?.length ?? 0,
      games: gamesRes.data?.length ?? 0,
      messages: msgCount.count ?? 0,
    });
    const authorIds = [...new Set((postsRes.data ?? []).map((p) => p.user_id))] as string[];
    const creatorIds = [...new Set((gamesRes.data ?? []).map((g) => g.created_by).filter(Boolean))] as string[];
    const allIds = [...new Set([...authorIds, ...creatorIds])];
    if (allIds.length > 0) {
      const { data: profs } = await supabase.from('profiles').select('*').in('id', allIds);
      const map: Record<string, Profile> = {};
      (profs ?? []).forEach((p) => { map[p.id] = p; });
      setPostAuthors(map);
      setGameCreators(map);
    }

    // Load profiles/posts for reports
    const reportUserIds = [...new Set((reportsRes.data ?? []).flatMap((r) => [r.reporter_id, r.reported_user_id].filter(Boolean) as string[]))] as string[];
    const reportPostIds = [...new Set((reportsRes.data ?? []).map((r) => r.post_id).filter(Boolean) as string[])];
    if (reportPostIds.length > 0) {
      const { data: rPosts } = await supabase.from('posts').select('id, content, user_id, created_at').in('id', reportPostIds);
      const pMap: Record<string, Post> = {};
      (rPosts ?? []).forEach((p) => { pMap[p.id] = p as Post; });
      setReportPosts(pMap);
    }
    if (reportUserIds.length > 0) {
      const { data: rProfs } = await supabase.from('profiles').select('*').in('id', reportUserIds);
      const rpMap: Record<string, Profile> = {};
      (rProfs ?? []).forEach((p) => { rpMap[p.id] = p; });
      setReportProfiles(rpMap);
    }
    setLoading(false);
  }

  async function toggleVerify(user: Profile) {
    await supabase.from('profiles').update({ verified: !user.verified }).eq('id', user.id);
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, verified: !u.verified } : u));
  }

  async function addCoins(user: Profile, amount: number) {
    const newCoins = (user.coins ?? 0) + amount;
    await supabase.from('profiles').update({ coins: Math.max(0, newCoins) }).eq('id', user.id);
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, coins: Math.max(0, newCoins) } : u));
  }

  async function toggleVip(user: Profile) {
    const newVip = !user.is_vip;
    await supabase.rpc('admin_set_vip', { p_user_id: user.id, p_is_vip: newVip });
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_vip: newVip } : u));
  }

  async function banUser(user: Profile) {
    const reason = prompt('Engelleme nedeni:', 'Kurallara uymayan davranış');
    if (!reason) return;
    await supabase.rpc('admin_ban_user', { p_user_id: user.id, p_reason: reason, p_banned_until: null });
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_banned: true, ban_reason: reason } : u));
  }

  async function unbanUser(user: Profile) {
    await supabase.rpc('admin_unban_user', { p_user_id: user.id });
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_banned: false, ban_reason: null, banned_until: null } : u));
  }

  async function resolveReport(reportId: string, status: 'resolved' | 'dismissed') {
    await supabase.rpc('admin_resolve_report', { p_report_id: reportId, p_status: status });
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status } : r));
  }

  async function deletePost(id: string) {
    await supabase.from('posts').delete().eq('id', id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  async function deleteGame(id: string) {
    await supabase.from('games').delete().eq('id', id);
    setGames((prev) => prev.filter((g) => g.id !== id));
  }

  const filteredUsers = users.filter((u) =>
    u.display_name.toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Yönetici Paneli</h1>
              <p className="text-xs text-slate-400">{profile?.display_name}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-white rounded-xl border border-slate-100 mb-6 overflow-x-auto">
          {([
            { id: 'overview' as Tab, label: 'Genel', icon: TrendingUp },
            { id: 'users' as Tab, label: 'Kullanıcılar', icon: Users },
            { id: 'posts' as Tab, label: 'Gönderiler', icon: FileText },
            { id: 'games' as Tab, label: 'Oyunlar', icon: Gamepad2 },
            { id: 'reports' as Tab, label: 'Şikayetler', icon: Flag },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Overview */}
            {tab === 'overview' && (
              <div className="grid grid-cols-2 gap-4">
                <StatCard icon={Users} label="Kullanıcılar" value={stats.users} color="from-sky-400 to-blue-500" />
                <StatCard icon={FileText} label="Gönderiler" value={stats.posts} color="from-emerald-400 to-teal-500" />
                <StatCard icon={Gamepad2} label="Oyunlar" value={stats.games} color="from-violet-400 to-purple-500" />
                <StatCard icon={MessageSquare} label="Mesajlar" value={stats.messages} color="from-amber-400 to-orange-500" />
              </div>
            )}

            {/* Users */}
            {tab === 'users' && (
              <div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Kullanıcı ara..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                  />
                </div>
                <div className="space-y-2">
                  {filteredUsers.map((u) => (
                    <div key={u.id} className="bg-white rounded-2xl border border-slate-100 p-3 flex items-center gap-3">
                      <Avatar name={u.display_name} id={u.id} url={u.avatar_url} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-sm text-slate-900 truncate">{u.display_name}</p>
                          {u.verified && <BadgeCheck className="w-4 h-4 text-sky-500 shrink-0" />}
                          {u.is_admin && (
                            <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[10px] font-medium rounded">Admin</span>
                          )}
                          {u.is_vip && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-medium rounded">
                              <Crown className="w-2.5 h-2.5" /> VIP
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Coin className="w-3 h-3 text-amber-500" />
                          <span className="text-xs font-medium text-amber-600">{u.coins ?? 0}</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => toggleVip(u)}
                          className={`p-2 rounded-lg transition-colors ${u.is_vip ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400 hover:text-amber-500'}`}
                          title={u.is_vip ? 'VIP kaldır' : 'VIP ver'}
                        >
                          <Crown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleVerify(u)}
                          className={`p-2 rounded-lg transition-colors ${u.verified ? 'bg-sky-50 text-sky-600' : 'bg-slate-50 text-slate-400 hover:text-sky-500'}`}
                          title={u.verified ? 'Doğrulamayı kaldır' : 'Doğrula'}
                        >
                          <BadgeCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => addCoins(u, 100)}
                          className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                          title="+100 Coin"
                        >
                          <Coins className="w-4 h-4" />
                        </button>
                        {u.is_banned ? (
                          <button
                            onClick={() => unbanUser(u)}
                            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                            title="Engeli kaldır"
                          >
                            <Undo2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => banUser(u)}
                            className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                            title="Kullanıcıyı engelle"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {u.is_banned && (
                        <div className="mt-2 px-2 py-1 bg-rose-50 rounded-lg text-xs text-rose-600">
                          Engellendi: {u.ban_reason ?? 'Neden belirtilmedi'}
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <p className="text-center text-sm text-slate-400 py-8">Kullanıcı bulunamadı.</p>
                  )}
                </div>
              </div>
            )}

            {/* Posts */}
            {tab === 'posts' && (
              <div className="space-y-2">
                {posts.map((p) => {
                  const author = postAuthors[p.user_id];
                  return (
                    <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {author && <Avatar name={author.display_name} id={author.id} url={author.avatar_url} size="sm" />}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{author?.display_name ?? 'Bilinmeyen'}</p>
                            <p className="text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString('tr-TR')}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => deletePost(p.id)}
                          className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-600 mt-2 line-clamp-3">{p.content || '(Medya)'}</p>
                    </div>
                  );
                })}
                {posts.length === 0 && (
                  <p className="text-center text-sm text-slate-400 py-8">Gönderi yok.</p>
                )}
              </div>
            )}

            {/* Games */}
            {/* Reports */}
            {tab === 'reports' && (
              <div className="space-y-2">
                {reports.filter(r => r.status === 'pending').length === 0 && reports.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-8">Şikayet yok.</p>
                ) : (
                  <>
                    {reports.filter(r => r.status === 'pending').length > 0 && (
                      <p className="text-xs font-medium text-rose-500 mb-2">
                        {reports.filter(r => r.status === 'pending').length} bekleyen şikayet
                      </p>
                    )}
                    {reports.map((r) => (
                      <div key={r.id} className={`bg-white rounded-2xl border p-3 ${r.status === 'pending' ? 'border-rose-200' : 'border-slate-100 opacity-60'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Flag className="w-3.5 h-3.5 text-rose-400" />
                              <span className="text-xs font-medium text-slate-900">
                                {reportProfiles[r.reporter_id]?.display_name ?? 'Bilinmeyen'} şikayet etti
                              </span>
                              {r.status !== 'pending' && (
                                <span className={`px-1.5 py-0.5 text-[10px] rounded ${
                                  r.status === 'resolved' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                }`}>{r.status === 'resolved' ? 'Çözüldü' : 'Reddedildi'}</span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600">{r.reason}</p>
                            {r.post_id && reportPosts[r.post_id] && (
                              <p className="text-xs text-slate-400 mt-1 line-clamp-2">Gönderi: {reportPosts[r.post_id].content ?? '(Medya)'}</p>
                            )}
                            <p className="text-xs text-slate-300 mt-1">{new Date(r.created_at).toLocaleDateString('tr-TR')}</p>
                          </div>
                          {r.status === 'pending' && (
                            <div className="flex gap-1.5 shrink-0">
                              <button
                                onClick={() => resolveReport(r.id, 'resolved')}
                                className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                title="Çözüldü"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => resolveReport(r.id, 'dismissed')}
                                className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors"
                                title="Reddet"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Games */}
            {tab === 'games' && (
              <div className="space-y-2">
                {games.map((g) => {
                  const creator = g.created_by ? gameCreators[g.created_by] : null;
                  return (
                    <div key={g.id} className="bg-white rounded-2xl border border-slate-100 p-3 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0">
                        <Gamepad2 className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">{g.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">
                            {creator ? creator.display_name : 'Sistem'}
                          </span>
                          {g.slug === 'custom' && (
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-medium rounded">HTML</span>
                          )}
                          <span className="text-xs text-amber-500 flex items-center gap-0.5">
                            <Coin className="w-3 h-3" /> {g.price}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteGame(g.id)}
                        className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                {games.length === 0 && (
                  <p className="text-center text-sm text-slate-400 py-8">Oyun yok.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}
