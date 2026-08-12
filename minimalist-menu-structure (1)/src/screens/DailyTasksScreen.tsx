import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Coins, X, ArrowLeft, Calendar } from 'lucide-react';
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
    loadTasks();
  }, []);

  async function loadTasks() {
    setLoading(true);
    await supabase.rpc('refresh_daily_tasks');
    const { data } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('user_id', profile!.id)
      .eq('task_date', new Date().toISOString().split('T')[0])
      .order('task_type', { ascending: true });
    setTasks((data ?? []) as DailyTask[]);
    setLoading(false);
  }

  async function claimReward(taskId: string) {
    setClaiming(taskId);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('claim_daily_task_reward', { p_task_id: taskId });
    if (rpcError) {
      setError('Bir hata oluştu.');
    } else if (data && !data.success) {
      setError(data.error || 'Ödül alınamadı.');
    } else if (data && data.success) {
      await refreshProfile();
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, completed: true } : t));
    }
    setClaiming(null);
  }

  const totalReward = tasks.reduce((sum, t) => sum + t.reward_coins, 0);
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">Günlük Görevler</h1>
            <p className="text-xs text-slate-400">Bugün {completedCount}/{tasks.length} tamamlandı</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 rounded-xl">
            <Coin className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-semibold text-amber-700">{profile?.coins ?? 0}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>
        )}

        {/* Progress summary */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-sky-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">Toplam Ödül: {totalReward} Coin</p>
              <p className="text-xs text-slate-400">Tüm görevleri tamamla, coin kazan!</p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
              style={{ width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-sky-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const isCompleted = task.completed;
              const canClaim = task.completed;
              const progress = Math.min(task.progress, task.target_count);
              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-2xl border p-4 transition-all ${
                    isCompleted ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-300 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isCompleted ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {TASK_LABELS[task.task_type] ?? task.task_type}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        İlerleme: {progress}/{task.target_count}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        <Coin className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-semibold text-amber-600">+{task.reward_coins}</span>
                      </div>
                      {canClaim && (
                        <button
                          onClick={() => claimReward(task.id)}
                          disabled={claiming === task.id}
                          className="text-xs px-3 py-1.5 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                        >
                          {claiming === task.id ? 'Alınıyor...' : 'Ödül Al'}
                        </button>
                      )}
                    </div>
                  </div>
                  {progress > 0 && !isCompleted && (
                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-400 transition-all duration-500"
                        style={{ width: `${(progress / task.target_count) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            {tasks.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">Görevler yüklenemedi.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
