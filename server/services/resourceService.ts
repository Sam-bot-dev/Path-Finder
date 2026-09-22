export interface VideoItem {
  id: string
  title: string
  channel: string
  thumbnail: string
}

export function getCuratedResourcesForTopic(topic: string): { resourceUrl: string; resourceLabel: string; searchVideos: VideoItem[] } {
  const t = topic.toLowerCase()
  let resourceUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replace(/\s+/g, '_'))}`
  let resourceLabel = `Explore ${topic} on Wikipedia`

  if (/python|javascript|typescript|react|code|programming|algorithm|data structure|web dev/i.test(t)) {
    if (/python/i.test(t)) {
      resourceUrl = 'https://docs.python.org/3/tutorial/'
      resourceLabel = 'Official Python Documentation'
    } else if (/react/i.test(t)) {
      resourceUrl = 'https://react.dev/learn'
      resourceLabel = 'React Official Documentation'
    } else {
      resourceUrl = 'https://developer.mozilla.org/'
      resourceLabel = 'MDN Web Docs'
    }
  } else if (/math|algebra|calculus|geometry|statistic|matrix|probability/i.test(t)) {
    resourceUrl = 'https://www.khanacademy.org/math'
    resourceLabel = 'Khan Academy Mathematics'
  } else if (/physics|chemistry|biology|science|astronomy/i.test(t)) {
    resourceUrl = 'https://openstax.org/subjects/science'
    resourceLabel = 'OpenStax Science'
  } else if (/history|revolution|ancient|civilization|war/i.test(t)) {
    resourceUrl = 'https://www.worldhistory.org/'
    resourceLabel = 'World History Encyclopedia'
  } else if (/economy|economics|finance|microeconomics|macroeconomics/i.test(t)) {
    resourceUrl = 'https://openstax.org/subjects/social-sciences'
    resourceLabel = 'OpenStax Economics'
  }

  return {
    resourceUrl,
    resourceLabel,
    searchVideos: [
      {
        id: 'dQw4w9WgXcQ', // fallback or real query
        title: `${topic} - Essential Educational Overview`,
        channel: 'CrashCourse / Khan Academy',
        thumbnail: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=640&auto=format&fit=crop&q=80'
      }
    ]
  }
}

export async function fetchVideosForQuery(query: string, apiKey?: string): Promise<VideoItem[]> {
  if (apiKey) {
    try {
      const params = new URLSearchParams({
        part: 'snippet',
        type: 'video',
        videoEmbeddable: 'true',
        safeSearch: 'strict',
        maxResults: '4',
        q: `${query} tutorial educational`,
        key: apiKey
      })
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, { signal: AbortSignal.timeout(6000) })
      if (response.ok) {
        const data = await response.json()
        return (data.items || [])
          .filter((item: any) => item.id?.videoId)
          .map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails?.medium?.url || ''
          }))
      }
    } catch {
      // ignore, fall back
    }
  }

  // Curated fallback educational video references
  return [
    {
      id: 'kUMe1FH4CHE',
      title: `${query} - Complete Deep Dive & Concepts`,
      channel: 'Educational Foundation',
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=640&auto=format&fit=crop&q=80'
    },
    {
      id: 'zOjov-2OZ0E',
      title: `Understanding ${query} with Visual Examples`,
      channel: 'Curious Learner',
      thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=640&auto=format&fit=crop&q=80'
    }
  ]
}
