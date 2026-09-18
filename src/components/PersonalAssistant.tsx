import { useEffect, useMemo, useState } from 'react';
import { Bot, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type Props = { displayName?: string };

const demoReplies = [
  'Bugün profilini düzenleyebilir, yeni bir gönderi paylaşabilir veya keşfet akışına göz atabilirsin.',
  'Kişisel akışını daha iyi hale getirmek için ilgi alanlarına uygun içerikleri kaydetmeni öneririm.',
  'İstersen bunu küçük adımlara bölelim: hedefini yaz, sana uygulanabilir bir plan çıkarayım.',
];

export default function PersonalAssistant({ displayName = 'arkadaşım' }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([{ role: 'assistant', text: `${displayName}, ben Klas AI. Ne üzerinde çalışmak istersin?` }]);
  const [input, setInput] = useState('');
  useEffect(() => {
    if (!user) return;
    supabase.from('klas_ai_messages').select('role, body').eq('user_id', user.id).order('created_at', { ascending: true }).limit(100).then(({ data }) => {
      if (data?.length) setMessages(data.map((message) => ({ role: message.role as 'user' | 'assistant', text: message.body })));
    });
  }, [user]);
  const [isSending, setIsSending] = useState(false);
  const reply = useMemo(() => demoReplies[messages.length % demoReplies.length], [messages.length]);

  async function shareForMe() {
    const content = input.trim();
    if (!user || !content || !window.confirm('Bu metin senin adına gönderi olarak paylaşılsın mı?')) return;
    const { error } = await supabase.from('posts').insert({ user_id: user.id, content, image_url: null, video_url: null, gif_url: null, music_url: null, music_provider: null, is_reel: false });
    if (!error) setInput('');
  }

  async function sendMessage() {
    const messageText = input.trim();
    if (!messageText) return;
    setMessages((current) => [...current, { role: 'user', text: messageText }]);
    if (user) await supabase.from('klas_ai_messages').insert({ user_id: user.id, role: 'user', body: messageText });
    setInput('');
    setIsSending(true);
    try {
      const response = await fetch('/api/assistant', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: messageText, history: messages.slice(-20) }) });
      const data = await response.json() as { text?: string; error?: string; details?: string };
      if (!response.ok) throw new Error(data.error ?? 'Asistan yanıt veremedi');
      const assistantText = data.text ?? reply;
      setMessages((current) => [...current, { role: 'assistant', text: assistantText }]);
      if (user) await supabase.from('klas_ai_messages').insert({ user_id: user.id, role: 'assistant', body: assistantText });
    } catch {
      setMessages((current) => [...current, { role: 'assistant', text: reply }]);
    } finally {
      setIsSending(false);
    }
  }

  return <section className="mx-auto w-full max-w-xl rounded-2xl border border-violet-100 bg-white p-4 shadow-sm" aria-label="Klas AI kişisel asistanı">
    <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 text-white"><Bot className="h-5 w-5" /></div><div><h2 className="font-bold text-slate-900">Klas AI</h2><p className="text-xs text-slate-500">Senin kişisel yapay zeka asistanın</p></div></div>
    <div className="mb-3 max-h-72 space-y-2 overflow-y-auto">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${message.role === 'user' ? 'ml-auto bg-violet-600 text-white' : 'bg-violet-50 text-slate-700'}`}>{message.text}</div>)}</div>
    <div className="flex gap-2"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) sendMessage(); }} placeholder="Asistana bir şey sor..." className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400" /><button type="button" onClick={shareForMe} disabled={!input.trim() || !user} className="whitespace-nowrap rounded-xl border border-emerald-200 px-3 text-xs font-semibold text-emerald-700 disabled:opacity-40">Benim yerime paylaş</button><button type="button" onClick={sendMessage} disabled={isSending} className="rounded-xl bg-violet-600 px-3 text-white disabled:cursor-wait disabled:opacity-60" aria-label="Mesaj gönder">{isSending ? '...' : <Send className="h-4 w-4" />}</button></div>
    <p className="mt-2 text-[11px] text-slate-400">Gemini bağlantısı varsa yanıtlar kişiselleştirilir; bağlantı yoksa temel öneriler gösterilir.</p>
  </section>;
}
