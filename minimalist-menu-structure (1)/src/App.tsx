import { useCallback, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useBadgeChecker } from '@/hooks/useBadges';
import AuthScreen from '@/screens/AuthScreen';
import HomeScreen from '@/screens/HomeScreen';
import SearchScreen from '@/screens/SearchScreen';
import CreatePostScreen from '@/screens/CreatePostScreen';
import MessagesScreen from '@/screens/MessagesScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import AdminScreen from '@/screens/AdminScreen';
import DailyTasksScreen from '@/screens/DailyTasksScreen';
import BottomNav, { type Tab } from '@/components/BottomNav';
import AppHeader from '@/components/AppHeader';
import CreateFab from '@/components/CreateFab';
import { ThemeProvider, useTheme } from '@/lib/ThemeProvider';
import { Sparkles, Bell, X, Heart, MessageCircle, UserPlus, ArrowLeft } from 'lucide-react';
import type { Notification } from '@/lib/supabase';
import { timeAgo } from '@/lib/utils';
import Avatar from '@/components/Avatar';

/** Alt bardaki 3 sekmenin dışında kalan, tam ekran açılan alanlar. */
type Overlay = 'create' | 'messages' | 'notifications' | 'tasks' | 'admin' | null;

const OVERLAY_TITLES: Record<Exclude<Overlay, null>, string> = {
  create: 'Yeni Gönderi',
  messages: 'Mesajlar',
  notifications: 'Bildirimler',
  tasks: 'Günlük Görevler',
  admin: 'Yönetici Paneli',
};

