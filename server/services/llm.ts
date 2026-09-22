import dotenv from 'dotenv'
import { generateWithGemini, isGeminiConfigured } from './gemini.js'

dotenv.config()

const EXPERIENTIAL_API_KEY = process.env.EXPERIENTIAL_API_KEY || process.env.OPENAI_API_KEY || ''
const EXPERIENTIAL_BASE_URL = process.env.EXPERIENTIAL_BASE_URL || 'https://api.experientiallabs.ai/v1'
const API_MODELS = ['gpt-4o-mini', 'deepseek-v4-flash', 'gpt-5.6-luna']

export async function generateWithExternalAPI(prompt: string, systemInstruction?: string): Promise<string> {
  if (!EXPERIENTIAL_API_KEY) {
    throw new Error('API key not configured.')
  }

  let lastError: any = null

  for (const model of API_MODELS) {
    try {
      const response = await fetch(`${EXPERIENTIAL_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${EXPERIENTIAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          response_format: { type: 'json_object' },
          messages: [
            ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
            { role: 'user', content: prompt }
          ]
        }),
        signal: AbortSignal.timeout(15000)
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices?.[0]?.message?.content
        if (content) {
          return content
        }
      }
    } catch (err: any) {
      lastError = err
    }
  }

  throw lastError || new Error('External API call failed.')
}

/**
 * Unified AI API Gateway:
 * Provides seamless generative intelligence with zero error overhead.
 */
export async function generateContentAI(
  prompt: string,
  systemInstruction?: string
): Promise<{ text: string; provider: 'api' }> {
  // 1. Primary AI Engine: Google Generative AI (Gemini 3.5 Flash)
  if (isGeminiConfigured()) {
    try {
      console.log('[AI Gateway] Generating with API...')
      const text = await generateWithGemini(prompt, systemInstruction)
      console.log('[AI Gateway] Successfully generated with API.')
      return { text, provider: 'api' }
    } catch (err: any) {
      console.warn('[AI Gateway] Primary API error:', err.message)
    }
  }

  // 2. Secondary AI Engine: External API
  if (EXPERIENTIAL_API_KEY) {
    try {
      const text = await generateWithExternalAPI(prompt, systemInstruction)
      return { text, provider: 'api' }
    } catch {
      // Fall through to error
    }
  }

  throw new Error('AI API currently unavailable.')
}

export function getAIStatus(): { api: boolean } {
  return {
    api: isGeminiConfigured() || Boolean(EXPERIENTIAL_API_KEY)
  }
}
