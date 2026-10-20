import { describe, expect, it } from 'vitest'
import {
  CANDIDATE_ANGLES,
  MAX_CRITERION_SCORE,
  MIN_CRITERION_SCORE,
  RUBRIC_PRESETS,
  SYNTHESIS_RUBRIC,
  angleFor,
  buildJudgePrompt,
  extractJsonObject,
  getRubricPreset,
  isRubricPreset,
  parseJudgeVerdict,
  selectBest,
  weightedTotal,
} from '../synthesis-rubric'

describe('rubric definition', () => {
  it('has weights that sum to 1', () => {
    const total = SYNTHESIS_RUBRIC.reduce((sum, criterion) => sum + criterion.weight, 0)
    expect(total).toBeCloseTo(1, 10)
  })

  it('has unique keys and non-empty descriptions', () => {
    const keys = SYNTHESIS_RUBRIC.map((c) => c.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const criterion of SYNTHESIS_RUBRIC) {
      expect(criterion.description.length).toBeGreaterThan(10)
      expect(criterion.weight).toBeGreaterThan(0)
    }
  })

  it('keeps every preset weighted to 1 with unique keys', () => {
    expect(RUBRIC_PRESETS.length).toBeGreaterThan(1)
    for (const preset of RUBRIC_PRESETS) {
      const total = preset.criteria.reduce((sum, criterion) => sum + criterion.weight, 0)
      expect(total).toBeCloseTo(1, 10)
      expect(new Set(preset.criteria.map((criterion) => criterion.key)).size).toBe(
        preset.criteria.length
      )
    }
  })

  it('validates preset ids and builds a prompt from the chosen weights', () => {
    expect(isRubricPreset('decision')).toBe(true)
    expect(isRubricPreset('imaginary')).toBe(false)
    expect(isRubricPreset(null)).toBe(false)

    const preset = getRubricPreset('decision')
    const prompt = buildJudgePrompt({
      objective: 'Pick a queue.',
      candidate: 'Use SQS.',
      rubric: preset.criteria,
    })
    expect(prompt).toContain('"decisiveness"')
    expect(prompt).toContain('weight 0.3')
  })

  it('falls back to the balanced preset for an unknown id', () => {
    expect(getRubricPreset('nope').id).toBe('balanced')
    expect(getRubricPreset(null).id).toBe('balanced')
  })

  it('cycles candidate angles deterministically', () => {
    expect(angleFor(0).label).toBe(CANDIDATE_ANGLES[0].label)
    expect(angleFor(CANDIDATE_ANGLES.length).label).toBe(CANDIDATE_ANGLES[0].label)
    expect(angleFor(1).label).toBe(CANDIDATE_ANGLES[1].label)
  })
})

describe('weightedTotal', () => {
  it('computes the weighted mean', () => {
    const scores = SYNTHESIS_RUBRIC.map((c) => ({ key: c.key, score: 8 }))
    expect(weightedTotal(scores)).toBe(8)
  })

  it('weights criteria differently', () => {
    // Perfect grounding (0.25) but nothing else.
    const scores = SYNTHESIS_RUBRIC.map((c) => ({
      key: c.key,
      score: c.key === 'grounding' ? 10 : 1,
    }))
    const total = weightedTotal(scores)
    expect(total).toBeGreaterThan(1)
    expect(total).toBeLessThan(10)
    expect(total).toBeCloseTo(10 * 0.25 + 1 * 0.75, 5)
  })

  it('normalises when only some criteria are present', () => {
    expect(weightedTotal([{ key: 'grounding', score: 6 }])).toBe(6)
  })

  it('returns 0 when nothing matches', () => {
    expect(weightedTotal([{ key: 'nonsense', score: 10 }])).toBe(0)
  })
})

describe('extractJsonObject', () => {
  it('pulls a bare object', () => {
    expect(extractJsonObject('{"a":1}')).toEqual({ a: 1 })
  })

  it('pulls an object out of surrounding prose and code fences', () => {
    expect(extractJsonObject('Sure!\n```json\n{"a":{"b":2}}\n```\nHope that helps')).toEqual({
      a: { b: 2 },
    })
  })

  it('is not confused by braces inside strings', () => {
    expect(extractJsonObject('{"note":"a } b","n":1}')).toEqual({ note: 'a } b', n: 1 })
  })

  it('handles escaped quotes inside strings', () => {
    expect(extractJsonObject('{"note":"say \\"hi\\"","n":2}')).toEqual({ note: 'say "hi"', n: 2 })
  })

  it('returns null for junk', () => {
    expect(extractJsonObject('no json here')).toBeNull()
    expect(extractJsonObject('{ unbalanced')).toBeNull()
  })
})

