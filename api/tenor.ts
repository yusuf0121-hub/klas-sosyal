export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!query) return res.status(400).json({ error: 'Missing query' });
  if (!process.env.TENOR_API_KEY) return res.status(503).json({ error: 'TENOR_API_KEY is not configured' });

  const params = new URLSearchParams({ q: query, key: process.env.TENOR_API_KEY, client_key: 'klas-sosyal', limit: '12', contentfilter: 'medium', media_filter: 'tinygif,gif' });
  const response = await fetch(`https://tenor.googleapis.com/v2/search?${params}`);
  if (!response.ok) return res.status(502).json({ error: 'Tenor request failed' });
  const data = await response.json() as { results?: Array<{ id: string; content_description?: string; media_formats?: { gif?: { url?: string }; tinygif?: { url?: string } } }> };
  const results = (data.results ?? []).map((item) => ({ id: item.id, title: item.content_description ?? 'GIF', url: item.media_formats?.gif?.url ?? item.media_formats?.tinygif?.url })).filter((item): item is { id: string; title: string; url: string } => Boolean(item.url));
  return res.status(200).json({ results });
}
