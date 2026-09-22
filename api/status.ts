export default function handler(_req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({ ai: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL), youtube: Boolean(process.env.YOUTUBE_API_KEY) })
}
