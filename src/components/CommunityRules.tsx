import { Clock3, MessageCircleQuestion, Snowflake } from 'lucide-react';

function getCommunityMode() {
  const hour = new Date().getHours();
  const isQuiet = hour >= 2 && hour < 6;
  const isQuestionDay = new Date().getDay() === 3;
  return { isQuiet, isQuestionDay };
}

export default function CommunityRules() {
  const { isQuiet, isQuestionDay } = getCommunityMode();
  return (
    <aside className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-labelledby="rules-title">
      <div className="mb-3 flex items-center justify-between"><h2 id="rules-title" className="text-sm font-bold text-slate-900">Sıra dışı topluluk kuralları</h2><Snowflake className="h-4 w-4 text-sky-500" aria-hidden="true" /></div>
      <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
        <div className={`rounded-xl p-3 ${isQuiet ? 'bg-sky-100 text-sky-800' : 'bg-slate-50'}`}><Clock3 className="mb-1 h-4 w-4" aria-hidden="true" /><strong>Sessiz saatler</strong><p className="mt-1">02:00–06:00 sakin ve felsefi paylaşımlar.</p></div>
        <div className={`rounded-xl p-3 ${isQuestionDay ? 'bg-amber-100 text-amber-800' : 'bg-slate-50'}`}><MessageCircleQuestion className="mb-1 h-4 w-4" aria-hidden="true" /><strong>Soru günü</strong><p className="mt-1">Çarşamba yalnızca soru soruyoruz.</p></div>
        <div className="rounded-xl bg-slate-50 p-3"><Snowflake className="mb-1 h-4 w-4 text-sky-500" aria-hidden="true" /><strong>Spam freni</strong><p className="mt-1">1 dakikada 5 gönderi sınırı topluluğu korur.</p></div>
      </div>
      {(isQuiet || isQuestionDay) && <p className="mt-3 text-xs font-medium text-slate-700">Şu an özel topluluk modu aktif.</p>}
    </aside>
  );
}
