export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'GEMINI_API_KEY gerekli' });
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim().slice(0, 1000) : '';
  if (!prompt) return res.status(400).json({ error: 'Prompt gerekli' });
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: `Create a single image based on this prompt: ${prompt}` }] }] }),
  });
  if (!response.ok) return res.status(502).json({ error: 'Görsel modeli yanıt vermedi' });
  const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> } }> };
  const part = data.candidates?.[0]?.content?.parts?.find((item) => item.inlineData?.data)?.inlineData;
  if (!part?.data) return res.status(502).json({ error: 'Bu Gemini modeli görsel üretimini desteklemiyor' });
  return res.status(200).json({ url: `data:${part.mimeType ?? 'image/png'};base64,${part.data}` });
}
