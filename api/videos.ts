export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET.' })
  if (!process.env.YOUTUBE_API_KEY) return res.status(200).json({ videos: [], source: 'search' })
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  if (!query || query.length > 180) return res.status(400).json({ error: 'Provide a valid search query.' })
  try {
    const params = new URLSearchParams({ part: 'snippet', type: 'video', videoEmbeddable: 'true', safeSearch: 'strict', maxResults: '3', q: query, key: process.env.YOUTUBE_API_KEY })
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, { signal: AbortSignal.timeout(10000) })
    if (!response.ok) return res.status(200).json({ videos: [], source: 'search' })
    const data = await response.json()
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
    return res.status(200).json({ videos: (data.items || []).filter((item: any) => item.id?.videoId).map((item: any) => ({ id: item.id.videoId, title: item.snippet.title, channel: item.snippet.channelTitle, thumbnail: item.snippet.thumbnails?.medium?.url || '' })), source: 'youtube' })
  } catch { return res.status(200).json({ videos: [], source: 'search' }) }
}
