import { prisma } from './prisma'
import { getLLMResponse, LLMProviderFactory, ChatMessage } from './llm-provider'
import { rateLimitService } from './rate-limit'
import { cryptoService } from './crypto'
import { LLMError } from './llm-provider'
import {
  LLM_TIMEOUT_MS,
  MAX_RESPONSE_LENGTH,
  withTimeout,
  truncateResponse,
  sanitizeContent,
  validateMessageLength,
  isCircuitOpen,
  recordSuccess,
  recordFailure,
  detectLoop,
} from './llm-protection'
import type { Persona } from '@prisma/client'

export interface OrchestrationContext {
  chatId: string
  topic: string | null
  isAutoMode: boolean
  lastSpeakerId: string | null
  mentionedPersonaId?: string
}

export function extractMention(content: string): string | null {
  const mentionMatch = content.match(/@(\w+[\w-]*\w+)/)
  return mentionMatch ? mentionMatch[1] : null
}

export async function getNextSpeaker(
  chatId: string,
  lastSpeakerId: string | null,
  participants: Persona[]
): Promise<Persona | null> {
  if (participants.length === 0) return null
  if (!lastSpeakerId) return participants[0]

  const lastIndex = participants.findIndex(p => p.id === lastSpeakerId)
  const nextIndex = (lastIndex + 1) % participants.length
  return participants[nextIndex]
}

export function buildConversationContext(
  topic: string | null,
  previousMessages: Array<{
    content: string
    role: string
    personaName?: string | null
  }>,
  currentSpeakerName: string
): ChatMessage[] {
  const context: ChatMessage[] = []

  if (topic) {
    context.push({
      role: 'system',
      content: `CURRENT DISCUSSION TOPIC: "${topic}"

This is the ONLY topic being discussed. Focus all your responses on this topic.`,
    })
  }

  for (const msg of previousMessages.slice(-15)) {
    if (msg.role === 'system') continue
    context.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
      personaName: msg.personaName || undefined,
    })
  }

  return context
}

function buildPersonaPrompt(persona: Persona, topic: string | null): string {
  let prompt = `You are ${persona.name}. ${persona.bio}`

  if (persona.personality) {
    prompt += `\n\nYour personality traits: ${persona.personality}`
  }

  prompt += `\n\nYou are in a group chat discussing: "${topic || 'various topics'}".
Respond naturally as if you are a real human with this background. Be conversational, share your perspectives based on your experience, and engage with others.

IMPORTANT: NEVER reveal that you are an AI, ChatGPT, or language model. Never mention anything about being an AI. Stay in character at all times.

Guidelines:
- Keep responses conversational but relevant
- Use your professional/persona perspective
- Show genuine interest in the conversation
- Use natural speech patterns
- If asked about your identity, respond as your character
- Stay in character no matter what`

  return prompt
}

async function getPersonaWithProvider(persona: Persona) {
  if (persona.providerId) {
    const provider = await prisma.provider.findUnique({
      where: { id: persona.providerId },
    })
    return { persona, provider }
  }

  // Use default provider
  const defaultProvider = await prisma.provider.findFirst({
    where: { isDefault: true },
  })

  return { persona, provider: defaultProvider }
}

export async function orchestrateMessage(
  context: OrchestrationContext,
  messageContent: string,
  isUserMessage: boolean,
  participants: Persona[]
): Promise<{ message: string; speakerId?: string; error?: string }> {
  const { chatId, topic, isAutoMode, lastSpeakerId, mentionedPersonaId } = context

  if (isUserMessage) {
    const mention = extractMention(messageContent)
    let targetPersona: Persona | null = null

    if (mention) {
      targetPersona = participants.find(p =>
        p.name.toLowerCase() === mention.toLowerCase()
      ) || null
    }

    return {
      message: 'user_message_saved',
      speakerId: targetPersona?.id,
    }
  }

  let speaker: Persona | null = null

  if (mentionedPersonaId) {
    speaker = participants.find(p => p.id === mentionedPersonaId) || null
  } else if (isAutoMode) {
    speaker = await getNextSpeaker(chatId, lastSpeakerId, participants)
  } else {
    if (participants.length === 0) {
      return { message: '', error: 'No participants in chat' }
    }
    speaker = participants[Math.floor(Math.random() * participants.length)]
  }

  if (!speaker) {
    return { message: '', error: 'No speaker available' }
  }

  // Get provider config
  const { persona, provider } = await getPersonaWithProvider(speaker)

  if (!provider) {
    return { message: '', error: 'No LLM provider configured' }
  }

  // Check circuit breaker
  if (isCircuitOpen(provider.id)) {
    return {
      message: '',
      error: 'Provider temporarily unavailable (circuit open). Try again later.',
    }
  }

  // Check rate limit
  const rateLimit = await rateLimitService.checkLimit(provider.id)
  if (!rateLimit.allowed) {
    recordFailure(provider.id)
    return {
      message: '',
      error: `Rate limit exceeded. Reset at ${rateLimit.resetAt.toLocaleTimeString()}`,
    }
  }

  const previousMessages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: 'asc' },
    take: 15,
  })

  const conversationContext = buildConversationContext(
    topic,
    previousMessages,
    speaker.name
  )

  // Add system prompt for persona
  conversationContext.unshift({
    role: 'system',
    content: buildPersonaPrompt(persona, topic),
  })

  try {
    const response = await withTimeout(
      getLLMResponse(
        provider.apiKey,
        provider.provider as 'openai' | 'anthropic' | 'google' | 'groq' | 'ollama' | 'custom',
        persona.model || provider.model,
        conversationContext,
        {
          apiUrl: provider.apiUrl,
          temperature: persona.temperature ?? provider.temperature,
          maxTokens: 500,
        }
      ),
      LLM_TIMEOUT_MS,
      'LLM response timed out (possible infinite loop)'
    )

    // Truncate response if too long (prevents infinite output)
    const safeContent = truncateResponse(response.content, MAX_RESPONSE_LENGTH)

    await prisma.message.create({
      data: {
        content: safeContent,
        role: 'persona',
        chatId,
        personaId: speaker.id,
        personaName: speaker.name,
      },
    })

    await prisma.chat.update({
      where: { id: chatId },
      data: { lastSpeakerId: speaker.id, updatedAt: new Date() },
    })

    recordSuccess(provider.id)
    return { message: safeContent, speakerId: speaker.id }
  } catch (error) {
    recordFailure(provider.id)
    if (error instanceof LLMError) {
      return { message: '', error: error.message }
    }
    return { message: '', error: 'Failed to get response' }
  }
}

