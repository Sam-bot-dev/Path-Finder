export default function handler(_req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store')
  const aiReady = Boolean(
    process.env.GEMINI_API_KEY ||
    (process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL)
  )
  res.status(200).json({
    status: 'ok',
    ai: aiReady,
    provider: process.env.GEMINI_API_KEY ? 'gemini' : (process.env.OPENAI_API_KEY ? 'openai' : 'curated'),
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    youtube: Boolean(process.env.YOUTUBE_API_KEY)
  })
}