describe('parseJudgeVerdict', () => {
  const valid = JSON.stringify({
    scores: SYNTHESIS_RUBRIC.map((c) => ({ key: c.key, score: 9, reason: 'solid' })),
    critique: 'needs more numbers',
  })

  it('parses a well-formed verdict', () => {
    const verdict = parseJudgeVerdict(valid)
    expect(verdict).not.toBeNull()
    expect(verdict?.total).toBe(9)
    expect(verdict?.critique).toBe('needs more numbers')
    expect(verdict?.scores).toHaveLength(SYNTHESIS_RUBRIC.length)
  })

  it('parses a verdict wrapped in prose', () => {
    expect(parseJudgeVerdict(`Here you go:\n${valid}\nDone.`)?.total).toBe(9)
  })

  it('clamps out-of-range scores instead of trusting them', () => {
    const wild = JSON.stringify({
      scores: SYNTHESIS_RUBRIC.map((c) => ({ key: c.key, score: 999 })),
    })
    const verdict = parseJudgeVerdict(wild)
    expect(verdict?.scores.every((s) => s.score === MAX_CRITERION_SCORE)).toBe(true)

    const negative = JSON.stringify({
      scores: SYNTHESIS_RUBRIC.map((c) => ({ key: c.key, score: -5 })),
    })
    expect(parseJudgeVerdict(negative)?.scores.every((s) => s.score === MIN_CRITERION_SCORE)).toBe(
      true
    )
  })

  it('ignores non-numeric scores', () => {
    const verdict = parseJudgeVerdict(
      JSON.stringify({
        scores: [{ key: 'grounding', score: 'excellent' }, { key: 'coverage', score: 6 }],
      })
    )
    expect(verdict?.scores).toHaveLength(1)
    expect(verdict?.scores[0].key).toBe('coverage')
    // Normalised over the weight actually present.
    expect(verdict?.total).toBe(6)
  })

  it('never throws on malformed judge output', () => {
    for (const junk of [
      '',
      'not json',
      '{}',
      '{"scores": "nope"}',
      '{"scores": []}',
      '{"scores": [{"key":"grounding"}]}',
      '{"unrelated": true}',
      '{'.repeat(50),
    ]) {
      expect(() => parseJudgeVerdict(junk)).not.toThrow()
      expect(parseJudgeVerdict(junk)).toBeNull()
    }
  })
})

describe('selectBest', () => {
  it('picks the highest score', () => {
    expect(selectBest([{ score: 5 }, { score: 9 }, { score: 7 }])).toBe(1)
  })

  it('breaks ties deterministically on the lower index', () => {
    expect(selectBest([{ score: 8 }, { score: 8 }])).toBe(0)
  })

  it('skips unscored candidates when others are scored', () => {
    expect(selectBest([{ score: null }, { score: 4 }])).toBe(1)
  })

  it('falls back to the first candidate when nothing is scored', () => {
    expect(selectBest([{ score: null }, { score: null }])).toBe(0)
  })
})

describe('buildJudgePrompt', () => {
  it('includes the rubric keys, the objective and the candidate', () => {
    const prompt = buildJudgePrompt({
      objective: 'Decide whether to buy',
      deliverableSpec: 'A one-pager',
      audience: 'A buyer',
      candidate: '# Recommendation\nBuy.',
    })

    for (const criterion of SYNTHESIS_RUBRIC) {
      expect(prompt).toContain(`"${criterion.key}"`)
    }
    expect(prompt).toContain('OBJECTIVE: Decide whether to buy')
    expect(prompt).toContain('DELIVERABLE: A one-pager')
    expect(prompt).toContain('AUDIENCE: A buyer')
    expect(prompt).toContain('Buy.')
    expect(prompt).toContain('Respond with ONLY a JSON object')
  })
})
