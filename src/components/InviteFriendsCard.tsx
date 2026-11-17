import { useState } from 'react';
import { Copy, Gift, Share2, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useCommunityWelcome } from '@/hooks/useCommunityWelcome';

type Props = {
  id?: string;
  compact?: boolean;
};

export default function InviteFriendsCard({ compact = false, id }: Props) {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useCommunityWelcome(user?.id);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  if (!user || isLoading || error || !data) return null;

  const currentUser = user;
  const welcomeData = data;

  async function ensureInviteCode() {
    if (welcomeData.inviteCode) return welcomeData.inviteCode;
    const inviteCode = `KLS-${crypto.randomUUID().replace(/-/g, '').toUpperCase()}`;
    const { error: insertError } = await supabase.from('referral_invites').insert({ inviter_id: currentUser.id, invite_code: inviteCode });
    if (insertError) {
      await mutate();
      return null;
    }
    await mutate({ ...welcomeData, inviteCode }, { revalidate: false });
    return inviteCode;
  }

  async function shareInvite() {
    setBusy(true);
    setMessage('');
    const code = await ensureInviteCode();
    if (!code) {
      setMessage('Davet bağlantısı hazırlanamadı. Tekrar dene.');
      setBusy(false);
      return;
    }
    const url = `${window.location.origin}/?ref=${encodeURIComponent(code)}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Klas Sosyal', text: 'Klas Sosyal topluluğuma katıl!', url });
      else {
        await navigator.clipboard.writeText(url);
        setMessage('Davet bağlantısı kopyalandı.');
      }
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name === 'AbortError') {
        setBusy(false);
        return;
      }
      try {
        await navigator.clipboard.writeText(url);
        setMessage('Davet bağlantısı kopyalandı.');
      } catch {
        setMessage('Bağlantı hazırlanamadı. Tarayıcı paylaşım iznini kontrol et.');
      }
    }
    setBusy(false);
  }

  async function copyInvite() {
    setBusy(true);
    setMessage('');
    const code = await ensureInviteCode();
    if (!code) setMessage('Davet bağlantısı hazırlanamadı. Tekrar dene.');
    else {
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/?ref=${encodeURIComponent(code)}`);
        setMessage('Davet bağlantısı kopyalandı.');
      } catch {
        setMessage('Bağlantı kopyalanamadı. Tarayıcı izinlerini kontrol et.');
      }
    }
    setBusy(false);
  }

  return (
    <section id={id} className={`mb-4 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-sky-50 shadow-sm ${compact ? 'p-3' : 'p-4'}`} aria-labelledby="invite-friends-title">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm" aria-hidden="true">
          <Users className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="invite-friends-title" className="text-sm font-bold text-slate-900">Arkadaşlarınla büyüt</h2>
          <p className="mt-0.5 text-xs text-slate-500">{data.acceptedInviteCount} arkadaş katıldı · ilk davette Elçi rozeti</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-violet-500" aria-hidden="true">
          <Gift className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => void shareInvite()} disabled={busy} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:opacity-50">
          <Share2 className="h-4 w-4" aria-hidden="true" /> {busy ? 'Hazırlanıyor...' : 'Arkadaşını davet et'}
        </button>
        <button type="button" onClick={() => void copyInvite()} disabled={busy} aria-label="Davet bağlantısını kopyala" title="Davet bağlantısını kopyala" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-200 bg-white text-violet-700 transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:opacity-50">
          <Copy className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {message && <p className="mt-2 text-xs text-slate-600" role="status">{message}</p>}
    </section>
  );
}
