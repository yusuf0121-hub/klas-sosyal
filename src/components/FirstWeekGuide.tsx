import { useState } from 'react';
import { Check, ChevronRight, Compass, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useCommunityWelcome } from '@/hooks/useCommunityWelcome';

type Props = {
  onInvite: () => void;
  onCreate: () => void;
  onDiscover: () => void;
};

export default function FirstWeekGuide({ onInvite, onCreate, onDiscover }: Props) {
  const { user, profile } = useAuth();
  const { data, error, isLoading, mutate } = useCommunityWelcome(user?.id);
  const [saving, setSaving] = useState(false);

  if (!user || !profile?.created_at || isLoading || error || !data || data.dismissed) return null;
  const currentUser = user;
  const welcomeData = data;
  const ageInDays = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86_400_000);
  if (ageInDays < 0 || ageInDays >= 7) return null;

  const steps = [
    { id: 'post', label: 'İlk gönderini paylaş', done: welcomeData.postCount > 0, action: onCreate },
    { id: 'follow', label: 'İlgi çekici birini takip et', done: welcomeData.followingCount > 0, action: onDiscover },
    { id: 'invite', label: 'Bir arkadaşını davet et', done: welcomeData.acceptedInviteCount > 0, action: onInvite },
  ];
  const completed = steps.filter((step) => step.done).length;

  async function dismissGuide() {
    setSaving(true);
    const { error: saveError } = await supabase.from('user_onboarding').upsert({
      user_id: currentUser.id,
      completed_steps: steps.filter((step) => step.done).map((step) => step.id),
      dismissed: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (!saveError) await mutate({ ...welcomeData, dismissed: true }, { revalidate: false });
    setSaving(false);
  }

  return (
    <section className="mb-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm" aria-labelledby="first-week-title">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700" aria-hidden="true">
          <Compass className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 id="first-week-title" className="text-sm font-bold text-slate-900">Klas&apos;ta ilk haftan</h2>
              <p className="mt-0.5 text-xs text-slate-500">Topluluğunu kurmak için küçük adımlar</p>
            </div>
            <button type="button" onClick={() => void dismissGuide()} disabled={saving} aria-label="İlk hafta rehberini kapat" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2" role="progressbar" aria-label="İlk hafta rehberi ilerlemesi" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={completed}>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${completed / steps.length * 100}%` }} />
            </div>
            <span className="text-[11px] font-medium text-slate-500">{completed}/{steps.length}</span>
          </div>
          <ul className="mt-2 divide-y divide-slate-100">
            {steps.map((step) => (
              <li key={step.id}>
                <button type="button" onClick={step.action} disabled={step.done} className="flex w-full items-center gap-2.5 py-2 text-left disabled:cursor-default">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${step.done ? 'bg-emerald-100 text-emerald-700' : 'border border-slate-200 text-transparent'}`}>
                    {step.done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <span className="sr-only">Tamamlanmadı</span>}
                  </span>
                  <span className={`flex-1 text-xs ${step.done ? 'text-slate-400 line-through' : 'font-medium text-slate-700'}`}>{step.label}</span>
                  {!step.done && <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
