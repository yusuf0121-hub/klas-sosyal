import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Circle, Sprout, Sun } from 'lucide-react';
import { supabase, type DailyTask } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Coin } from '@/lib/customIcons';

const TASK_LABELS: Record<string, string> = {
  post: '1 gönderi paylaş',
  comment: '3 gönderiye yorum yap',
  like: '3 gönderiyi beğen',
  follow: '1 kişi takip et',
  play_game: '1 oyun oyna',
};

type Props = {
  onClose: () => void;
};

export default function DailyTasksScreen({ onClose }: Props) {
  const { profile, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      void loadTasks(profile.id);
    } else {
      setLoading(false);
    }
  }, [profile?.id]);

  async function loadTasks(userId: string) {
    setLoading(true);
    setError(null);
    const { error: refreshError } = await supabase.rpc('refresh_daily_tasks');
    const { data: latestTask, error: latestError } = await supabase
      .from('daily_tasks')
      .select('task_date')
      .eq('user_id', userId)
      .order('task_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) {
      setError('Görevler yüklenemedi. Lütfen tekrar dene.');
      setTasks([]);
    } else if (latestTask?.task_date) {
      const { data, error: queryError } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('task_date', latestTask.task_date)
        .order('task_type', { ascending: true });
      if (queryError) {
        setError('Görevler yüklenemedi. Lütfen tekrar dene.');
        setTasks([]);
      } else {
        setTasks((data ?? []) as DailyTask[]);
        if (refreshError) setError('Günlük görevler yenilenemedi.');
      }
    } else {
      setTasks([]);
      if (refreshError) setError('Günlük görevler yenilenemedi.');
    }
    setLoading(false);
  }

  async function claimReward(taskId: string) {
    setClaiming(taskId);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('claim_daily_task_reward', { p_task_id: taskId });
    if (rpcError) {
      setError('Ödül alınamadı. Lütfen tekrar dene.');
    } else if (data && !data.success) {
      setError(data.error || 'Ödül alınamadı.');
    } else if (data?.success) {
      await refreshProfile();
      setTasks((prev) => prev.map((task) => task.id === taskId
        ? { ...task, claimed_at: new Date().toISOString() }
        : task));
    }
    setClaiming(null);
  }

  const totalReward = tasks.reduce((sum, task) => sum + task.reward_coins, 0);
  const completedCount = tasks.filter((task) => task.completed).length;
  const growthProgress = tasks.length
    ? Math.round(tasks.reduce((sum, task) => sum + Math.min(task.progress / task.target_count, 1), 0) / tasks.length * 100)
    : 0;
  const gardenMood = growthProgress === 100 ? 'Bugün seran çiçek açtı!' : growthProgress >= 50 ? 'Güzel gidiyorsun, filizler büyüyor.' : 'Küçük adımlarınla seranı büyüt.';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-xl px-4 py-6 pb-24">
        <div className="mb-6 flex items-center gap-3">
          <button onClick={onClose} className="rounded-xl p-2 transition-colors hover:bg-slate-100" aria-label="Geri">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">Günlük Görevler</h1>
            <p className="text-xs text-slate-400">Bugün {completedCount}/{tasks.length} tamamlandı</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2">
            <Coin className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-semibold text-amber-700">{profile?.coins ?? 0}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-600" role="alert">{error}</div>
        )}

        <section className="plant-task-widget mb-4" aria-label="Günlük görev serası">
          <div className="plant-task-art" aria-hidden="true">
            <Sprout className="h-8 w-8" strokeWidth={1.7} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
              <Sun className="h-3.5 w-3.5" aria-hidden="true" /> Günlük seran
            </div>
            <p className="mt-1 text-sm font-semibold text-emerald-950">{gardenMood}</p>
            <p className="mt-0.5 text-xs text-emerald-800/75">Her görev yeni bir filiz.</p>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-950/10"
              role="progressbar"
              aria-label="Günlük görev ilerlemesi"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={growthProgress}
            >
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${growthProgress}%` }} />
            </div>
          </div>
          <span className="shrink-0 self-start rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold text-emerald-800">{growthProgress}%</span>
        </section>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-4">
            <p className="text-xs text-slate-400">Tamamlanan</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{completedCount}<span className="text-sm text-slate-400">/{tasks.length}</span></p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs text-amber-600">Bugünün ödülü</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{totalReward}<span className="ml-1 text-sm font-medium">Coin</span></p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20" role="status" aria-label="Görevler yükleniyor">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-slate-700">Bugünün görevleri</h2>
              <span className="text-xs text-slate-400">Her gün yenilenir</span>
            </div>
            {tasks.map((task) => {
              const progress = Math.min(task.progress, task.target_count);
              const canClaim = task.completed && !task.claimed_at;
              return (
                <div
                  key={task.id}
                  className={`rounded-2xl border p-4 transition-all ${task.completed ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100 bg-white'}`}
                >
                  <div className="flex items-center gap-3">
                    {task.completed ? (
                      <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500" aria-hidden="true" />
                    ) : (
                      <Circle className="h-6 w-6 shrink-0 text-slate-300" aria-hidden="true" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${task.completed ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {TASK_LABELS[task.task_type] ?? task.task_type}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">İlerleme: {progress}/{task.target_count}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        <Coin className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-semibold text-amber-600">+{task.reward_coins}</span>
                      </div>
                      {canClaim ? (
                        <button
                          onClick={() => claimReward(task.id)}
                          disabled={claiming === task.id}
                          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                        >
                          {claiming === task.id ? 'Alınıyor...' : 'Ödül Al'}
                        </button>
                      ) : task.claimed_at ? (
                        <span className="text-xs font-medium text-emerald-700">Alındı</span>
                      ) : null}
                    </div>
                  </div>
                  {progress > 0 && !task.completed && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-400 transition-all duration-500" style={{ width: `${(progress / task.target_count) * 100}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
            {tasks.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">Görevler yüklenemedi.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
