import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { generateWithGemini, isGeminiConfigured } from './services/gemini.js'
import {
  generatePedagogicalDiagnostic,
  generatePedagogicalPath,
  type DiagnosticQuestion,
  type LearningLesson
} from './services/pedagogy.js'
import {
  fetchVideosForQuery,
  getCuratedResourcesForTopic
} from './services/resourceService.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '2mb' }))

// Health / Status endpoint
app.get('/api/status', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.json({
    status: 'ok',
    ai: isGeminiConfigured(),
    provider: 'gemini',
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    youtube: Boolean(process.env.YOUTUBE_API_KEY),
    timestamp: new Date().toISOString()
  })
})

// Generate 5-10 diagnostic questions for any topic
app.post('/api/diagnostic', async (req, res) => {
  try {
    const { topic, questionCount = 5, level = 'All levels' } = req.body
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide a valid topic name.' })
    }

    const cleanTopic = topic.trim().slice(0, 150)
    const count = Math.max(5, Math.min(10, Number(questionCount) || 5))

    console.log(`[Diagnostic] Generating ${count} questions for topic: "${cleanTopic}" (Level: ${level})`)

    if (isGeminiConfigured()) {
      try {
        const prompt = `You are a master educator crafting a diagnostic assessment for a student exploring the topic: "${cleanTopic}".
Difficulty Level: ${level}.
Generate exactly ${count} diagnostic multiple-choice questions testing distinct essential subskills in progressive pedagogical order.

Output ONLY a JSON object with this exact structure:
{
  "questions": [
    {
      "id": "q1",
      "skill": "Specific Subskill / Competency Name",
      "prompt": "A clear, well-phrased educational question testing this skill",
      "options": [
        "First option",
        "Second option",
        "Third option",
        "Fourth option"
      ],
      "answer": 0,
      "explanation": "Clear pedagogical explanation of why this answer is correct and the misconception behind distractors."
    }
  ]
}

Constraints:
- Exactly ${count} questions.
- Exactly 4 distinct options per question.
- "answer" must be the 0-based integer index of the correct option (0, 1, 2, or 3).
- Realistic distractors reflecting common student misconceptions.
- Output valid JSON only, no markdown backticks, no preamble.`

        const rawJson = await generateWithGemini(prompt, 'You are an educational curriculum assessment specialist. Always return valid JSON matching the requested schema.')
        const parsed = JSON.parse(rawJson)

        if (Array.isArray(parsed.questions) && parsed.questions.length >= 5) {
          const validatedQuestions: DiagnosticQuestion[] = parsed.questions.slice(0, count).map((q: any, i: number) => ({
            id: String(q.id || `q-${i + 1}-${Date.now()}`),
            skill: String(q.skill || `Skill ${i + 1}`),
            prompt: String(q.prompt || `Question ${i + 1}`),
            options: Array.isArray(q.options) && q.options.length === 4 ? q.options.map(String) : [
              'Correct answer', 'Plausible alternative', 'Common misconception', 'Edge case'
            ],
            answer: typeof q.answer === 'number' && q.answer >= 0 && q.answer < 4 ? q.answer : 0,
            explanation: String(q.explanation || 'Understanding this skill is foundational to mastering this topic.')
          }))

          console.log(`[Diagnostic] Successfully generated ${validatedQuestions.length} questions via Gemini.`)
          return res.json({
            topic: cleanTopic,
            questions: validatedQuestions,
            source: 'ai'
          })
        }
      } catch (geminiError: any) {
        console.warn('[Diagnostic] Gemini generation error, using pedagogical generator:', geminiError.message)
      }
    }

    // High quality resilient fallback
    const fallbackQuestions = generatePedagogicalDiagnostic(cleanTopic, count)
    return res.json({
      topic: cleanTopic,
      questions: fallbackQuestions,
      source: 'curated'
    })
  } catch (err: any) {
    console.error('[Diagnostic] Error:', err)
    return res.status(500).json({ error: 'Failed to generate diagnostic check-in.' })
  }
})

