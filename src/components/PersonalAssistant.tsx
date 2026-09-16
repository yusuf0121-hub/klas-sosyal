import { useMemo, useState } from 'react';
import { Bot, Send } from 'lucide-react';

type Props = { displayName?: string };

const demoReplies = [
  'Bugün profilini düzenleyebilir, yeni bir gönderi paylaşabilir veya keşfet akışına göz atabilirsin.',
  'Kişisel akışını daha iyi hale getirmek için ilgi alanlarına uygun içerikleri kaydetmeni öneririm.',
  'İstersen bunu küçük adımlara bölelim: hedefini yaz, sana uygulanabilir bir plan çıkarayım.',
];

export default function PersonalAssistant({ displayName = 'arkadaşım' }: Props) {
  const [messages, setMessages] = useState([{ role: 'assistant', text: `${displayName}, ben senin kişisel asistanınım. Ne üzerinde çalışmak istersin?` }]);
  const [input, setInput] = useState('');
  const reply = useMemo(() => demoReplies[messages.length % demoReplies.length], [messages.length]);

  function sendMessage() {
    const text = input.trim();
    if (!text) return;
    setMessages((current) => [...current, { role: 'user', text }, { role: 'assistant', text: reply }]);
    setInput('');
  }

  return <section className="mx-auto w-full max-w-xl rounded-2xl border border-violet-100 bg-white p-4 shadow-sm" aria-label="Kişisel yapay zeka asistanı">
    <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 text-white"><Bot className="h-5 w-5" /></div><div><h2 className="font-bold text-slate-900">Kişisel asistan</h2><p className="text-xs text-slate-500">Sana özel öneriler için konuş</p></div></div>
    <div className="mb-3 max-h-72 space-y-2 overflow-y-auto">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${message.role === 'user' ? 'ml-auto bg-violet-600 text-white' : 'bg-violet-50 text-slate-700'}`}>{message.text}</div>)}</div>
    <div className="flex gap-2"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) sendMessage(); }} placeholder="Asistana bir şey sor..." className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400" /><button type="button" onClick={sendMessage} className="rounded-xl bg-violet-600 px-3 text-white" aria-label="Mesaj gönder"><Send className="h-4 w-4" /></button></div>
    <p className="mt-2 text-[11px] text-slate-400">Demo asistanı: gerçek model bağlantısı eklenmeden yerel öneriler gösterir.</p>
  </section>;
}