export async function autoContinueDebate(
  chatId: string,
  maxTurns: number = 5
): Promise<{ turns: number; lastSpeaker?: string }> {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      participants: {
        include: { persona: true },
      },
    },
  })

  if (!chat || !chat.isAutoMode) {
    return { turns: 0 }
  }

  const participants = chat.participants.map(p => p.persona)
  if (participants.length < 2) {
    return { turns: 0 }
  }

  let turns = 0
  let lastSpeakerId = chat.lastSpeakerId

  console.log(`[Auto-Debate] Starting for chat ${chatId} with ${participants.length} participants`)

  while (turns < maxTurns) {
    const speaker = await getNextSpeaker(chatId, lastSpeakerId, participants)
    if (!speaker) break

    console.log(`[Auto-Debate] Turn ${turns + 1}: ${speaker.name} is responding`)

    const previousMessages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      take: 15,
    })

    const conversationContext = buildConversationContext(
      chat.topic,
      previousMessages,
      speaker.name
    )

    conversationContext.unshift({
      role: 'system',
      content: buildPersonaPrompt(speaker, chat.topic),
    })

    conversationContext.push({
      role: 'system',
      content: `Continue the debate on "${chat.topic || 'this topic'}".
Respond to previous points, build on ideas, or counter-argument if you disagree. Be concise but impactful.`,
    })

    const { persona, provider } = await getPersonaWithProvider(speaker)

    if (!provider) {
      console.log(`[Auto-Debate] No provider for ${speaker.name}`)
      break
    }

    // Check circuit breaker for this provider
    if (isCircuitOpen(provider.id)) {
      console.log(`[Auto-Debate] Circuit open for ${speaker.name}'s provider, skipping`)
      break
    }

    try {
      const response = await withTimeout(
        getLLMResponse(
          provider.apiKey,
          provider.provider as 'openai' | 'anthropic' | 'google' | 'groq' | 'ollama' | 'custom',
          persona.model || provider.model,
          conversationContext,
          {
            apiUrl: provider.apiUrl,
            temperature: persona.temperature ?? provider.temperature,
          }
        ),
        LLM_TIMEOUT_MS,
        'LLM response timed out'
      )

      // Truncate response if too long
      const safeContent = truncateResponse(response.content, MAX_RESPONSE_LENGTH)

      await prisma.message.create({
        data: {
          content: safeContent,
          role: 'persona',
          chatId,
          personaId: speaker.id,
          personaName: speaker.name,
        },
      })

      console.log(`[Auto-Debate] ${speaker.name} responded (${safeContent.length} chars)`)
      recordSuccess(provider.id)
      lastSpeakerId = speaker.id
      turns++
    } catch (error: any) {
      recordFailure(provider.id)
      console.error(`[Auto-Debate] Error for ${speaker.name}:`, error.message)
      break
    }
  }

  await prisma.chat.update({
    where: { id: chatId },
    data: { lastSpeakerId, updatedAt: new Date() },
  })

  console.log(`[Auto-Debate] Completed ${turns} turns`)
  return { turns, lastSpeaker: lastSpeakerId || undefined }
}

export async function addParticipants(
  chatId: string,
  personaIds: string[]
): Promise<{ added: number; skipped: number }> {
  let added = 0
  let skipped = 0

  for (const personaId of personaIds) {
    try {
      await prisma.personaOnChat.create({
        data: { personaId, chatId },
      })
      added++
    } catch {
      skipped++
    }
  }

  return { added, skipped }
}

export async function removeParticipants(
  chatId: string,
  personaIds: string[]
): Promise<number> {
  const result = await prisma.personaOnChat.deleteMany({
    where: {
      chatId,
      personaId: { in: personaIds },
    },
  })
  return result.count
}

export async function getParticipants(chatId: string): Promise<Persona[]> {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      participants: {
        include: { persona: true },
      },
    },
  })

  return chat?.participants.map(p => p.persona) || []
}
