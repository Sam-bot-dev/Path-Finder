import dotenv from 'dotenv'
dotenv.config()

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
const FALLBACK_MODELS = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-2.5-pro']

export async function generateWithGemini(prompt: string, systemInstruction?: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured.')
  }

  const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS.filter(m => m !== PRIMARY_MODEL)]
  let lastError: any = null

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`

      const payload: any = {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        }
      }

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }]
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(45000),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.warn(`Gemini model ${model} error (${response.status}):`, errorText)
        lastError = new Error(`Gemini API error (${response.status}): ${errorText}`)
        // If 404 or 503, try next model
        continue
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) {
        throw new Error('Empty response from Gemini.')
      }

      return text
    } catch (err: any) {
      console.warn(`Attempt with ${model} failed:`, err.message)
      lastError = err
    }
  }

  throw lastError || new Error('All Gemini models failed.')
}

export function isGeminiConfigured(): boolean {
  return Boolean(GEMINI_API_KEY)
}
