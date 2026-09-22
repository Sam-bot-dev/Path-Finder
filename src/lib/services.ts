import type { LearningPath, Question, Topic, Video, ServiceStatus, Lesson } from './types'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
export const apiUrl = (endpoint: string) => `${API_BASE}/api/${endpoint}`

export function isQuestion(value: unknown): value is Question {
  if (!value || typeof value !== 'object') return false
  const q = value as Question
  return typeof q.id === 'string' && typeof q.skill === 'string' && typeof q.prompt === 'string' && Array.isArray(q.options) && q.options.length === 4 && q.options.every(o => typeof o === 'string') && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4 && typeof q.explanation === 'string'
}
export function isLesson(value: unknown): value is Lesson {
  if (!value || typeof value !== 'object') return false
  const l = value as Lesson
  return typeof l.id === 'string' && typeof l.title === 'string' && typeof l.description === 'string' && Number.isFinite(l.minutes) && l.minutes > 0 && Array.isArray(l.content) && l.content.length >= 2 && l.content.every(c => typeof c === 'string') && !!l.example && typeof l.example.title === 'string' && typeof l.example.text === 'string' && Array.isArray(l.practice) && l.practice.length >= 2 && l.practice.every(isQuestion) && typeof l.videoQuery === 'string' && typeof l.resourceLabel === 'string' && typeof l.resourceUrl === 'string' && /^https:\/\/(www\.)?(khanacademy\.org|openstax\.org|docs\.python\.org|worldhistory\.org)(\/|$)/.test(l.resourceUrl)
}

export async function getServiceStatus(): Promise<ServiceStatus> {
  try {
    const response = await fetch(apiUrl('status'), { signal: AbortSignal.timeout(5000) })
    if (!response.ok) return { ai: false, youtube: false }
    const json = await response.json()
    return { ai: json.ai === true, youtube: json.youtube === true }
  } catch { return { ai: false, youtube: false } }
}

export interface LearningService {
  diagnostic(topic: Topic): Promise<{ questions: Question[]; source: 'curated' | 'ai' }>
  path(topic: Topic, questions: Question[], answers: number[], source: 'curated' | 'ai'): Promise<LearningPath>
}

function createPath(topic: Topic, questions: Question[], answers: number[], source: 'curated' | 'ai'): LearningPath {
  const score = Math.round(questions.filter((q, i) => q.answer === answers[i]).length / questions.length * 100)
  const modules = topic.lessons.map((module, index) => ({ ...module, focus: answers[index] !== questions[index]?.answer, minutes: answers[index] === questions[index]?.answer ? 6 : 10 }))
  return { id: crypto.randomUUID(), topicId: topic.id, topicName: topic.name, createdAt: new Date().toISOString(), score, answers, questions, modules, completed: [], read: [], practiceScores: {}, source }
}

export const learningService: LearningService = {
  async diagnostic(topic) {
    const status = await getServiceStatus()
    if (status.ai) {
      try {
        const response = await fetch(apiUrl('ai'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'diagnostic', topic: topic.name, skills: topic.questions.map(q => q.skill) }), signal: AbortSignal.timeout(30000) })
        if (!response.ok) throw new Error('AI unavailable')
        const data = await response.json()
        if (Array.isArray(data.questions) && data.questions.length === 5 && data.questions.every(isQuestion)) return { questions: data.questions, source: 'ai' }
      } catch { /* A complete, curated diagnostic remains available if the provider is unavailable. */ }
    }
    return { questions: topic.questions, source: 'curated' }
  },
  async path(topic, questions, answers, source) {
    const base = createPath(topic, questions, answers, source)
    if (source === 'ai') {
      try {
        const response = await fetch(apiUrl('ai'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'path', topic: topic.name, results: questions.map((q, i) => ({ skill: q.skill, correct: q.answer === answers[i] })), resourceUrl: topic.lessons[0].resourceUrl }), signal: AbortSignal.timeout(45000) })
        if (!response.ok) throw new Error('AI unavailable')
        const data = await response.json()
        if (Array.isArray(data.modules) && data.modules.length === 5 && data.modules.every(isLesson)) return { ...base, modules: data.modules.map((module: Lesson, i: number) => ({ ...module, focus: answers[i] !== questions[i].answer })), source: 'ai' }
      } catch { /* Preserve progress and use the curated, score-adapted path when generation fails. */ }
    }
    return { ...base, source: 'curated' }
  },
}

export const videoService = {
  async search(query: string): Promise<Video[]> {
    try {
      const response = await fetch(`${apiUrl('videos')}?q=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(10000) })
      if (!response.ok) return []
      const data = await response.json()
      return Array.isArray(data.videos) ? data.videos.filter((v: Video) => /^[\w-]{11}$/.test(v.id)) : []
    } catch { return [] }
  },
}
