export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!query) return res.status(400).json({ error: 'Missing query' });
  if (!process.env.GIPHY_API_KEY) return res.status(503).json({ error: 'GIPHY_API_KEY is not configured' });

  const params = new URLSearchParams({ api_key: process.env.GIPHY_API_KEY, q: query, limit: '12', rating: 'pg-13', lang: 'tr' });
  const response = await fetch(`https://api.giphy.com/v1/gifs/search?${params}`);
  if (!response.ok) return res.status(502).json({ error: 'GIPHY request failed' });
  const data = await response.json() as { data?: Array<{ id: string; title?: string; images?: { original?: { url?: string }; fixed_width?: { url?: string } } }> };
  const results = (data.data ?? []).map((item) => ({ id: item.id, title: item.title ?? 'GIF', url: item.images?.original?.url ?? item.images?.fixed_width?.url })).filter((item): item is { id: string; title: string; url: string } => Boolean(item.url));
  return res.status(200).json({ results });
}
