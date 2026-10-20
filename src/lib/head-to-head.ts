import { prisma } from './prisma'
import { getLLMResponse, LLMError } from './llm-provider'
import { getPersonaWithProvider } from './orchestrator'
import { LLM_TIMEOUT_MS, isCircuitOpen, recordFailure, recordSuccess, withTimeout } from './llm-protection'
import { rateLimitService } from './rate-limit'
import {
  CriterionScore,
  buildJudgePrompt,
  getRubricPreset,
  parseJudgeVerdict,
} from './synthesis-rubric'

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface HeadToHeadSide {
  content: string
  title: string
  score: number | null
  breakdown: CriterionScore[] | null
  critique: string
  model: string | null
  latencyMs: number | null
  usage: TokenUsage | null
}

export interface HeadToHeadResult {
  ok: boolean
  objective?: string
  council?: HeadToHeadSide & {
    candidateCount: number
    recordedScore: number | null
  }
  single?: HeadToHeadSide
  judgeModel?: string
  totalLatencyMs?: number
  error?: string
}

/**
 * A single model sees the brief and nothing else. The council's advantage is
 * supposed to come from its transcript, so giving this baseline the transcript
 * would make the comparison meaningless.
 */
export function buildSingleModelPrompt(input: {
  objective: string
  deliverableSpec?: string | null
  audience?: string | null
}): string {
  return `You are answering a work brief on your own. You do not have a council, a discussion, or tools to draw on.

OBJECTIVE: ${input.objective}
${input.deliverableSpec?.trim() ? `DELIVERABLE: ${input.deliverableSpec.trim()}` : ''}
${input.audience?.trim() ? `AUDIENCE: ${input.audience.trim()}` : ''}

Produce the deliverable itself, not commentary about how you would produce it.

Rules:
- Be decisive. If the brief is genuinely inconclusive, say so and give the best available answer with its caveats.
- Never invent facts, figures, or sources. State uncertainty plainly.
- Do not mention being an AI.
- Start with a single markdown H1 line containing a short title for the deliverable, then the body.`
}

function titleOf(content: string, fallback: string): string {
  const match = content.match(/^\s*#\s+(.+?)\s*$/m)
  return (match?.[1] || fallback).trim().slice(0, 200)
}

export async function compareCouncilToSingle(
  chatId: string,
  userId: string | null
): Promise<HeadToHeadResult> {
  const startedAt = Date.now()

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      participants: { include: { persona: true }, orderBy: { sortOrder: 'asc' } },
      artifacts: {
        where: { kind: 'synthesis' },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!chat) return { ok: false, error: 'Chat not found' }

  const winner = chat.artifacts.find((artifact) => artifact.selected) ?? chat.artifacts[0]
  if (!winner) {
    return { ok: false, error: 'Produce a deliverable first, then compare it with a single model.' }
  }

  const participants = chat.participants.map((entry) => entry.persona)
  const preferred =
    participants.find((persona) => persona.role === 'synthesizer') ?? participants[0]

  let provider = null
  if (preferred) {
    const found = await getPersonaWithProvider(preferred, userId)
    provider = found.provider
  }

  if (!provider) {
    return { ok: false, error: 'No LLM provider configured for this chat' }
  }
  if (isCircuitOpen(provider.id)) {
    return { ok: false, error: 'Provider temporarily unavailable (circuit open). Try again later.' }
  }

  const rateLimit = await rateLimitService.checkLimit(provider.id)
  if (!rateLimit.allowed) {
    return {
      ok: false,
      error: `Rate limit exceeded. Reset at ${rateLimit.resetAt.toLocaleTimeString()}`,
    }
  }

  const objective = chat.objective?.trim() || chat.topic?.trim() || chat.title
  const rubric = getRubricPreset(chat.rubricPreset).criteria
  const model = preferred?.model || provider.model
  const providerType = provider.provider as
    | 'openai'
    | 'anthropic'
    | 'google'
    | 'groq'
    | 'ollama'
    | 'custom'

  const complete = async (prompt: string, temperature: number) => {
    const started = Date.now()
    const response = await withTimeout(
      getLLMResponse(
        provider.apiKey,
        providerType,
        model,
        [{ role: 'user', content: prompt }],
        { apiUrl: provider.apiUrl, temperature, maxTokens: 2000 }
      ),
      LLM_TIMEOUT_MS,
      'Comparison timed out'
    )
    return {
      content: response.content.trim(),
      usage: response.usage ?? null,
      latencyMs: Date.now() - started,
    }
  }

  const judge = async (content: string) => {
    const response = await complete(
      buildJudgePrompt({
        objective,
        deliverableSpec: chat.deliverableSpec,
        audience: chat.audience,
        candidate: content,
        rubric,
      }),
      0
    )
    const verdict = parseJudgeVerdict(response.content, rubric)
    return {
      verdict,
      usage: response.usage,
      latencyMs: response.latencyMs,
    }
  }

  try {
    const singleStart = Date.now()
    const single = await complete(
      buildSingleModelPrompt({
        objective,
        deliverableSpec: chat.deliverableSpec,
        audience: chat.audience,
      }),
      0.4
    )
    const singleLatencyMs = Date.now() - singleStart

    if (!single.content) {
      recordFailure(provider.id)
      return { ok: false, error: 'The single model returned an empty answer' }
    }

    // Both answers are judged independently with the same prompt. The judge is
    // never told which one came from the council.
    const [councilVerdict, singleVerdict] = await Promise.all([
      judge(winner.content),
      judge(single.content),
    ])

    recordSuccess(provider.id)

    return {
      ok: true,
      objective,
      council: {
        content: winner.content,
        title: winner.title,
        score: councilVerdict.verdict?.total ?? null,
        breakdown: councilVerdict.verdict?.scores ?? null,
        critique: councilVerdict.verdict?.critique ?? '',
        model: winner.model,
        latencyMs: null,
        usage: null,
        candidateCount: chat.artifacts.length,
        recordedScore: winner.score,
      },
      single: {
        content: single.content,
        title: titleOf(single.content, objective),
        score: singleVerdict.verdict?.total ?? null,
        breakdown: singleVerdict.verdict?.scores ?? null,
        critique: singleVerdict.verdict?.critique ?? '',
        model,
        latencyMs: singleLatencyMs,
        usage: single.usage,
      },
      judgeModel: model,
      totalLatencyMs: Date.now() - startedAt,
    }
  } catch (error) {
    recordFailure(provider.id)
    if (error instanceof LLMError) return { ok: false, error: error.message }
    return { ok: false, error: 'The comparison failed' }
  }
}
