import { prisma } from './prisma'
import { getLLMResponse, LLMError } from './llm-provider'
import { getPersonaWithProvider } from './orchestrator'
import { LLM_TIMEOUT_MS, isCircuitOpen, recordFailure, recordSuccess, withTimeout } from './llm-protection'
import { rateLimitService } from './rate-limit'

/** Only the tail of a long debate is sent for synthesis. */
export const MAX_TRANSCRIPT_MESSAGES = 60
export const MAX_TRANSCRIPT_CHARS = 16_000

export interface TranscriptEntry {
  speaker: string
  content: string
}

export interface SynthesisResult {
  ok: boolean
  artifactId?: string
  title?: string
  content?: string
  error?: string
}

/**
 * Prompt for the final deliverable.
 *
 * Deliberately not a persona prompt: the synthesiser is told to produce the
 * artefact itself rather than to role-play, and to resolve disagreement instead
 * of restating it. This is the step that turns a discussion into an answer.
 */
export function buildSynthesisPrompt(input: {
  objective: string
  deliverableSpec?: string | null
  audience?: string | null
  transcript: TranscriptEntry[]
}): string {
  const transcript = input.transcript
    .map((entry) => `${entry.speaker}: ${entry.content}`)
    .join('\n\n')

  return `You are producing the final deliverable for a piece of work. You are not one of the participants and you are not role-playing.

OBJECTIVE: ${input.objective}
${input.deliverableSpec?.trim() ? `DELIVERABLE: ${input.deliverableSpec.trim()}` : ''}
${input.audience?.trim() ? `AUDIENCE: ${input.audience.trim()}` : ''}

The discussion below is the raw material. Your job:

1. Extract the strongest reasoning and evidence from every participant.
2. Resolve contradictions explicitly: say which position is better supported and why.
3. Keep genuine open questions and remaining dissent visible rather than papering over them.
4. Produce the deliverable itself — not commentary about who said what.

Rules:
- Write the deliverable, not a summary of the conversation.
- Be decisive. If the discussion is genuinely inconclusive, say so and give the best available answer with its caveats.
- Never invent facts, figures, or sources that are not in the discussion.
- Do not mention being an AI, and do not refer to "the agents" or "the participants".
- Start with a single markdown H1 line containing a short title for the deliverable, then the body.

DISCUSSION TRANSCRIPT:
${transcript}`
}

/** Pull the first markdown H1 out of the output and use it as the title. */
export function extractArtifactTitle(content: string, fallback: string): string {
  const match = content.match(/^\s*#\s+(.+?)\s*$/m)
  if (match) return match[1].trim().slice(0, 200)
  return fallback.slice(0, 200)
}

async function buildTranscript(chatId: string): Promise<TranscriptEntry[]> {
  const messages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: 'desc' },
    take: MAX_TRANSCRIPT_MESSAGES,
  })

  const ordered = messages.reverse()
  const entries: TranscriptEntry[] = []
  let budget = MAX_TRANSCRIPT_CHARS

  // Walk newest-first so the most recent reasoning survives the character budget.
  for (const message of [...ordered].reverse()) {
    const speaker = message.personaName || (message.role === 'user' ? 'User' : 'Unknown')
    const content = message.content.trim()
    if (!content) continue

    const cost = content.length + speaker.length + 4
    if (cost > budget) break
    budget -= cost

    entries.unshift({ speaker, content })
  }

  return entries
}

/**
 * Turn a chat's transcript plus its brief into a stored deliverable.
 *
 * Provider selection prefers a participant holding the "synthesizer" role, then
 * the owner's default provider, then any participant with a usable provider.
 */
export async function synthesizeChat(
  chatId: string,
  userId: string | null
): Promise<SynthesisResult> {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { participants: { include: { persona: true } } },
  })

  if (!chat) return { ok: false, error: 'Chat not found' }

  const participants = chat.participants.map((entry) => entry.persona)
  if (participants.length === 0) {
    return { ok: false, error: 'Add at least one participant before synthesising' }
  }

  const preferred =
    participants.find((persona) => persona.role === 'synthesizer') ?? participants[0]

  // Try the preferred participant first, then fall back through the rest so a
  // participant without a usable provider does not block the deliverable.
  const candidates = [preferred, ...participants.filter((p) => p.id !== preferred.id)]

  let provider = null
  let chosen = preferred
  for (const candidate of candidates) {
    const resolved = await getPersonaWithProvider(candidate, userId)
    if (resolved.provider) {
      provider = resolved.provider
      chosen = candidate
      break
    }
  }

  if (!provider) {
    return { ok: false, error: 'No LLM provider configured for this chat' }
  }

  if (isCircuitOpen(provider.id)) {
    return { ok: false, error: 'Provider temporarily unavailable (circuit open). Try again later.' }
  }

  const rateLimit = await rateLimitService.checkLimit(provider.id)
  if (!rateLimit.allowed) {
    recordFailure(provider.id)
    return {
      ok: false,
      error: `Rate limit exceeded. Reset at ${rateLimit.resetAt.toLocaleTimeString()}`,
    }
  }

  const transcript = await buildTranscript(chatId)
  if (transcript.length === 0) {
    return { ok: false, error: 'Nothing to synthesise yet — the discussion is empty' }
  }

  const objective = chat.objective?.trim() || chat.topic?.trim() || chat.title
  const prompt = buildSynthesisPrompt({
    objective,
    deliverableSpec: chat.deliverableSpec,
    audience: chat.audience,
    transcript,
  })

  try {
    const response = await withTimeout(
      getLLMResponse(
        provider.apiKey,
        provider.provider as 'openai' | 'anthropic' | 'google' | 'groq' | 'ollama' | 'custom',
        chosen.model || provider.model,
        [{ role: 'user', content: prompt }],
        {
          apiUrl: provider.apiUrl,
          // Low temperature: this is a consolidation step, not a creative one.
          temperature: 0.2,
          maxTokens: 2000,
        }
      ),
      LLM_TIMEOUT_MS,
      'Synthesis timed out'
    )

    const content = response.content.trim()
    if (!content) {
      recordFailure(provider.id)
      return { ok: false, error: 'The provider returned an empty deliverable' }
    }

    const title = extractArtifactTitle(content, objective)

    const artifact = await prisma.artifact.create({
      data: {
        chatId,
        kind: 'synthesis',
        title,
        content,
        model: chosen.model || provider.model,
        providerId: provider.id,
        createdById: userId,
      },
    })

    recordSuccess(provider.id)
    return { ok: true, artifactId: artifact.id, title, content }
  } catch (error) {
    recordFailure(provider.id)
    if (error instanceof LLMError) {
      return { ok: false, error: error.message }
    }
    return { ok: false, error: 'Synthesis failed' }
  }
}