// Generate personalized learning path based on student answers
app.post('/api/path', async (req, res) => {
  try {
    const { topic, questions, answers } = req.body
    if (!topic || !Array.isArray(questions) || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid request: topic, questions, and answers are required.' })
    }

    const cleanTopic = String(topic).trim()
    const curated = getCuratedResourcesForTopic(cleanTopic)
    const total = questions.length
    const correctCount = questions.filter((q: any, i: number) => q.answer === answers[i]).length
    const score = Math.round((correctCount / total) * 100)

    console.log(`[Path] Generating personalized path for "${cleanTopic}" (${correctCount}/${total} correct, ${score}%)`)

    if (isGeminiConfigured()) {
      try {
        const studentPerformance = questions.map((q: any, i: number) => ({
          skill: q.skill,
          question: q.prompt,
          isCorrect: q.answer === answers[i],
          studentChoice: q.options[answers[i]],
          correctChoice: q.options[q.answer]
        }))

        const prompt = `You are a personalized learning path architect. Design an adaptive curriculum for a student learning "${cleanTopic}".
The student answered ${correctCount} of ${total} diagnostic check-in questions correctly (${score}%).

Student Diagnostic Results by Skill:
${JSON.stringify(studentPerformance, null, 2)}

Create a personalized learning path with exactly ${total} modules, one for each skill in sequence.
Personalization instructions:
- For skills where isCorrect is FALSE: Focus Module. The student struggled here. Provide a comprehensive breakdown (3 full paragraphs, 10-14 minutes), starting from fundamental intuition, common mistakes, and real-world analogies. Include a practical worked example with step-by-step resolution. Create 2 new practice questions to test recovery.
- For skills where isCorrect is TRUE: Refresher Module. The student demonstrated competence. Provide a concise review with advanced nuances (2-3 paragraphs, 6-8 minutes), an advanced application example, and 2 challenging practice questions.

Output ONLY a JSON object with this structure:
{
  "modules": [
    {
      "id": "m1",
      "title": "Module Title",
      "description": "Clear overview of what the student will learn",
      "minutes": 10,
      "content": [
        "First substantive instructional paragraph explaining core concepts...",
        "Second paragraph detailing mechanisms, analogies, or code/math...",
        "Third paragraph explaining practical execution and synthesis..."
      ],
      "example": {
        "title": "Worked Example Title",
        "text": "Detailed step-by-step problem walkthrough..."
      },
      "practice": [
        {
          "id": "p1-1",
          "skill": "Skill name",
          "prompt": "Practice question 1",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": 0,
          "explanation": "Why this is correct"
        },
        {
          "id": "p1-2",
          "skill": "Skill name",
          "prompt": "Practice question 2",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": 1,
          "explanation": "Why this is correct"
        }
      ],
      "videoQuery": "${cleanTopic} skill tutorial",
      "resourceUrl": "${curated.resourceUrl}",
      "resourceLabel": "${curated.resourceLabel}"
    }
  ]
}`

        const rawJson = await generateWithGemini(prompt, 'You are an adaptive curriculum architect. Output valid JSON matching the requested schema.')
        const parsed = JSON.parse(rawJson)

        if (Array.isArray(parsed.modules) && parsed.modules.length >= total) {
          const modules: LearningLesson[] = parsed.modules.slice(0, total).map((m: any, i: number) => {
            const isCorrect = answers[i] === questions[i].answer
            return {
              id: String(m.id || `m-${i + 1}-${Date.now()}`),
              title: String(m.title || `${isCorrect ? 'Refresher' : 'Deep Dive'}: ${questions[i].skill}`),
              description: String(m.description || `Mastering ${questions[i].skill}`),
              minutes: Number(m.minutes) || (isCorrect ? 7 : 12),
              content: Array.isArray(m.content) && m.content.length >= 2 ? m.content.map(String) : [
                `In this lesson, we explore ${questions[i].skill}.`,
                `Understanding the core principles allows you to solve real problems effectively.`
              ],
              example: {
                title: String(m.example?.title || `Example: ${questions[i].skill}`),
                text: String(m.example?.text || `Step-by-step application in ${cleanTopic}.`)
              },
              practice: Array.isArray(m.practice) && m.practice.length >= 2 ? m.practice.map((p: any, pIdx: number) => ({
                id: String(p.id || `p-${i + 1}-${pIdx + 1}`),
                skill: questions[i].skill,
                prompt: String(p.prompt || `Practice question on ${questions[i].skill}`),
                options: Array.isArray(p.options) && p.options.length === 4 ? p.options.map(String) : [
                  'Option 1', 'Option 2', 'Option 3', 'Option 4'
                ],
                answer: typeof p.answer === 'number' && p.answer >= 0 && p.answer < 4 ? p.answer : 0,
                explanation: String(p.explanation || 'Solid practice reinforces lasting mastery.')
              })) : [
                {
                  id: `p-${i + 1}-1`,
                  skill: questions[i].skill,
                  prompt: `How can you best apply ${questions[i].skill} in practice?`,
                  options: ['Systematic verification', 'Arbitrary guesswork', 'Skipping checks', 'None of the above'],
                  answer: 0,
                  explanation: 'Systematic approach is key.'
                },
                {
                  id: `p-${i + 1}-2`,
                  skill: questions[i].skill,
                  prompt: `What is the most critical check for ${questions[i].skill}?`,
                  options: ['Boundary condition testing', 'Ignoring inputs', 'Assuming success', 'Random tests'],
                  answer: 0,
                  explanation: 'Boundary checks guarantee correctness.'
                }
              ],
              videoQuery: String(m.videoQuery || `${cleanTopic} ${questions[i].skill}`),
              resourceUrl: String(m.resourceUrl || curated.resourceUrl),
              resourceLabel: String(m.resourceLabel || curated.resourceLabel),
              focus: !isCorrect
            }
          })

          console.log(`[Path] Successfully created ${modules.length} modules via Gemini.`)
          return res.json({
            id: crypto.randomUUID(),
            topicId: cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            topicName: cleanTopic,
            createdAt: new Date().toISOString(),
            score,
            answers,
            questions,
            modules,
            completed: [],
            read: [],
            practiceScores: {},
            source: 'ai'
          })
        }
      } catch (geminiError: any) {
        console.warn('[Path] Gemini generation failed, using pedagogical generator:', geminiError.message)
      }
    }

    // High quality pedagogical fallback
    const fallbackModules = generatePedagogicalPath(
      cleanTopic,
      questions,
      answers,
      curated.resourceUrl,
      curated.resourceLabel
    )

    return res.json({
      id: crypto.randomUUID(),
      topicId: cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      topicName: cleanTopic,
      createdAt: new Date().toISOString(),
      score,
      answers,
      questions,
      modules: fallbackModules,
      completed: [],
      read: [],
      practiceScores: {},
      source: 'curated'
    })
  } catch (err: any) {
    console.error('[Path] Error:', err)
    return res.status(500).json({ error: 'Failed to generate personalized learning path.' })
  }
})

