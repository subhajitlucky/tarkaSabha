import { Prisma } from '@/generated/prisma/client'
import { prisma } from './prisma'
import { getLLMResponse, LLMError } from './llm-provider'
import { getPersonaWithProvider } from './orchestrator'
import { LLM_TIMEOUT_MS, isCircuitOpen, recordFailure, recordSuccess, withTimeout } from './llm-protection'
import { rateLimitService } from './rate-limit'
import {
  CandidateAngle,
  CriterionScore,
  angleFor,
  buildJudgePrompt,
  parseJudgeVerdict,
  selectBest,
} from './synthesis-rubric'

/** Only the tail of a long debate is sent for synthesis. */
export const MAX_TRANSCRIPT_MESSAGES = 60
export const MAX_TRANSCRIPT_CHARS = 16_000

export const DEFAULT_CANDIDATES = 3
export const MAX_CANDIDATES = 4
export const DEFAULT_ROUNDS = 1
export const MAX_ROUNDS = 2

/** Below this, a second round is worth spending if the caller allowed one. */
export const RETRY_THRESHOLD = 7

/** Leave headroom under the route's 60s limit. */
export const SYNTHESIS_BUDGET_MS = 42_000

export interface TranscriptEntry {
  speaker: string
  content: string
}

export interface SynthesisCandidate {
  artifactId: string
  index: number
  angle: string | null
  round: number
  score: number | null
  breakdown: CriterionScore[] | null
  selected: boolean
  title: string
}

export interface SynthesisResult {
  ok: boolean
  artifactId?: string
  title?: string
  content?: string
  score?: number | null
  candidates?: SynthesisCandidate[]
  rounds?: number
  /** True when a second round was skipped because the time budget ran out. */
  budgetExhausted?: boolean
  error?: string
}

/**
 * Prompt for one candidate deliverable.
 *
 * Deliberately not a persona prompt: the synthesiser is told to produce the
 * artefact itself rather than to role-play, and to resolve disagreement instead
 * of restating it. The angle is what makes candidates comparable rather than
 * paraphrases of each other.
 */
