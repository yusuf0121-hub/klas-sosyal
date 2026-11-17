import { MessageSquareText, Sparkles } from 'lucide-react';

const DAILY_PROMPTS = [
  'Bugün seni gülümseten küçük bir anı paylaş.',
  'Son zamanlarda keşfettiğin bir şarkıyı öner.',
  'Yaşadığın şehirde herkesin görmesi gereken bir yeri anlat.',
  'Bu hafta öğrendiğin yeni bir şeyi paylaş.',
  'Çocukluğundan unutamadığın bir oyunu anlat.',
  'İzlediğin son film veya diziyi tek cümlede yorumla.',
  'Bugün yanında olmasını istediğin kişiye bir not bırak.',
  'Kendinle gurur duyduğun küçük bir anı paylaş.',
  'Arkadaşlarına hafta sonu için bir öneri ver.',
  'En sevdiğin atıştırmalığı ve nedenini anlat.',
  'Telefonundaki son fotoğrafın hikâyesini paylaş.',
  'Şu sıralar merak ettiğin bir konuyu sor.',
  'Sana ilham veren bir sözü veya fikri paylaş.',
  'Bir arkadaşına teşekkür etmenin güzel bir yolunu anlat.',
];

function getTodaysPrompt() {
  const today = new Date();
  const dayNumber = Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86_400_000);
  return DAILY_PROMPTS[dayNumber % DAILY_PROMPTS.length];
}

type Props = {
  onCreate: (prompt: string) => void;
};

export default function DailyPromptCard({ onCreate }: Props) {
  const prompt = getTodaysPrompt();

  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-4 shadow-sm" aria-labelledby="daily-prompt-title">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm" aria-hidden="true">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-sky-700">
            <MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" /> Bugünün paylaşım fikri
          </div>
          <h2 id="daily-prompt-title" className="mt-1 text-sm font-semibold leading-5 text-slate-900">{prompt}</h2>
          <button type="button" onClick={() => onCreate(prompt)} className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2">
            Bu fikirle paylaş
          </button>
        </div>
      </div>
    </section>
  );
}