function MainApp() {
  const { user, profile, loading } = useAuth();
  const { isDark, textColor, cardBg, cardBorder, subtextColor } = useTheme();
  const { checkAndAward } = useBadgeChecker();

  const [tab, setTab] = useState<Tab>('home');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState<Notification[]>([]);

  useEffect(() => {
    if (user) checkAndAward();
  }, [user, checkAndAward]);

  useEffect(() => {
    if (user && profile) {
      supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', user.id);
    }
  }, [user, profile]);

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function checkUnread() {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('read', false);
      if (active) setUnreadCount(count ?? 0);
    }
    checkUnread();

    async function loadRecentNotifs() {
      const { data } = await supabase
        .from('notifications')
        .select('*, actor:profiles!notifications_actor_id_fkey(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (active) setRecentNotifs((data ?? []) as unknown as Notification[]);
    }
    loadRecentNotifs();

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          if (active) {
            setUnreadCount((c) => c + 1);
            loadRecentNotifs();
            setShowNotifPanel(true);
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Mesaj rozeti: mesaj alanı kapalıyken gelen yeni mesajları sayar.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('inbox-badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const senderId = (payload.new as { sender_id?: string })?.sender_id;
        if (senderId && senderId !== user.id) setUnreadMessages((c) => c + 1);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const openOverlay = useCallback((next: Exclude<Overlay, null>) => {
    setViewingProfile(null);
    if (next === 'notifications') {
      setUnreadCount(0);
      setShowNotifPanel(false);
    }
    if (next === 'messages') setUnreadMessages(0);
    setOverlay(next);
  }, []);

  const closeOverlay = useCallback(() => {
    setOverlay(null);
    setChatOpen(false);
  }, []);

  const handleTabChange = useCallback((next: Tab) => {
    setOverlay(null);
    setChatOpen(false);
    setViewingProfile(null);
    setTab(next);
  }, []);

  const openProfile = useCallback((id: string) => {
    setOverlay(null);
    setChatOpen(false);
    setViewingProfile(id);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: isDark ? '#0f172a' : '#f8fafc' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-emerald-400 flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm" style={{ color: subtextColor }}>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  const showChrome = !chatOpen;
  const currentUserId = user.id;

  /** Alt bar + üst header her zaman aynı yerde durur, sadece içerik değişir. */
  function renderContent() {
    if (overlay) {
      return (
        <>
          {overlay !== 'messages' && (
            <div className="max-w-xl mx-auto flex items-center gap-3 px-4 pt-4">
              <button
                onClick={closeOverlay}
                className="p-2 rounded-xl shadow-sm transition-all hover:scale-105"
                style={{ background: cardBg, border: `1px solid ${cardBorder}`, color: subtextColor }}
                aria-label="Geri"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold" style={{ color: textColor }}>{OVERLAY_TITLES[overlay]}</h1>
            </div>
          )}
          {overlay === 'create' && <CreatePostScreen onPosted={() => { closeOverlay(); setTab('home'); }} />}
          {overlay === 'messages' && <MessagesScreen onChatOpenChange={setChatOpen} />}
          {overlay === 'notifications' && <NotificationsScreen onProfileClick={openProfile} />}
          {overlay === 'tasks' && <DailyTasksScreen onClose={closeOverlay} />}
          {overlay === 'admin' && profile?.is_admin && <AdminScreen onBack={closeOverlay} />}
        </>
      );
    }

    if (viewingProfile) {
      return (
        <ProfileScreen
          userId={viewingProfile}
          onBack={() => setViewingProfile(null)}
          onProfileClick={openProfile}
        />
      );
    }

    if (tab === 'home') return <HomeScreen onProfileClick={openProfile} />;
    if (tab === 'search') return <SearchScreen onProfileClick={openProfile} />;
    return (
      <ProfileScreen
        userId={currentUserId}
        onBack={() => setTab('home')}
        onProfileClick={openProfile}
        isAdmin={profile?.is_admin ?? false}
        onAdminClick={() => openOverlay('admin')}
      />
    );
  }

  return (
    <div className="min-h-screen">
      {showChrome && (
        <AppHeader
          unreadMessages={unreadMessages}
          unreadNotifications={unreadCount}
          onMessagesClick={() => (overlay === 'messages' ? closeOverlay() : openOverlay('messages'))}
          onNotificationsClick={() => (overlay === 'notifications' ? closeOverlay() : openOverlay('notifications'))}
          onTasksClick={() => (overlay === 'tasks' ? closeOverlay() : openOverlay('tasks'))}
        />
      )}

      {/* Anlık bildirim açılır kutusu */}
      {showNotifPanel && overlay !== 'notifications' && (
        <div className="fixed top-16 right-3 z-50 w-80 max-w-[calc(100vw-1.5rem)]" style={{ maxHeight: '70vh' }}>
          <div className="rounded-2xl shadow-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: cardBorder }}>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-sky-500" />
                <span className="text-sm font-semibold" style={{ color: textColor }}>Bildirimler</span>
                {unreadCount > 0 && <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] rounded-full">{unreadCount}</span>}
              </div>
              <button onClick={() => setShowNotifPanel(false)} className="p-1 rounded-lg hover:bg-black/5" aria-label="Kapat">
                <X className="w-4 h-4" style={{ color: subtextColor }} />
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '50vh' }}>
              {recentNotifs.length === 0 ? (
                <p className="text-center text-sm py-8" style={{ color: subtextColor }}>Bildirim yok</p>
              ) : (
                recentNotifs.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openOverlay('notifications')}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition-colors text-left"
                    style={{ borderBottom: `1px solid ${cardBorder}` }}
                  >
                    <Avatar name={n.actor?.display_name ?? '?'} id={n.actor_id} url={n.actor?.avatar_url} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ color: textColor }}>
                        <span className="font-medium">{n.actor?.display_name}</span>{' '}
                        {n.type === 'like' && 'gönderini beğendi'}
                        {n.type === 'comment' && 'gönderine yorum yaptı'}
                        {n.type === 'follow' && 'seni takip etti'}
                      </p>
                      <p className="text-xs" style={{ color: subtextColor }}>{timeAgo(n.created_at)}</p>
                    </div>
                    {n.type === 'like' && <Heart className="w-4 h-4 text-rose-400 shrink-0" />}
                    {n.type === 'comment' && <MessageCircle className="w-4 h-4 text-sky-400 shrink-0" />}
                    {n.type === 'follow' && <UserPlus className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {renderContent()}

      {showChrome && overlay !== 'create' && <CreateFab onClick={() => openOverlay('create')} />}
      {showChrome && <BottomNav active={tab} onChange={handleTabChange} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </AuthProvider>
  );
}
