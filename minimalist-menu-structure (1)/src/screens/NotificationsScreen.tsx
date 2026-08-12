import { useEffect, useState } from 'react';
import { Heart, MessageCircle, UserPlus, Bell } from 'lucide-react';
import { supabase, type Notification } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { timeAgo } from '@/lib/utils';
import Avatar from '@/components/Avatar';

type Props = {
  onProfileClick: (userId: string) => void;
};

export default function NotificationsScreen({ onProfileClick }: Props) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function load() {
      const { data } = await supabase
        .from('notifications')
        .select('*, actor:profiles!notifications_actor_id_fkey(*), post:posts(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!active) return;
      setNotifications((data ?? []) as Notification[]);
      setLoading(false);

      await supabase.from('notifications').update({ read: true }).eq('user_id', user!.id).eq('read', false);
    }
    load();

    return () => { active = false; };
  }, [user]);

  const iconFor = (type: Notification['type']) => {
    if (type === 'like') return <Heart className="w-4 h-4 text-rose-500 fill-current" />;
    if (type === 'comment') return <MessageCircle className="w-4 h-4 text-sky-500" />;
    return <UserPlus className="w-4 h-4 text-emerald-500" />;
  };

  const textFor = (type: Notification['type']) => {
    if (type === 'like') return 'gönderini beğendi.';
    if (type === 'comment') return 'gönderine yorum yaptı.';
    return 'seni takip etmeye başladı.';
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Bildirimler</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 animate-pulse">
              <div className="w-12 h-12 bg-slate-100 rounded-full" />
              <div className="flex-1 h-4 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
            <Bell className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700">Bildirim yok</h3>
          <p className="text-sm text-slate-400 mt-1">Etkileşimler burada görünecek.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => n.actor_id && onProfileClick(n.actor_id)}
              className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-sky-200 transition-all text-left"
            >
              <div className="relative shrink-0">
                <Avatar name={n.actor?.display_name ?? '?'} id={n.actor_id} url={n.actor?.avatar_url} size="md" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                  {iconFor(n.type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">{n.actor?.display_name}</span>{' '}
                  {textFor(n.type)}
                </p>
                {n.post?.content && (
                  <p className="text-xs text-slate-400 truncate mt-0.5">"{n.post.content}"</p>
                )}
              </div>
              <span className="text-xs text-slate-400 shrink-0">{timeAgo(n.created_at)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
