export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured' });
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message) return res.status(400).json({ error: 'Missing message' });

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ systemInstruction: { parts: [{ text: 'Sen Klas Sosyal uygulamasının kişisel asistanısın. Türkçe, kısa, yararlı ve güvenli cevaplar ver. Kullanıcının isteğini kişiselleştirmek için nazikçe bağlam sor.' }] }, contents: [{ role: 'user', parts: [{ text: message }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 500 } }) });
  if (!response.ok) return res.status(502).json({ error: 'Gemini request failed' });
  const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join(' ').trim();
  return res.status(200).json({ text: text || 'Şu anda cevap oluşturamadım.' });
}
