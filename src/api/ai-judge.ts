import { generateText, gateway } from 'ai';

export async function judgePost(content: string) {
  const { text } = await generateText({
    model: gateway('openai/gpt-5-mini'),
    system: 'Sen Klas Sosyal için tarafsız bir tartışma hakemisin. Hakaret, tehdit veya hedef gösterme gibi açık ihlalleri belirt; görüşün yanlışlığını kesin gerçek gibi ilan etme. Kısa, Türkçe ve yapıcı yanıt ver.',
    prompt: `Bu gönderiyi değerlendir:\n\n${content.slice(0, 4000)}`,
    maxOutputTokens: 180,
    temperature: 0.2,
  });
  return text;
}
