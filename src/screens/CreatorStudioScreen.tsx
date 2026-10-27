import { useState } from 'react';
import { BarChart3, CalendarClock, FileVideo, Sparkles, ArrowLeft } from 'lucide-react';

type Props = { onClose: () => void };

const metrics = [
  ['İzlenme', '12.8K', '+24%'],
  ['Etkileşim', '8.4%', '+11%'],
  ['Takipçi', '1,248', '+86'],
];

export default function CreatorStudioScreen({ onClose }: Props) {
  const [caption, setCaption] = useState('');
  const [notice, setNotice] = useState('');
  return <section className="mx-auto max-w-xl space-y-4 px-4 py-5 text-slate-900">
    <header className="flex items-center gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2" aria-label="Geri"><ArrowLeft className="h-5 w-5" /></button><div><p className="text-xs font-bold uppercase tracking-widest text-sky-500">Klas Sosyal</p><h1 className="text-xl font-bold">İçerik üretici stüdyosu</h1></div></header>
    <div className="grid grid-cols-3 gap-2">{metrics.map(([label, value, change]) => <div key={label} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-bold">{value}</p><p className="text-xs font-semibold text-emerald-500">{change}</p></div>)}</div>
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><h2 className="flex items-center gap-2 font-semibold"><FileVideo className="h-4 w-4 text-sky-500" /> Yeni içerik planla</h2><p className="mt-1 text-sm text-slate-500">Videonu yüklemeden önce başlık, açıklama ve yayın zamanını hazırla.</p><textarea value={caption} onChange={(event) => setCaption(event.target.value)} rows={4} placeholder="Başlık ve açıklama..." className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400" /><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => setNotice('Taslak kaydedildi.')} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold">Taslak kaydet</button><button type="button" onClick={() => setNotice('İçerik zamanlama kuyruğuna eklendi.')} className="flex items-center gap-2 rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-white"><CalendarClock className="h-4 w-4" /> Zamanla</button></div>{notice && <p className="mt-3 text-sm font-medium text-emerald-600">{notice}</p>}</div>
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><h2 className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-violet-500" /> İçerik fikirleri</h2><div className="mt-3 space-y-2 text-sm text-slate-600"><p className="rounded-xl bg-violet-50 p-3">Takipçilerin son günlerde teknoloji ve kısa eğitim videolarıyla daha çok etkileşime girdi.</p><p className="rounded-xl bg-sky-50 p-3">Bir sonraki Reels için 30 saniyelik “3 hızlı ipucu” formatını dene.</p></div></div>
    <div className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500"><BarChart3 className="h-5 w-5" /> İstatistikler her yeni içerikle güncellenir.</div>
  </section>;
}
