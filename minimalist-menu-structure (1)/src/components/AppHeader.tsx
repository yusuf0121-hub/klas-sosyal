import { Bell, MessageCircle, Sparkles, ListChecks } from 'lucide-react';
import { useTheme } from '@/lib/ThemeProvider';

type Props = {
  unreadMessages?: number;
  unreadNotifications?: number;
  onMessagesClick: () => void;
  onNotificationsClick: () => void;
  onTasksClick?: () => void;
};

/**
 * Üst header: marka + Görevler + Mesaj ve Bildirim ikonları.
 * Alt bar 3 sekmeye indirildiği için mesaj/bildirim buraya taşındı.
 */
export default function AppHeader({
  unreadMessages = 0,
  unreadNotifications = 0,
  onMessagesClick,
  onNotificationsClick,
  onTasksClick,
}: Props) {
  const { textColor, cardBg, cardBorder, subtextColor } = useTheme();

  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-lg border-b"
      style={{ background: 'var(--nav-bg, rgba(255,255,255,0.9))', borderColor: cardBorder }}
    >
      <div className="max-w-xl mx-auto flex items-center justify-between gap-2 px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold truncate" style={{ color: textColor }}>
            Klas Sosyal
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onTasksClick && (
            <button
              onClick={onTasksClick}
              className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
              style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
              aria-label="Günlük görevler"
            >
              <ListChecks className="w-5 h-5" style={{ color: subtextColor }} />
            </button>
          )}

          <button
            onClick={onMessagesClick}
            className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
            aria-label="Mesajlar"
          >
            <MessageCircle className="w-5 h-5" style={{ color: subtextColor }} />
            {unreadMessages > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-sky-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
          </button>

          <button
            onClick={onNotificationsClick}
            className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
            aria-label="Bildirimler"
          >
            <Bell className="w-5 h-5" style={{ color: subtextColor }} />
            {unreadNotifications > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
