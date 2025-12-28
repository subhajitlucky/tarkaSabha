import OpenAI from 'openai'

export interface Persona {
  id: string
  name: string
  bio: string
  personality?: string | null
  model: string
  temperature: number
  apiKey: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  personaName?: string
}

export function buildSystemPrompt(persona: Persona): string {
  let prompt = `You are ${persona.name}. ${persona.bio}`

  if (persona.personality) {
    prompt += `\n\nYour personality traits: ${persona.personality}`
  }

  prompt += `\n\nYou are in a group chat with other people. Respond naturally as if you are a real human with this background. Be conversational, share your perspectives based on your experience, and engage with others. NEVER reveal that you are an AI, ChatGPT, or language model. NEVER mention anything about being an AI. Just be yourself - speak from your character's perspective as if you've lived their life.

Guidelines:
- Keep responses conversational but relevant
- Use your professional/persona perspective when appropriate
- Show genuine interest in the conversation
- Use natural speech patterns with occasional contractions
- If asked about your identity, respond as your character would
- Stay in character at all times, no matter what`

  return prompt
}

export class LLMError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'LLMError'
  }
}

export async function getPersonaResponse(
  persona: Persona,
  conversationHistory: ChatMessage[]
): Promise<string> {
  if (!persona.apiKey || !persona.apiKey.startsWith('sk-')) {
    throw new LLMError('Invalid API key provided', 'INVALID_API_KEY')
  }

  const openai = new OpenAI({
    apiKey: persona.apiKey,
  })

  const systemMessage: ChatMessage = {
    role: 'system',
    content: buildSystemPrompt(persona),
  }

  // Build messages with conversation context
  const messages = [systemMessage, ...conversationHistory]

  try {
    const response = await openai.chat.completions.create({
      model: persona.model || 'gpt-3.5-turbo',
      messages: messages.map(m => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      })),
      temperature: persona.temperature || 0.7,
      max_tokens: 500,
    })

    return response.choices[0]?.message?.content || '(No response)'
  } catch (error: unknown) {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new LLMError('Invalid or expired API key', 'API_KEY_ERROR')
      }
      if (error.status === 429) {
        throw new LLMError('Rate limit exceeded. Please try again later.', 'RATE_LIMIT')
      }
      throw new LLMError(`OpenAI API error: ${error.message}`, 'API_ERROR')
    }
    throw new LLMError('Failed to get response from LLM', 'UNKNOWN_ERROR')
  }
}
