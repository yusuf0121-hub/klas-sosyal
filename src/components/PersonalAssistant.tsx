import { useEffect, useMemo, useState } from 'react';
import { Bot, Paperclip, Send, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type Props = { displayName?: string };

const demoReplies = [
  'Bugün profilini düzenleyebilir, yeni bir gönderi paylaşabilir veya keşfet akışına göz atabilirsin.',
  'Kişisel akışını daha iyi hale getirmek için ilgi alanlarına uygun içerikleri kaydetmeni öneririm.',
  'İstersen bunu küçük adımlara bölelim: hedefini yaz, sana uygulanabilir bir plan çıkarayım.',
];

const capabilities = ['Metin yazma', 'Özetleme', 'Çeviri', 'Kod yardımı', 'Fikir üretme'];

export default function PersonalAssistant({ displayName = 'arkadaşım' }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([{ role: 'assistant', text: `${displayName}, ben Klas AI. Ne üzerinde çalışmak istersin?` }]);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<{ name: string; type: string; text?: string; preview?: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('klas_ai_messages').select('role, body').eq('user_id', user.id).order('created_at', { ascending: true }).limit(100).then(({ data }) => {
      if (data?.length) setMessages(data.map((message) => ({ role: message.role as 'user' | 'assistant', text: message.body })));
    });
  }, [user]);
  const [isSending, setIsSending] = useState(false);
  const reply = useMemo(() => demoReplies[messages.length % demoReplies.length], [messages.length]);

  async function handleAttachment(file?: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    const isText = file.type.startsWith('text/') || /\.(md|json|csv|ts|tsx|js|jsx|py)$/i.test(file.name);
    const text = isText ? (await file.text()).slice(0, 12000) : undefined;
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    setAttachment({ name: file.name, type: file.type || 'application/octet-stream', text, preview });
  }

  async function shareText() {
    const content = input.trim();
    if (!user || !content) return;
    if (!window.confirm('Bu metin senin adına paylaşım olarak yayınlansın mı?')) return;
    const { error } = await supabase.from('posts').insert({ user_id: user.id, content, image_url: null, video_url: null, is_reel: false });
    if (!error) setInput('');
  }

  async function improveText() {
    const text = input.trim();
    if (!text || isSending) return;
    setIsSending(true);
    try {
      const response = await fetch('/api/assistant', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: `Bu metni Klas Sosyal için daha akıcı, samimi ve etkileyici hale getir. Sadece geliştirilmiş metni döndür, açıklama ekleme:\n\n${text}` }) });
      const data = await response.json() as { text?: string };
      if (response.ok && data.text) setInput(data.text.trim());
    } finally {
      setIsSending(false);
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text && !attachment) return;
    const messageText = attachment ? `${text}\n\nEk dosya: ${attachment.name}${attachment.text ? `\n\nDosya içeriği:\n${attachment.text}` : `\nDosya türü: ${attachment.type}`}`.trim() : text;
    setMessages((current) => [...current, { role: 'user', text: messageText }]);
    if (user) await supabase.from('klas_ai_messages').insert({ user_id: user.id, role: 'user', body: messageText });
    setInput('');
    setAttachment(null);
    setIsSending(true);
    try {
      const response = await fetch('/api/assistant', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: text || 'Bu dosyayı incele ve önemli noktalarını açıkla.', attachment: attachment ? { name: attachment.name, type: attachment.type, text: attachment.text } : null, history: messages.slice(-20) }) });
      const data = await response.json() as { text?: string; error?: string; details?: string };
      if (!response.ok) throw new Error(data.error ?? 'Asistan yanıt veremedi');
      const assistantText = data.text?.trim() || reply;
      setMessages((current) => [...current, { role: 'assistant', text: assistantText }]);
      if (user) await supabase.from('klas_ai_messages').insert({ user_id: user.id, role: 'assistant', body: assistantText });
    } catch {
      setMessages((current) => [...current, { role: 'assistant', text: reply }]);
    } finally {
      setIsSending(false);
    }
  }

  return <section className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Klas AI kişisel asistanı">
    <div className="mb-4 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm" aria-label="Klas AI logosu"><img src="/klas-ai-logo.jpg" alt="Klas AI" className="h-full w-full object-cover" /></div><div><div className="flex items-center gap-2"><h2 className="font-bold text-slate-900">Klas AI</h2><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Çevrimiçi</span></div><p className="text-xs text-slate-500">Günlük işlerden karmaşık problemlere kadar yardımcı olur</p></div></div>
    <div className="mb-4 flex flex-wrap gap-1.5">{capabilities.map((capability) => <span key={capability} className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-500">{capability}</span>)}</div>
    <div className="mb-3 max-h-72 space-y-2 overflow-y-auto">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${message.role === 'user' ? 'ml-auto bg-violet-600 text-white' : 'bg-violet-50 text-slate-700'}`}>{message.text}</div>)}</div>
    {attachment && <div className="mb-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">{attachment.preview && <img src={attachment.preview} alt="Ek dosya önizlemesi" className="h-10 w-10 rounded-lg object-cover" />}<span className="min-w-0 flex-1 truncate">{attachment.name}</span><button type="button" onClick={() => setAttachment(null)} aria-label="Dosyayı kaldır"><X className="h-4 w-4" /></button></div>}
    <div className="mb-2 flex flex-wrap gap-2"><label className="flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"><Paperclip className="h-4 w-4" /> Dosya ekle<input type="file" accept="image/*,.txt,.md,.json,.csv,.js,.jsx,.ts,.tsx,.py" className="sr-only" onChange={(event) => void handleAttachment(event.target.files?.[0])} /></label><button type="button" onClick={improveText} disabled={!input.trim() || isSending} className="rounded-xl border border-sky-200 px-3 py-2 text-xs font-semibold text-sky-700 disabled:opacity-40">Metni geliştir</button><button type="button" onClick={shareText} disabled={!input.trim() || !user} className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 disabled:opacity-40">Paylaş</button></div>
    <div className="flex gap-2"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) sendMessage(); }} placeholder="Asistana bir şey sor..." className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400" /><button type="button" onClick={sendMessage} disabled={isSending} className="rounded-xl bg-violet-600 px-3 text-white disabled:cursor-wait disabled:opacity-60" aria-label="Mesaj gönder">{isSending ? '...' : <Send className="h-4 w-4" />}</button></div>
    <p className="mt-2 text-[11px] text-slate-400">Gemini bağlantısı varsa yanıtlar kişiselleştirilir; bağlantı yoksa temel öneriler gösterilir.</p>
  </section>;
}
