export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const topic = body?.topic ? String(body.topic).trim() : ''
  const questionCount = Math.max(5, Math.min(10, Number(body?.questionCount) || 5))
  const level = body?.level || 'All levels'

  if (!topic) return res.status(400).json({ error: 'Topic is required.' })

  const apiKey = process.env.GEMINI_API_KEY
  if (apiKey) {
    try {
      const prompt = `Topic: "${topic}". Difficulty: ${level}. Generate exactly ${questionCount} diagnostic multiple-choice questions. Output JSON: {"questions": [{"id": "q1", "skill": "Skill name", "prompt": "Question text", "options": ["A","B","C","D"], "answer": 0, "explanation": "Explanation"}]}`
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        }),
        signal: AbortSignal.timeout(40000)
      })
      if (response.ok) {
        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) {
          const parsed = JSON.parse(text)
          if (Array.isArray(parsed.questions)) {
            return res.status(200).json({
              topic,
              questions: parsed.questions.slice(0, questionCount),
              source: 'ai'
            })
          }
        }
      }
    } catch {
      // fallback below
    }
  }

  // Fallback
  const baseSkills = ['Core Foundations', 'Key Mechanisms', 'Problem Solving', 'Pitfalls & Edge Cases', 'Systemic Applications', 'Synthesis']
  const questions = baseSkills.slice(0, questionCount).map((skill, idx) => ({
    id: `q-${idx + 1}-${Date.now()}`,
    skill: `${topic}: ${skill}`,
    prompt: `When analyzing ${topic}, what is the fundamental requirement for understanding ${skill}?`,
    options: ['Grasping core definitions and boundary rules', 'Ignoring edge cases', 'Memorizing outputs without principles', 'Assuming random factors dominate'],
    answer: 0,
    explanation: `Understanding foundational definitions is critical to mastering ${skill} in ${topic}.`
  }))

  return res.status(200).json({ topic, questions, source: 'curated' })
}