// Legacy AI endpoint adapter
app.post('/api/ai', async (req, res) => {
  const { action, topic, skills, results, resourceUrl } = req.body
  if (action === 'diagnostic') {
    req.body.questionCount = Array.isArray(skills) ? skills.length : 5
    // forward to /api/diagnostic logic
    try {
      const prompt = `Topic: "${topic}". Skills to assess in order: ${JSON.stringify(skills)}.
Generate 1 multiple choice question for each skill.
Format as JSON: { "questions": [ { "id": "q1", "skill": "...", "prompt": "...", "options": ["A","B","C","D"], "answer": 0, "explanation": "..." } ] }`
      const rawJson = await generateWithGemini(prompt)
      return res.json(JSON.parse(rawJson))
    } catch {
      return res.json({ questions: generatePedagogicalDiagnostic(topic || 'General Learning', (skills || []).length || 5) })
    }
  } else if (action === 'path') {
    const questions = (results || []).map((r: any, i: number) => ({
      id: `q-${i}`,
      skill: r.skill,
      prompt: `Skill check for ${r.skill}`,
      options: ['A', 'B', 'C', 'D'],
      answer: r.correct ? 0 : 1,
      explanation: 'Explanation'
    }))
    const answers = (results || []).map((r: any) => (r.correct ? 0 : 2))
    const modules = generatePedagogicalPath(topic || 'Learning Path', questions, answers, resourceUrl || 'https://www.khanacademy.org', 'Educational Resource')
    return res.json({ modules })
  }
  return res.status(400).json({ error: 'Unknown action' })
})

// Educational video search
app.get('/api/videos', async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  if (!query) {
    return res.json({ videos: [] })
  }
  const videos = await fetchVideosForQuery(query, process.env.YOUTUBE_API_KEY)
  return res.json({ videos, source: process.env.YOUTUBE_API_KEY ? 'youtube' : 'curated' })
})

// Topic auto-suggestions
app.get('/api/topics/suggest', (_req, res) => {
  res.json({
    suggestions: [
      { name: 'Linear Algebra & Vectors', category: 'Mathematics', icon: 'algebra' },
      { name: 'React Hooks & State Management', category: 'Technology', icon: 'code' },
      { name: 'Quantum Mechanics Foundations', category: 'Science', icon: 'atom' },
      { name: 'Microeconomics & Game Theory', category: 'Humanities', icon: 'chart' },
      { name: 'Machine Learning Fundamentals', category: 'Technology', icon: 'brain' },
      { name: 'Photosynthesis & Plant Biology', category: 'Science', icon: 'leaf' },
      { name: 'Ancient Roman Republic', category: 'Humanities', icon: 'globe' },
      { name: 'Creative Essay & Story Writing', category: 'Humanities', icon: 'pen' }
    ]
  })
})

export default app

// If executed directly via node/tsx
if (process.argv[1] && process.argv[1].endsWith('index.ts')) {
  app.listen(PORT, () => {
    console.log(`🚀 Path-Finder Backend API running on http://localhost:${PORT}`)
    console.log(`   AI Provider: Gemini (${isGeminiConfigured() ? 'Active' : 'No Key'})`)
  })
}
