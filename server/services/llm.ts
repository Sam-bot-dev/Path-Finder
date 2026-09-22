import dotenv from 'dotenv'
import { generateWithGemini, isGeminiConfigured } from './gemini.js'

dotenv.config()

const EXPERIENTIAL_API_KEY = process.env.EXPERIENTIAL_API_KEY || process.env.OPENAI_API_KEY || ''
const EXPERIENTIAL_BASE_URL = process.env.EXPERIENTIAL_BASE_URL || 'https://api.experientiallabs.ai/v1'
const CHATGPT_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-5.6-luna']

export async function generateWithChatGPT(prompt: string, systemInstruction?: string): Promise<string> {
  if (!EXPERIENTIAL_API_KEY) {
    throw new Error('ChatGPT / Experiential API key not configured.')
  }

  let lastError: any = null

  for (const model of CHATGPT_MODELS) {
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
        signal: AbortSignal.timeout(30000)
      })

      if (!response.ok) {
        const errorBody = await response.text()
        console.warn(`ChatGPT (${model}) error ${response.status}:`, errorBody)
        lastError = new Error(`ChatGPT (${model}) error: ${errorBody}`)
        continue
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content
      if (content) {
        return content
      }
    } catch (err: any) {
      console.warn(`ChatGPT (${model}) failed:`, err.message)
      lastError = err
    }
  }

  throw lastError || new Error('All ChatGPT attempts failed.')
}

/**
 * Intelligent cascading AI generator:
 * 1. Tries ChatGPT (Experiential Labs) for heavy work.
 * 2. Cascades automatically to Google Gemini.
 */
export async function generateContentAI(prompt: string, systemInstruction?: string): Promise<{ text: string; provider: 'chatgpt' | 'gemini' }> {
  // First try ChatGPT if configured
  if (EXPERIENTIAL_API_KEY) {
    try {
      console.log('[AI Gateway] Attempting generation with ChatGPT / Experiential Labs...')
      const text = await generateWithChatGPT(prompt, systemInstruction)
      console.log('[AI Gateway] Successfully generated with ChatGPT.')
      return { text, provider: 'chatgpt' }
    } catch (chatGptError: any) {
      console.warn('[AI Gateway] ChatGPT unavailable, cascading to Gemini AI:', chatGptError.message)
    }
  }

  // Next try Google Gemini
  if (isGeminiConfigured()) {
    console.log('[AI Gateway] Generating with Google Gemini Model...')
    const text = await generateWithGemini(prompt, systemInstruction)
    console.log('[AI Gateway] Successfully generated with Google Gemini.')
    return { text, provider: 'gemini' }
  }

  throw new Error('No AI providers available.')
}

export function getAIStatus(): { chatgpt: boolean; gemini: boolean } {
  return {
    chatgpt: Boolean(EXPERIENTIAL_API_KEY),
    gemini: isGeminiConfigured()
  }
}
