import type { LearningPath, Question, Topic, Video, ServiceStatus, Lesson } from './types'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
export const apiUrl = (endpoint: string) => `${API_BASE}/api/${endpoint}`

export function isQuestion(value: unknown): value is Question {
  if (!value || typeof value !== 'object') return false
  const q = value as Question
  return (
    typeof q.id === 'string' &&
    typeof q.skill === 'string' &&
    typeof q.prompt === 'string' &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    q.options.every(o => typeof o === 'string') &&
    Number.isInteger(q.answer) &&
    q.answer >= 0 &&
    q.answer < 4 &&
    typeof q.explanation === 'string'
  )
}

export function isLesson(value: unknown): value is Lesson {
  if (!value || typeof value !== 'object') return false
  const l = value as Lesson
  return (
    typeof l.id === 'string' &&
    typeof l.title === 'string' &&
    typeof l.description === 'string' &&
    Number.isFinite(l.minutes) &&
    l.minutes > 0 &&
    Array.isArray(l.content) &&
    l.content.length >= 2 &&
    l.content.every(c => typeof c === 'string') &&
    !!l.example &&
    typeof l.example.title === 'string' &&
    typeof l.example.text === 'string' &&
    Array.isArray(l.practice) &&
    l.practice.length >= 1 &&
    l.practice.every(isQuestion) &&
    typeof l.videoQuery === 'string' &&
    typeof l.resourceLabel === 'string' &&
    typeof l.resourceUrl === 'string' &&
    /^https?:\/\//.test(l.resourceUrl)
  )
}

export async function getServiceStatus(): Promise<ServiceStatus> {
  try {
    const response = await fetch(apiUrl('status'), { signal: AbortSignal.timeout(5000) })
    if (!response.ok) return { ai: false, youtube: false }
    const json = await response.json()
    return { ai: json.ai === true, youtube: json.youtube === true }
  } catch {
    return { ai: false, youtube: false }
  }
}

export interface LearningService {
  diagnostic(topicNameOrTopic: string | Topic, questionCount?: number, level?: string): Promise<{ topicName: string; questions: Question[]; source: 'curated' | 'ai' }>
  path(topicName: string, questions: Question[], answers: number[], source?: 'curated' | 'ai'): Promise<LearningPath>
}

export const learningService: LearningService = {
  async diagnostic(topicInput, questionCount = 5, level = 'All levels') {
    const topicName = typeof topicInput === 'string' ? topicInput : topicInput.name
    const count = Math.max(5, Math.min(10, questionCount))

    try {
      const response = await fetch(apiUrl('diagnostic'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicName, questionCount: count, level }),
        signal: AbortSignal.timeout(40000)
      })

      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data.questions) && data.questions.length >= 5 && data.questions.every(isQuestion)) {
          return { topicName, questions: data.questions, source: data.source || 'ai' }
        }
      }
    } catch {
      // fallback handled below
    }

    // If passed an existing curated topic and network fails
    if (typeof topicInput !== 'string' && topicInput?.questions?.length >= 5) {
      return { topicName, questions: topicInput.questions, source: 'curated' }
    }

    // Fallback generation for arbitrary topic
    const baseSkills = [
      'Foundational Principles',
      'Core Terminology & Patterns',
      'Applied Problem Solving',
      'Common Misconceptions & Edge Cases',
      'Systemic Synthesis & Integration',
      'Advanced Optimization & Metrics'
    ]
    const questions: Question[] = baseSkills.slice(0, count).map((skill, idx) => ({
      id: `q-${idx + 1}-${Date.now()}`,
      skill: `${topicName}: ${skill}`,
      prompt: `When investigating ${topicName}, what is the decisive factor for evaluating ${skill}?`,
      options: [
        'Adhering to core principles and verifying assumptions',
        'Relying purely on arbitrary guesses without checking',
        'Discarding evidence that contradicts initial expectations',
        'Assuming no methodology is required'
      ],
      answer: 0,
      explanation: `Systematic adherence to principles and boundary verification is the cornerstone of mastering ${skill}.`
    }))

    return { topicName, questions, source: 'curated' }
  },

  async path(topicName, questions, answers, source = 'ai') {
    const total = questions.length
    const correctCount = questions.filter((q, i) => q.answer === answers[i]).length
    const score = Math.round((correctCount / total) * 100)

    try {
      const response = await fetch(apiUrl('path'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicName, questions, answers, source }),
        signal: AbortSignal.timeout(50000)
      })

      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data.modules) && data.modules.length >= total && data.modules.every(isLesson)) {
          return {
            id: data.id || crypto.randomUUID(),
            topicId: topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            topicName,
            createdAt: data.createdAt || new Date().toISOString(),
            score,
            answers,
            questions,
            modules: data.modules,
            completed: [],
            read: [],
            practiceScores: {},
            source: data.source || 'ai'
          }
        }
      }
    } catch {
      // fallback below
    }

    // Fallback path creation
    const modules: Lesson[] = questions.map((q, i) => {
      const isCorrect = q.answer === answers[i]
      return {
        id: `mod-${i + 1}-${Date.now()}`,
        title: `${isCorrect ? 'Refresher' : 'Deep Dive'}: ${q.skill}`,
        description: isCorrect
          ? `A rapid review and advanced synthesis to cement your understanding.`
          : `Focused guidance, real-world examples, and targeted practice.`,
        minutes: isCorrect ? 7 : 12,
        content: [
          `Welcome to your lesson on ${q.skill} within ${topicName}.`,
          `Building intuitive understanding of this concept will unlock confident problem-solving across related domains.`,
          `Pay attention to how this connects with the other skills you explored during your check-in.`
        ],
        example: {
          title: `Key Example: Applying ${q.skill}`,
          text: `In practical scenarios involving ${topicName}, breaking down the challenge into fundamental steps ensures consistent accuracy.`
        },
        practice: [
          {
            id: `p-${i + 1}-1`,
            skill: q.skill,
            prompt: `What is the most effective approach to mastering ${q.skill}?`,
            options: [
              'Continuous deliberate practice with immediate feedback',
              'Passive reading without active recall',
              'Memorizing answers without understanding mechanisms',
              'Skipping fundamental steps'
            ],
            answer: 0,
            explanation: 'Deliberate practice with feedback establishes long-term conceptual retention.'
          },
          {
            id: `p-${i + 1}-2`,
            skill: q.skill,
            prompt: `When encountering an unfamiliar edge case in ${q.skill}, what should you do first?`,
            options: [
              'Return to first principles and verify known constraints',
              'Guess an answer randomly',
              'Assume the rules no longer apply',
              'Ignore the issue'
            ],
            answer: 0,
            explanation: 'Re-anchoring in first principles provides the clearest path forward under uncertainty.'
          }
        ],
        videoQuery: `${topicName} ${q.skill} tutorial`,
        resourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(topicName.replace(/\s+/g, '_'))}`,
        resourceLabel: `${topicName} Reference`,
        focus: !isCorrect
      }
    })

    return {
      id: crypto.randomUUID(),
      topicId: topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      topicName,
      createdAt: new Date().toISOString(),
      score,
      answers,
      questions,
      modules,
      completed: [],
      read: [],
      practiceScores: {},
      source: 'curated'
    }
  }
}

export const videoService = {
  async search(query: string): Promise<Video[]> {
    try {
      const response = await fetch(`${apiUrl('videos')}?q=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(10000) })
      if (!response.ok) return []
      const data = await response.json()
      return Array.isArray(data.videos) ? data.videos : []
    } catch {
      return []
    }
  },
}
