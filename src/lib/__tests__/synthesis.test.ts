import { describe, expect, it, vi } from 'vitest'

// Keep this suite on the pure functions: the module pulls in Prisma and the
// provider SDKs at import time.
vi.mock('../prisma', () => ({ prisma: {} }))
vi.mock('../llm-provider', () => ({
  getLLMResponse: vi.fn(),
  LLMError: class LLMError extends Error {
    code: string
    constructor(message: string, code = 'LLM_ERROR') {
      super(message)
      this.code = code
    }
  },
}))
vi.mock('../orchestrator', () => ({ getPersonaWithProvider: vi.fn() }))
vi.mock('../rate-limit', () => ({ rateLimitService: { checkLimit: vi.fn() } }))

import { buildSynthesisPrompt, extractArtifactTitle } from '../synthesis'

const transcript = [
  { speaker: 'Researcher', content: 'Rental yields are around 3 percent.' },
  { speaker: 'Critic', content: 'That ignores transaction costs.' },
]

describe('buildSynthesisPrompt', () => {
  it('includes the brief and the transcript', () => {
    const prompt = buildSynthesisPrompt({
      objective: 'Decide whether to buy or rent',
      deliverableSpec: 'A one-page recommendation',
      audience: 'A first-time buyer',
      transcript,
    })

    expect(prompt).toContain('OBJECTIVE: Decide whether to buy or rent')
    expect(prompt).toContain('DELIVERABLE: A one-page recommendation')
    expect(prompt).toContain('AUDIENCE: A first-time buyer')
    expect(prompt).toContain('Researcher: Rental yields are around 3 percent.')
    expect(prompt).toContain('Critic: That ignores transaction costs.')
  })

  it('asks for the deliverable rather than a summary, and forbids invention', () => {
    const prompt = buildSynthesisPrompt({ objective: 'X', transcript })

    expect(prompt).toContain('Write the deliverable, not a summary of the conversation')
    expect(prompt).toContain('Never invent facts, figures, or sources')
    expect(prompt).toContain('Resolve contradictions explicitly')
  })

  it('omits optional brief fields when they are absent or blank', () => {
    const prompt = buildSynthesisPrompt({
      objective: 'X',
      deliverableSpec: '   ',
      audience: null,
      transcript,
    })

    expect(prompt).not.toContain('DELIVERABLE:')
    expect(prompt).not.toContain('AUDIENCE:')
    expect(prompt).toContain('OBJECTIVE: X')
  })

  it('is not a persona prompt', () => {
    const prompt = buildSynthesisPrompt({ objective: 'X', transcript })

    expect(prompt).not.toContain('GASLIGHTING')
    expect(prompt).not.toContain('Stay 100% in character')
    expect(prompt).toContain('you are not role-playing')
  })
})

describe('extractArtifactTitle', () => {
  it('pulls the first markdown H1', () => {
    expect(extractArtifactTitle('# Buy or rent in 2026\n\nBody text.', 'fallback')).toBe(
      'Buy or rent in 2026'
    )
  })

  it('finds a heading that is not on the first line', () => {
    expect(extractArtifactTitle('Some preamble\n\n## Section\n# Real Title\n', 'fallback')).toBe(
      'Real Title'
    )
  })

  it('falls back when there is no heading', () => {
    expect(extractArtifactTitle('Just prose, no heading.', 'the objective')).toBe('the objective')
  })

  it('truncates a very long title', () => {
    const long = '# ' + 'x'.repeat(500)
    expect(extractArtifactTitle(long, 'fallback').length).toBe(200)
  })
})
