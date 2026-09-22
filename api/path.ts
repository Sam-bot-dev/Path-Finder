export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const { topic, questions, answers } = body || {}

  if (!topic || !Array.isArray(questions) || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Invalid request: topic, questions, and answers are required.' })
  }

  const score = Math.round(questions.filter((q: any, i: number) => q.answer === answers[i]).length / questions.length * 100)
  const apiKey = process.env.GEMINI_API_KEY

  if (apiKey) {
    try {
      const prompt = `Topic: "${topic}". Student answers: ${JSON.stringify(answers)}. Questions: ${JSON.stringify(questions.map((q: any) => q.skill))}.
Generate a personalized learning path with ${questions.length} modules. For skills answered incorrectly, mark focus: true, provide deeper explanation (3 paragraphs) and 2 practice questions.
Format as JSON: {"modules": [{"id": "m1", "title": "...", "description": "...", "minutes": 10, "content": ["..."], "example": {"title": "...", "text": "..."}, "practice": [{"id": "p1", "skill": "...", "prompt": "...", "options": ["A","B","C","D"], "answer": 0, "explanation": "..."}], "videoQuery": "...", "resourceUrl": "https://en.wikipedia.org/wiki/${encodeURIComponent(topic)}", "resourceLabel": "Wikipedia Reference", "focus": true}]}`

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        }),
        signal: AbortSignal.timeout(50000)
      })

      if (response.ok) {
        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) {
          const parsed = JSON.parse(text)
          if (Array.isArray(parsed.modules) && parsed.modules.length >= questions.length) {
            return res.status(200).json({
              id: crypto.randomUUID(),
              topicId: topic.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              topicName: topic,
              createdAt: new Date().toISOString(),
              score,
              answers,
              questions,
              modules: parsed.modules.slice(0, questions.length),
              completed: [],
              read: [],
              practiceScores: {},
              source: 'ai'
            })
          }
        }
      }
    } catch {
      // fallback below
    }
  }

  // Fallback modules
  const modules = questions.map((q: any, i: number) => {
    const isCorrect = q.answer === answers[i]
    return {
      id: `mod-${i + 1}-${Date.now()}`,
      title: `${isCorrect ? 'Refresher' : 'Deep Dive'}: ${q.skill}`,
      description: isCorrect ? 'Quick review and advanced synthesis' : 'Essential foundation building and practice',
      minutes: isCorrect ? 7 : 12,
      content: [
        `In this lesson, we study ${q.skill}.`,
        `Focusing on core mechanisms ensures long-term retention and mastery of ${topic}.`
      ],
      example: {
        title: `Example: ${q.skill}`,
        text: `Applying ${q.skill} systematically to solve problems.`
      },
      practice: [
        {
          id: `p-${i + 1}-1`,
          skill: q.skill,
          prompt: `What is the key principle behind ${q.skill}?`,
          options: ['Systematic verification', 'Random guessing', 'Skipping constraints', 'None'],
          answer: 0,
          explanation: 'Consistent systematic verification produces reliable outcomes.'
        },
        {
          id: `p-${i + 1}-2`,
          skill: q.skill,
          prompt: `How should edge cases be handled in ${q.skill}?`,
          options: ['Check boundary conditions explicitly', 'Ignore them', 'Assume they never occur', 'Delete them'],
          answer: 0,
          explanation: 'Boundary condition checks prevent failure in edge cases.'
        }
      ],
      videoQuery: `${topic} ${q.skill}`,
      resourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(topic)}`,
      resourceLabel: `${topic} on Wikipedia`,
      focus: !isCorrect
    }
  })

  return res.status(200).json({
    id: crypto.randomUUID(),
    topicId: topic.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    topicName: topic,
    createdAt: new Date().toISOString(),
    score,
    answers,
    questions,
    modules,
    completed: [],
    read: [],
    practiceScores: {},
    source: 'curated'
  })
}
