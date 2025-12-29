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

export interface Orchestrator {
  selectNextSpeaker(
    context: OrchestrationContext,
    participants: Persona[]
  ): Promise<Persona | null>
}

export class DynamicOrchestrator implements Orchestrator {
  async selectNextSpeaker(
    context: OrchestrationContext,
    participants: Persona[]
  ): Promise<Persona | null> {
    if (participants.length === 0) return null

    // 1. Prioritize mentioned persona
    if (context.mentionedPersonaId) {
      const mentioned = participants.find(p => p.id === context.mentionedPersonaId)
      if (mentioned) return mentioned
    }

    // 2. Dynamic selection via LLM (if multiple participants and in auto mode)
    if (participants.length > 2 && context.isAutoMode) {
      const speaker = await this.selectSpeakerViaLLM(context, participants)
      if (speaker) return speaker
    }

    // Fallback to round-robin logic
    if (!context.lastSpeakerId) return participants[0]

    const lastIndex = participants.findIndex(p => p.id === context.lastSpeakerId)
    if (lastIndex === -1) return participants[0]

    const nextIndex = (lastIndex + 1) % participants.length
    return participants[nextIndex]
  }

  private async selectSpeakerViaLLM(
    context: OrchestrationContext,
    participants: Persona[]
  ): Promise<Persona | null> {
    try {
      const defaultProvider = await prisma.provider.findFirst({
        where: { isDefault: true },
      })

      if (!defaultProvider) return null

      const previousMessages = await prisma.message.findMany({
        where: { chatId: context.chatId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      const history: ChatMessage[] = previousMessages.reverse().map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
        personaName: m.personaName || undefined,
      }))

      const selectionPrompt = buildSelectionPrompt(context.topic, participants, history)

      const response = await getLLMResponse(
        defaultProvider.apiKey,
        defaultProvider.provider as any,
        defaultProvider.model,
        [{ role: 'user', content: selectionPrompt }],
        { temperature: 0, maxTokens: 20 }
      )

      const selectedName = response.content.trim().toLowerCase()
      // Remove any trailing punctuation
      const cleanName = selectedName.replace(/[.,!?;:]/g, '')
      const selected = participants.find(p => p.name.toLowerCase() === cleanName)

      return selected || null
    } catch (error) {
      console.error('[Orchestrator] Error during LLM speaker selection:', error)
      return null
    }
  }
}

function buildSelectionPrompt(
  topic: string | null,
  participants: Persona[],
  history: ChatMessage[]
): string {
  const participantsList = participants.map(p => `- ${p.name}`).join('\n')
  const recentHistory = history.slice(-5).map(m => `${m.personaName || m.role}: ${m.content}`).join('\n')

  return `You are a debate moderator. Based on the conversation history below, decide which of the following participants should speak next to move the debate forward.

Topic: ${topic || 'General Discussion'}

Participants:
${participantsList}

Recent Conversation History:
${recentHistory}

Respond ONLY with the name of the participant who should speak next. Do not include any other text.`
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

export function buildPersonaPrompt(persona: Persona, topic: string | null): string {
  let prompt = `You are ${persona.name}. ${persona.bio}`

  if (persona.personality) {
    prompt += `\n\nYour personality traits: ${persona.personality}`
  }

  prompt += `\n\nYou are participating in a group debate/discussion on the topic: "${topic || 'General Discussion'}".
Respond naturally as if you are a real human with this background.

IMPORTANT: NEVER reveal that you are an AI, ChatGPT, or language model. Stay in character at all times.

Guidelines:
- Speak from your character's unique perspective and experience.
- DIRECTLY ADDRESS previous speakers when relevant (e.g., "I disagree with [Name] because...").
- Keep responses concise, impactful, and conversational.
- Build upon or challenge the points made by others.
- Use natural speech patterns suited to your character.
- If asked about your identity, respond as your character.
- Stay in character no matter what.`

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