export function buildSynthesisPrompt(input: {
  objective: string
  deliverableSpec?: string | null
  audience?: string | null
  transcript: TranscriptEntry[]
  angle?: CandidateAngle
  critique?: string | null
}): string {
  const transcript = input.transcript
    .map((entry) => `${entry.speaker}: ${entry.content}`)
    .join('\n\n')

  return `You are producing the final deliverable for a piece of work. You are not one of the participants and you are not role-playing.

OBJECTIVE: ${input.objective}
${input.deliverableSpec?.trim() ? `DELIVERABLE: ${input.deliverableSpec.trim()}` : ''}
${input.audience?.trim() ? `AUDIENCE: ${input.audience.trim()}` : ''}
${input.angle ? `\nEMPHASIS: ${input.angle.directive}` : ''}
${input.critique?.trim() ? `\nA reviewer scored an earlier attempt poorly and said:\n"${input.critique.trim()}"\nFix that specific weakness.` : ''}

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

interface ResolvedProvider {
  apiKey: string
  providerType: string
  apiUrl: string
  model: string
  providerId: string
}

/**
 * Turn a chat's transcript plus its brief into scored candidate deliverables and
 * keep the best one.
 *
 * Provider selection prefers a participant holding the "synthesizer" role, then
 * falls back through the rest so one misconfigured persona cannot block the
 * deliverable.
 */
export async function synthesizeChat(
  chatId: string,
  userId: string | null,
  options: { candidates?: number; rounds?: number } = {}
): Promise<SynthesisResult> {
  const candidateCount = Math.min(
    MAX_CANDIDATES,
    Math.max(1, Math.trunc(options.candidates ?? DEFAULT_CANDIDATES))
  )
  const maxRounds = Math.min(MAX_ROUNDS, Math.max(1, Math.trunc(options.rounds ?? DEFAULT_ROUNDS)))
  const deadline = Date.now() + SYNTHESIS_BUDGET_MS

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { participants: { include: { persona: true }, orderBy: { sortOrder: 'asc' } } },
  })

  if (!chat) return { ok: false, error: 'Chat not found' }

  const participants = chat.participants.map((entry) => entry.persona)
  if (participants.length === 0) {
    return { ok: false, error: 'Add at least one participant before synthesising' }
  }

  const preferred =
    participants.find((persona) => persona.role === 'synthesizer') ?? participants[0]
  const candidates = [preferred, ...participants.filter((p) => p.id !== preferred.id)]

  let resolved: ResolvedProvider | null = null
  for (const candidate of candidates) {
    const found = await getPersonaWithProvider(candidate, userId)
    if (found.provider) {
      resolved = {
        apiKey: found.provider.apiKey,
        providerType: found.provider.provider,
        apiUrl: found.provider.apiUrl,
        model: candidate.model || found.provider.model,
        providerId: found.provider.id,
      }
      break
    }
  }

  if (!resolved) return { ok: false, error: 'No LLM provider configured for this chat' }
  if (isCircuitOpen(resolved.providerId)) {
    return { ok: false, error: 'Provider temporarily unavailable (circuit open). Try again later.' }
  }

  const rateLimit = await rateLimitService.checkLimit(resolved.providerId)
  if (!rateLimit.allowed) {
    recordFailure(resolved.providerId)
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
  // Captured as locals so the nested generateRound closure keeps the narrowing.
  const deliverableSpec = chat.deliverableSpec
  const audience = chat.audience
  const provider = resolved

  const complete = async (prompt: string, temperature: number): Promise<string> => {
    const response = await withTimeout(
      getLLMResponse(
        provider.apiKey,
        provider.providerType as 'openai' | 'anthropic' | 'google' | 'groq' | 'ollama' | 'custom',
        provider.model,
        [{ role: 'user', content: prompt }],
        { apiUrl: provider.apiUrl, temperature, maxTokens: 2000 }
      ),
      LLM_TIMEOUT_MS,
      'Synthesis timed out'
    )
    return response.content.trim()
  }

  const judge = async (content: string): Promise<{ score: number | null; breakdown: CriterionScore[] | null; critique: string }> => {
    const verdict = parseJudgeVerdict(
      await complete(
        buildJudgePrompt({
          objective,
          deliverableSpec,
          audience,
          candidate: content,
        }),
        // Judging should be as reproducible as the provider allows.
        0
      )
    )

    if (!verdict) return { score: null, breakdown: null, critique: '' }
    return { score: verdict.total, breakdown: verdict.scores, critique: verdict.critique }
  }

  // A new run supersedes the previous deliverable for this chat.
  await prisma.artifact.updateMany({
    where: { chatId, kind: 'synthesis', selected: true },
    data: { selected: false },
  })

  interface Stored {
    artifactId: string
    index: number
    angle: string | null
    round: number
    score: number | null
    breakdown: CriterionScore[] | null
    critique: string
    title: string
    content: string
  }

  const stored: Stored[] = []

  async function generateRound(round: number, critique: string | null): Promise<void> {
    // All candidates for a round are independent, so generate them together
    // rather than paying the provider latency N times over.
    const drafts = await Promise.all(
      Array.from({ length: candidateCount }, async (_, index) => {
        const angle = angleFor(index)
        const content = await complete(
          buildSynthesisPrompt({
            objective,
            deliverableSpec,
            audience,
            transcript,
            angle,
            critique,
          }),
          angle.temperature
        )
        return { index, angle, content }
      })
    )

    const judged = await Promise.all(
      drafts.map(async (draft) => ({
        draft,
        verdict: draft.content
          ? await judge(draft.content)
          : { score: null, breakdown: null, critique: '' },
      }))
    )

    for (const entry of judged) {
      const { draft } = entry
      if (!draft.content) continue

      const title = extractArtifactTitle(draft.content, objective)

      const artifact = await prisma.artifact.create({
        data: {
          chatId,
          kind: 'synthesis',
          title,
          content: draft.content,
          model: provider.model,
          providerId: provider.providerId,
          createdById: userId,
          score: entry.verdict.score,
          breakdown: (entry.verdict.breakdown ?? undefined) as Prisma.InputJsonValue | undefined,
          selected: false,
          round,
          angle: draft.angle.label,
        },
      })

      stored.push({
        artifactId: artifact.id,
        index: draft.index,
        angle: draft.angle.label,
        round,
        score: entry.verdict.score,
        breakdown: entry.verdict.breakdown,
        critique: entry.verdict.critique,
        title,
        content: draft.content,
      })
    }
  }

  try {
    await generateRound(1, null)

    if (stored.length === 0) {
      recordFailure(provider.providerId)
      return { ok: false, error: 'The provider returned no usable candidates' }
    }

    let roundsRun = 1
    let budgetExhausted = false

    if (maxRounds > 1) {
      const best = stored[selectBest(stored)]
      const weak = best.score === null || best.score < RETRY_THRESHOLD

      if (weak && Date.now() < deadline) {
        // Feed the judge's biggest criticism into the next round rather than
        // simply resampling and hoping.
        await generateRound(2, best.critique || 'The previous attempt was judged too weak.')
        roundsRun = 2
      } else if (weak) {
        budgetExhausted = true
      }
    }

    const winnerIndex = selectBest(stored)
    const winner = stored[winnerIndex]

    await prisma.artifact.update({
      where: { id: winner.artifactId },
      data: { selected: true },
    })

    recordSuccess(provider.providerId)

    return {
      ok: true,
      artifactId: winner.artifactId,
      title: winner.title,
      content: winner.content,
      score: winner.score,
      rounds: roundsRun,
      budgetExhausted,
      candidates: stored.map((entry) => ({
        artifactId: entry.artifactId,
        index: entry.index,
        angle: entry.angle,
        round: entry.round,
        score: entry.score,
        breakdown: entry.breakdown,
        selected: entry.artifactId === winner.artifactId,
        title: entry.title,
      })),
    }
  } catch (error) {
    recordFailure(provider.providerId)
    if (error instanceof LLMError) return { ok: false, error: error.message }
    return { ok: false, error: 'Synthesis failed' }
  }
}
