import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!query) return res.status(400).json({ error: 'Search query is required' });
  const key = process.env.GCP_API_KEY;
  if (!key) return res.status(500).json({ error: 'YouTube API is not configured' });

  const params = new URLSearchParams({ part: 'snippet', q: query, type: 'video', maxResults: '12', safeSearch: 'strict', key });
  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
  const payload = await response.json() as { items?: Array<{ id?: { videoId?: string }; snippet?: { title?: string; description?: string; channelTitle?: string; thumbnails?: { medium?: { url?: string } } } }>; error?: { message?: string } };
  if (!response.ok) return res.status(response.status).json({ error: payload.error?.message ?? 'YouTube search failed' });

  return res.status(200).json({ results: (payload.items ?? []).filter((item) => item.id?.videoId).map((item) => ({
    id: item.id?.videoId,
    title: item.snippet?.title ?? '',
    description: item.snippet?.description ?? '',
    channelTitle: item.snippet?.channelTitle ?? '',
    thumbnail: item.snippet?.thumbnails?.medium?.url ?? '',
    url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
  })) });
}
