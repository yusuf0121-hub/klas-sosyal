import { useEffect, useMemo, useState } from 'react';
import { Bot, ImagePlus, Paperclip, Send, X } from 'lucide-react';
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
  const [attachment, setAttachment] = useState<{ name: string; dataUrl: string; type: string } | null>(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('klas_ai_messages').select('role, body').eq('user_id', user.id).order('created_at', { ascending: true }).limit(100).then(({ data }) => {
      if (data?.length) setMessages(data.map((message) => ({ role: message.role as 'user' | 'assistant', text: message.body })));
    });
  }, [user]);
  const [isSending, setIsSending] = useState(false);
  const reply = useMemo(() => demoReplies[messages.length % demoReplies.length], [messages.length]);

  function handleFile(file: File | undefined) {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 8 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => setAttachment({ name: file.name, dataUrl: String(reader.result), type: file.type });
    reader.readAsDataURL(file);
  }

  async function generateImage() {
    const prompt = imagePrompt.trim();
    if (!prompt || isGenerating) return;
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-image', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt }) });
      const data = await response.json() as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error ?? 'Görsel oluşturulamadı');
      setAttachment({ name: 'klas-ai-generated.png', dataUrl: data.url, type: 'image/png' });
      setImagePrompt('');
    } finally { setIsGenerating(false); }
  }

  async function sendMessage() {
    const text = input.trim();
    const messageText = attachment ? `${text}\n\nEk dosya: ${attachment.name}`.trim() : text;
    if (!messageText) return;
    setMessages((current) => [...current, { role: 'user', text: messageText }]);
    if (user) await supabase.from('klas_ai_messages').insert({ user_id: user.id, role: 'user', body: messageText });
    setInput('');
    setAttachment(null);
    setIsSending(true);
    try {
      const response = await fetch('/api/assistant', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: messageText, history: messages.slice(-20), image: attachment?.dataUrl ?? null }) });
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
    {attachment && <div className="mb-2 flex items-center gap-2 rounded-xl bg-violet-50 p-2 text-xs text-violet-800">{attachment.dataUrl.startsWith('data:image') && <img src={attachment.dataUrl} alt="Eklenen görsel" className="h-10 w-10 rounded-lg object-cover" />}<span className="min-w-0 flex-1 truncate">{attachment.name}</span><button type="button" onClick={() => setAttachment(null)} aria-label="Dosyayı kaldır"><X className="h-4 w-4" /></button></div>}
    <div className="mb-2 flex gap-2"><label className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600"><Paperclip className="h-3.5 w-3.5" /> Dosya<input type="file" accept="image/*" className="sr-only" onChange={(event) => handleFile(event.target.files?.[0])} /></label><input value={imagePrompt} onChange={(event) => setImagePrompt(event.target.value)} placeholder="Resim oluştur: ör. mor gökyüzü" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1 text-xs" /><button type="button" onClick={generateImage} disabled={!imagePrompt.trim() || isGenerating} className="flex items-center gap-1 rounded-lg bg-sky-600 px-2 py-1 text-xs text-white disabled:opacity-50"><ImagePlus className="h-3.5 w-3.5" />{isGenerating ? '...' : 'Oluştur'}</button></div>
    <div className="flex gap-2"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) sendMessage(); }} placeholder="Asistana bir şey sor..." className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400" /><button type="button" onClick={sendMessage} disabled={isSending} className="rounded-xl bg-violet-600 px-3 text-white disabled:cursor-wait disabled:opacity-60" aria-label="Mesaj gönder">{isSending ? '...' : <Send className="h-4 w-4" />}</button></div>
    <p className="mt-2 text-[11px] text-slate-400">Gemini bağlantısı varsa yanıtlar kişiselleştirilir; bağlantı yoksa temel öneriler gösterilir.</p>
  </section>;
}
