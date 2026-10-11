import { describe, expect, it, vi } from 'vitest'

vi.mock('../prisma', () => ({
  prisma: {
    provider: { findFirst: vi.fn() },
    message: { findMany: vi.fn(), create: vi.fn() },
    chat: { update: vi.fn(), findUnique: vi.fn() },
    personaOnChat: { create: vi.fn(), deleteMany: vi.fn() },
    persona: {},
  },
}))

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

vi.mock('../rate-limit', () => ({
  rateLimitService: {
    checkLimit: vi.fn().mockResolvedValue({
      allowed: true,
      remaining: 99,
      resetAt: new Date(),
      limit: 100,
    }),
  },
}))

import {
  DynamicOrchestrator,
  buildConversationContext,
  buildPersonaPrompt,
  cleanResponse,
  escapeRegExp,
  extractMention,
  getNextSpeaker,
  isRefusal,
  stripRefusal,
} from '../orchestrator'

type Persona = {
  id: string
  name: string
  bio: string
  personality: string | null
  temperature: number | null
  model: string | null
  providerId: string | null
  createdAt: Date
  updatedAt: Date
  creatorId: string | null
  avatarUrl: string | null
}

function persona(id: string, name: string): Persona {
  return {
    id,
    name,
    bio: `A thoughtful participant named ${name} with strong opinions.`,
    personality: 'direct',
    temperature: 0.7,
    model: null,
    providerId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    creatorId: null,
    avatarUrl: null,
  }
}

describe('extractMention', () => {
  it('extracts a simple mention', () => {
    expect(extractMention('hey @Ada what do you think?')).toBe('Ada')
  })

  it('extracts hyphenated mentions', () => {
    expect(extractMention('cc @Grace-Hopper')).toBe('Grace-Hopper')
  })

  it('returns null when no mention exists', () => {
    expect(extractMention('no mentions here')).toBeNull()
  })
})

describe('getNextSpeaker', () => {
  const participants = [persona('a', 'Ada'), persona('b', 'Bo'), persona('c', 'Cy')]

  it('returns null for empty participants', async () => {
    expect(await getNextSpeaker('chat', null, [])).toBeNull()
  })

  it('starts with the first participant when there is no last speaker', async () => {
    expect(await getNextSpeaker('chat', null, participants)).toBe(participants[0])
  })

  it('advances round-robin', async () => {
    expect(await getNextSpeaker('chat', 'a', participants)).toBe(participants[1])
    expect(await getNextSpeaker('chat', 'b', participants)).toBe(participants[2])
  })

  it('wraps around to the first participant', async () => {
    expect(await getNextSpeaker('chat', 'c', participants)).toBe(participants[0])
  })
})

describe('DynamicOrchestrator.selectNextSpeaker', () => {
  const participants = [persona('a', 'Ada'), persona('b', 'Bo'), persona('c', 'Cy')]
  const orchestrator = new DynamicOrchestrator()

  it('returns null when there are no participants', async () => {
    const speaker = await orchestrator.selectNextSpeaker(
      { chatId: 'c', topic: null, isAutoMode: true, lastSpeakerId: null },
      []
    )
    expect(speaker).toBeNull()
  })

  it('prefers a mentioned persona', async () => {
    const speaker = await orchestrator.selectNextSpeaker(
      {
        chatId: 'c',
        topic: null,
        isAutoMode: true,
        lastSpeakerId: 'a',
        mentionedPersonaId: 'c',
      },
      participants
    )
    expect(speaker?.id).toBe('c')
  })

  it('falls back to round-robin after the last speaker', async () => {
    const speaker = await orchestrator.selectNextSpeaker(
      { chatId: 'c', topic: null, isAutoMode: true, lastSpeakerId: 'b' },
      participants
    )
    expect(speaker?.id).toBe('c')
  })
})

describe('buildConversationContext', () => {
  it('skips system messages and maps the current speaker to assistant', () => {
    const context = buildConversationContext(
      'Is testing important?',
      [
        { content: 'system leak', role: 'system' },
        { content: 'I think yes', role: 'persona', personaName: 'Ada' },
        { content: 'I disagree', role: 'persona', personaName: 'Bo' },
      ],
      'Ada'
    )

    expect(context[0]).toMatchObject({ role: 'system' })
    expect(context[0].content).toContain('Is testing important?')
    const roles = context.slice(1).map((m) => m.role)
    expect(roles).toEqual(['assistant', 'user'])
  })

  it('labels a human user message as user for every speaker', () => {
    const context = buildConversationContext(
      null,
      [{ content: 'go on', role: 'user', personaName: 'Host' }],
      'Ada'
    )
    expect(context).toHaveLength(1)
    expect(context[0]).toMatchObject({ role: 'user', name: 'Host' })
  })
})

describe('isRefusal / stripRefusal', () => {
  it('detects common refusals', () => {
    expect(isRefusal("I'm sorry, but I cannot help with that.")).toBe(true)
    expect(isRefusal('As an AI language model, I must decline.')).toBe(true)
    expect(isRefusal('Rent is due and I am broke.')).toBe(false)
  })

  it('strips leading refusal prefixes', () => {
    expect(stripRefusal("I'm sorry, but I can't assist with that. Let's move on.")).toBe(
      "Let's move on."
    )
  })
})

describe('escapeRegExp', () => {
  it('escapes every regex metacharacter', () => {
    expect(escapeRegExp('.*+?^${}()|[]\\')).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\')
  })

  it('keeps ordinary persona names unchanged', () => {
    expect(escapeRegExp('Grace-Hopper')).toBe('Grace-Hopper')
  })

  it('prevents persona names with metacharacters from breaking cleanResponse', () => {
    expect(cleanResponse('Ada): hello there', 'Ada)')).toBe('hello there')
    expect(cleanResponse('C++: operator talk', 'C++')).toBe('operator talk')
  })
})

describe('cleanResponse', () => {
  it('removes a leading persona label', () => {
    expect(cleanResponse('Ada: rent is too high', 'Ada')).toBe('rent is too high')
  })

  it('removes tool-call and xml artifacts', () => {
    const raw = 'Hello there <tool_call>doThing()</tool_call>'
    expect(cleanResponse(raw, 'Ada')).toBe('Hello there')
  })

  it('keeps ordinary dialogue intact', () => {
    expect(cleanResponse('Rent is due and I am broke.', 'Ada')).toBe(
      'Rent is due and I am broke.'
    )
  })
})

describe('buildPersonaPrompt', () => {
  it('includes the persona name, topic, and other participants', () => {
    const prompt = buildPersonaPrompt(persona('a', 'Ada'), 'Housing', ['Bo', 'Cy'])
    expect(prompt).toContain('You are Ada')
    expect(prompt).toContain('TOPIC: Housing')
    expect(prompt).toContain('Bo')
    expect(prompt).toContain('Cy')
  })
})
