import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SYNTHESIS_RUBRIC } from '../synthesis-rubric'

const prismaMock = {
  chat: { findUnique: vi.fn() },
}
const getLLMResponse = vi.fn()
const checkLimit = vi.fn()
const getPersonaWithProvider = vi.fn()

vi.mock('../prisma', () => ({ prisma: prismaMock }))
vi.mock('../llm-provider', () => ({
  getLLMResponse,
  LLMError: class LLMError extends Error {},
}))
vi.mock('../orchestrator', () => ({ getPersonaWithProvider }))
vi.mock('../rate-limit', () => ({
  rateLimitService: { checkLimit },
}))

const { compareCouncilToSingle } = await import('../head-to-head')

const provider = {
  id: 'provider-1',
  apiKey: 'secret',
  provider: 'custom',
  apiUrl: 'http://localhost:11435/v1',
  model: 'mock-model',
}

const chat = {
  id: 'chat-1',
  title: 'Queue choice',
  topic: null,
  objective: 'Choose a queue for the ingest pipeline.',
  deliverableSpec: 'A one-page decision memo.',
  audience: 'The platform team.',
  participants: [
    {
      persona: {
        id: 'persona-1',
        name: 'Meera',
        role: 'synthesizer',
        model: 'mock-model',
      },
    },
  ],
  artifacts: [
    {
      id: 'artifact-1',
      title: 'Council answer',
      content: '# Council answer\n\nUse Postgres.',
      model: 'mock-model',
      score: 7.5,
      selected: true,
      createdAt: new Date('2026-10-20T00:00:00Z'),
      round: 1,
      angle: 'decisive',
    },
  ],
}

const verdict = {
  scores: SYNTHESIS_RUBRIC.map((criterion) => ({
    key: criterion.key,
    score: 8,
    reason: 'Clear.',
  })),
  critique: 'Needs one more example.',
}

beforeEach(() => {
  vi.clearAllMocks()
  prismaMock.chat.findUnique.mockResolvedValue(chat)
  getPersonaWithProvider.mockResolvedValue({ provider })
  checkLimit.mockResolvedValue({ allowed: true })
  getLLMResponse.mockImplementation(async (_key, _type, _model, messages) => {
    const prompt = messages[0]?.content ?? ''
    if (prompt.includes('grading one candidate')) {
      return {
        content: JSON.stringify(verdict),
        usage: { promptTokens: 200, completionTokens: 80, totalTokens: 280 },
      }
    }
    return {
      content: '# Single answer\n\nUse SQS.',
      usage: { promptTokens: 100, completionTokens: 40, totalTokens: 140 },
    }
  })
})

describe('compareCouncilToSingle', () => {
  it('generates one baseline and blind-judges both answers', async () => {
    const result = await compareCouncilToSingle('chat-1', 'user-1')

    expect(result.ok).toBe(true)
    expect(result.council?.score).toBe(8)
    expect(result.single?.score).toBe(8)
    expect(result.council?.recordedScore).toBe(7.5)
    expect(result.single?.content).toContain('Use SQS.')
    expect(result.single?.usage?.totalTokens).toBe(140)
    expect(getLLMResponse).toHaveBeenCalledTimes(3)
  })

  it('does not generate anything when the council has no deliverable', async () => {
    prismaMock.chat.findUnique.mockResolvedValue({ ...chat, artifacts: [] })

    const result = await compareCouncilToSingle('chat-1', 'user-1')

    expect(result.ok).toBe(false)
    expect(result.error).toContain('Produce a deliverable first')
    expect(getLLMResponse).not.toHaveBeenCalled()
  })
})
