/**
 * The rubric that makes "best version" literal rather than aspirational.
 *
 * Weights must sum to 1. The score for a candidate is the weighted mean of its
 * per-criterion scores, so a candidate cannot win by being decisive while
 * inventing facts.
 */
export interface RubricCriterion {
  key: string
  label: string
  weight: number
  description: string
}

export const SYNTHESIS_RUBRIC: RubricCriterion[] = [
  {
    key: 'grounding',
    label: 'Grounding',
    weight: 0.25,
    description:
      'Every factual claim is supported by the discussion. Nothing is invented, and no source is cited that was not actually consulted.',
  },
  {
    key: 'coverage',
    label: 'Coverage',
    weight: 0.25,
    description: 'The objective is answered fully, including the parts that are inconvenient.',
  },
  {
    key: 'decisiveness',
    label: 'Decisiveness',
    weight: 0.2,
    description:
      'It commits to an answer and defends it, rather than listing options and leaving the choice open.',
  },
  {
    key: 'honesty',
    label: 'Honesty',
    weight: 0.15,
    description:
      'Uncertainty, weak evidence and remaining disagreement are stated plainly instead of being smoothed over.',
  },
  {
    key: 'fit',
    label: 'Fit',
    weight: 0.15,
    description: 'It matches the requested deliverable and is written for the stated audience.',
  },
]

export const MIN_CRITERION_SCORE = 1
export const MAX_CRITERION_SCORE = 10

export interface CriterionScore {
  key: string
  label: string
  score: number
  reason: string
}

export interface JudgeVerdict {
  scores: CriterionScore[]
  total: number
  critique: string
}

/**
 * Deliberately different angles rather than N samples of one prompt. Sampling
 * the same prompt repeatedly mostly produces paraphrases, which makes the
 * comparison meaningless.
 */
export interface CandidateAngle {
  label: string
  directive: string
  temperature: number
}

export const CANDIDATE_ANGLES: CandidateAngle[] = [
  {
    label: 'decisive',
    directive:
      'Optimise for decisiveness: reach a clear recommendation and defend it with the strongest available reasoning.',
    temperature: 0.3,
  },
  {
    label: 'risk-aware',
    directive:
      'Optimise for risk coverage: make sure the strongest counter-case and the main failure modes are represented, then still give a recommendation.',
    temperature: 0.5,
  },
  {
    label: 'actionable',
    directive:
      'Optimise for actionability: make the recommendation concrete, with specific next steps a reader could actually take.',
    temperature: 0.7,
  },
  {
    label: 'concise',
    directive:
      'Optimise for concision: say the same thing in as few words as possible without losing the reasoning.',
    temperature: 0.4,
  },
]

export function angleFor(index: number): CandidateAngle {
  return CANDIDATE_ANGLES[index % CANDIDATE_ANGLES.length]
}

/** Weighted mean of the per-criterion scores, rounded to two decimals. */
export function weightedTotal(scores: Array<{ key: string; score: number }>): number {
  let total = 0
  let weightUsed = 0

  for (const criterion of SYNTHESIS_RUBRIC) {
    const found = scores.find((entry) => entry.key === criterion.key)
    if (!found) continue
    total += found.score * criterion.weight
    weightUsed += criterion.weight
  }

  // Normalise by the weight actually present so a partially-parsed verdict
  // still produces a comparable number instead of silently scoring low.
  if (weightUsed === 0) return 0
  return Math.round((total / weightUsed) * 100) / 100
}

export function buildJudgePrompt(input: {
  objective: string
  deliverableSpec?: string | null
  audience?: string | null
  candidate: string
}): string {
  const criteria = SYNTHESIS_RUBRIC.map(
    (criterion) =>
      `- "${criterion.key}" (${criterion.label}, weight ${criterion.weight}): ${criterion.description}`
  ).join('\n')

  return `You are grading one candidate deliverable against a fixed rubric. Be a harsh grader: a 10 means you cannot find a real flaw, and most competent work scores 6-8.

OBJECTIVE: ${input.objective}
${input.deliverableSpec?.trim() ? `DELIVERABLE: ${input.deliverableSpec.trim()}` : ''}
${input.audience?.trim() ? `AUDIENCE: ${input.audience.trim()}` : ''}

RUBRIC:
${criteria}

Score each criterion from ${MIN_CRITERION_SCORE} to ${MAX_CRITERION_SCORE}. Penalise invented facts heavily under "grounding".

CANDIDATE:
"""
${input.candidate}
"""

Respond with ONLY a JSON object, no prose and no code fences:
{
  "scores": [
${SYNTHESIS_RUBRIC.map((c) => `    { "key": "${c.key}", "score": 0, "reason": "one short sentence" }`).join(',\n')}
  ],
  "critique": "one or two sentences on the single biggest weakness, addressed to the author"
}`
}

/** Pull the first balanced JSON object out of a model response. */
export function extractJsonObject(text: string): unknown | null {
  const start = text.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < text.length; i++) {
    const char = text[i]

    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }

    if (char === '"') inString = true
    else if (char === '{') depth++
    else if (char === '}') {
      depth--
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1))
        } catch {
          return null
        }
      }
    }
  }

  return null
}

function clampScore(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.min(MAX_CRITERION_SCORE, Math.max(MIN_CRITERION_SCORE, Math.round(value)))
}

/**
 * Parse a judge response. Never throws: a malformed verdict yields null so the
 * caller can treat the candidate as unscored rather than failing the run.
 */
export function parseJudgeVerdict(text: string): JudgeVerdict | null {
  const parsed = extractJsonObject(text)
  if (!parsed || typeof parsed !== 'object') return null

  const raw = (parsed as { scores?: unknown }).scores
  if (!Array.isArray(raw)) return null

  const scores: CriterionScore[] = []

  for (const criterion of SYNTHESIS_RUBRIC) {
    const entry = raw.find(
      (candidate): candidate is { key?: unknown; score?: unknown; reason?: unknown } =>
        typeof candidate === 'object' &&
        candidate !== null &&
        (candidate as { key?: unknown }).key === criterion.key
    )

    const score = clampScore(entry?.score)
    if (score === null) continue

    scores.push({
      key: criterion.key,
      label: criterion.label,
      score,
      reason: typeof entry?.reason === 'string' ? entry.reason.trim().slice(0, 300) : '',
    })
  }

  if (scores.length === 0) return null

  const critiqueRaw = (parsed as { critique?: unknown }).critique

  return {
    scores,
    total: weightedTotal(scores),
    critique: typeof critiqueRaw === 'string' ? critiqueRaw.trim().slice(0, 600) : '',
  }
}

/**
 * Pick the winner. Highest score wins; ties break on the lower index so the
 * result is deterministic for a given set of candidates. Unscored candidates
 * only win when nothing was scored at all.
 */
export function selectBest<T extends { score: number | null }>(candidates: T[]): number {
  let bestIndex = -1
  let bestScore = -Infinity

  for (let i = 0; i < candidates.length; i++) {
    const score = candidates[i].score
    if (score === null) continue
    if (score > bestScore) {
      bestScore = score
      bestIndex = i
    }
  }

  return bestIndex === -1 ? 0 : bestIndex
}
