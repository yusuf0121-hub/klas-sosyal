export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.GROQ_API_KEY) return res.status(503).json({ error: 'GROQ_API_KEY is not configured' });
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message) return res.status(400).json({ error: 'Missing message' });

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: JSON.stringify({ model: 'openai/gpt-oss-20b', messages: [{ role: 'system', content: 'Sen Klas Sosyal uygulamasının kişisel asistanısın. Türkçe, kısa, yararlı ve güvenli cevaplar ver. Kullanıcının isteğini kişiselleştirmek için nazikçe bağlam sor.' }, { role: 'user', content: message }], temperature: 0.7, max_tokens: 500 }) });
  if (!response.ok) return res.status(502).json({ error: 'Groq request failed' });
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content?.trim();
  return res.status(200).json({ text: text || 'Şu anda cevap oluşturamadım.' });
}
