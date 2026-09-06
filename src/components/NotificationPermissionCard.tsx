import { Bell, BellRing, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useTheme } from '@/lib/ThemeProvider';

type Props = { onDismiss?: () => void };

export default function NotificationPermissionCard({ onDismiss }: Props) {
  const { permission, subscribing, requestPermission } = usePushNotifications();
  const { cardBg, cardBorder, textColor, subtextColor } = useTheme();
  if (permission === 'unsupported' || permission === 'granted' || permission === 'denied') return null;

  return (
    <div className="mx-4 mt-3 rounded-2xl p-4 flex items-center gap-3 shadow-sm" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
      <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0"><BellRing className="w-5 h-5" /></div>
      <div className="min-w-0 flex-1"><p className="text-sm font-semibold" style={{ color: textColor }}>Mesaj bildirimlerini aç</p><p className="text-xs mt-0.5" style={{ color: subtextColor }}>Yeni mesajları telefonda kaçırma.</p></div>
      <button onClick={requestPermission} disabled={subscribing} className="shrink-0 rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{subscribing ? '...' : 'İzin ver'}</button>
      {onDismiss && <button onClick={onDismiss} className="p-1" aria-label="Kapat"><X className="w-4 h-4" style={{ color: subtextColor }} /></button>}
    </div>
  );
}
