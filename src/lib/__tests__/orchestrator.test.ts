import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../prisma', () => ({
  prisma: {
    provider: { findFirst: vi.fn() },
    message: { findMany: vi.fn(), create: vi.fn() },
    chat: { update: vi.fn(), findUnique: vi.fn() },
    personaOnChat: { create: vi.fn(), deleteMany: vi.fn(), aggregate: vi.fn() },
    persona: { findMany: vi.fn() },
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
  addParticipants,
  buildConversationContext,
  buildPersonaPrompt,
  cleanResponse,
  escapeRegExp,
  extractMention,
  getNextSpeaker,
  isRefusal,
  orchestrateMessage,
  stripRefusal,
} from '../orchestrator'
import { prisma } from '../prisma'
import { getLLMResponse } from '../llm-provider'

type Persona = {
  id: string
  name: string
  bio: string
  personality: string | null
  role: string
  tools: string[]
  temperature: number | null
  model: string | null
  providerId: string | null
  createdAt: Date
  updatedAt: Date
  creatorId: string | null
  avatarUrl: string | null
}

function persona(id: string, name: string, role = 'contributor'): Persona {
  return {
    id,
    name,
    bio: `A thoughtful participant named ${name} with strong opinions.`,
    personality: 'direct',
    role,
    tools: [],
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

describe('addParticipants ownership', () => {
  beforeEach(() => {
    vi.mocked(prisma.persona.findMany).mockReset()
    vi.mocked(prisma.personaOnChat.create).mockReset()
    vi.mocked(prisma.personaOnChat.create).mockResolvedValue({} as never)
    vi.mocked(prisma.personaOnChat.aggregate).mockReset()
    // Empty chat by default: the first participant lands at position 0.
    vi.mocked(prisma.personaOnChat.aggregate).mockResolvedValue({
      _max: { sortOrder: null },
    } as never)
  })

  it('scopes the ownership lookup to the requesting user', async () => {
    vi.mocked(prisma.persona.findMany).mockResolvedValue([] as never)

    await addParticipants('chat-1', ['someone-elses'], 'user-1')

    expect(prisma.persona.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['someone-elses'] }, creatorId: 'user-1' },
      select: { id: true },
    })
  })

  it('refuses to attach a persona the user does not own', async () => {
    vi.mocked(prisma.persona.findMany).mockResolvedValue([] as never)

    const result = await addParticipants('chat-1', ['theirs'], 'user-1')

    expect(result).toEqual({ added: 0, skipped: 1 })
    expect(prisma.personaOnChat.create).not.toHaveBeenCalled()
  })

  it('attaches owned personas and skips the rest', async () => {
    vi.mocked(prisma.persona.findMany).mockResolvedValue([{ id: 'mine' }] as never)

    const result = await addParticipants('chat-1', ['mine', 'theirs'], 'user-1')

    expect(result).toEqual({ added: 1, skipped: 1 })
    expect(prisma.personaOnChat.create).toHaveBeenCalledTimes(1)
    expect(prisma.personaOnChat.create).toHaveBeenCalledWith({
      data: { personaId: 'mine', chatId: 'chat-1', sortOrder: 0 },
    })
  })

  it('numbers participants from the highest position already on the chat', async () => {
    vi.mocked(prisma.persona.findMany).mockResolvedValue([
      { id: 'a' },
      { id: 'b' },
    ] as never)
    vi.mocked(prisma.personaOnChat.aggregate).mockResolvedValue({
      _max: { sortOrder: 2 },
    } as never)

    await addParticipants('chat-1', ['a', 'b'], 'user-1')

    // Appending must continue the speaking order, not restart it.
    expect(prisma.personaOnChat.create).toHaveBeenNthCalledWith(1, {
      data: { personaId: 'a', chatId: 'chat-1', sortOrder: 3 },
    })
    expect(prisma.personaOnChat.create).toHaveBeenNthCalledWith(2, {
      data: { personaId: 'b', chatId: 'chat-1', sortOrder: 4 },
    })
  })

  it('starts a fresh chat at position 0', async () => {
    vi.mocked(prisma.persona.findMany).mockResolvedValue([
      { id: 'first' },
      { id: 'second' },
    ] as never)

    await addParticipants('chat-1', ['first', 'second'], 'user-1')

    expect(prisma.personaOnChat.create).toHaveBeenNthCalledWith(1, {
      data: { personaId: 'first', chatId: 'chat-1', sortOrder: 0 },
    })
    expect(prisma.personaOnChat.create).toHaveBeenNthCalledWith(2, {
      data: { personaId: 'second', chatId: 'chat-1', sortOrder: 1 },
    })
  })

  it('does not advance the order for a persona that was skipped', async () => {
    vi.mocked(prisma.persona.findMany).mockResolvedValue([{ id: 'mine' }] as never)

    await addParticipants('chat-1', ['theirs', 'mine'], 'user-1')

    // 'theirs' is rejected, so 'mine' still takes the first free slot.
    expect(prisma.personaOnChat.create).toHaveBeenCalledTimes(1)
    expect(prisma.personaOnChat.create).toHaveBeenCalledWith({
      data: { personaId: 'mine', chatId: 'chat-1', sortOrder: 0 },
    })
  })

  it('counts an already-present participant as skipped', async () => {
    vi.mocked(prisma.persona.findMany).mockResolvedValue([{ id: 'mine' }] as never)
    vi.mocked(prisma.personaOnChat.create).mockRejectedValue(new Error('unique constraint'))

    const result = await addParticipants('chat-1', ['mine'], 'user-1')

    expect(result).toEqual({ added: 0, skipped: 1 })
  })

  it('does not query at all for an empty list', async () => {
    const result = await addParticipants('chat-1', [], 'user-1')

    expect(result).toEqual({ added: 0, skipped: 0 })
    expect(prisma.persona.findMany).not.toHaveBeenCalled()
  })
})

describe('orchestrateMessage context window', () => {
  const provider = {
    id: 'p1',
    name: 'P',
    provider: 'openai',
    apiUrl: 'https://api.openai.com/v1',
    apiKey: 'encrypted',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    isDefault: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    creatorId: 'u1',
  }

  beforeEach(() => {
    vi.mocked(prisma.message.findMany).mockReset()
    vi.mocked(prisma.provider.findFirst).mockReset()
    vi.mocked(prisma.message.create).mockReset()
    vi.mocked(prisma.chat.update).mockReset()
    vi.mocked(getLLMResponse).mockReset()

    vi.mocked(prisma.provider.findFirst).mockResolvedValue(provider as never)
    vi.mocked(prisma.message.create).mockResolvedValue({} as never)
    vi.mocked(prisma.chat.update).mockResolvedValue({} as never)
    vi.mocked(getLLMResponse).mockResolvedValue({
      content: 'A considered reply that moves the discussion forward.',
    })
  })

  async function run(messages: unknown[]) {
    vi.mocked(prisma.message.findMany).mockResolvedValue(messages as never)
    return orchestrateMessage(
      { chatId: 'c1', topic: 'Housing', isAutoMode: false, lastSpeakerId: null },
      '',
      false,
      [persona('a', 'Ada')],
      'u1'
    )
  }

  it('asks the database for the newest messages first, then reverses them', async () => {
    await run([])

    expect(prisma.message.findMany).toHaveBeenCalledWith({
      where: { chatId: 'c1' },
      orderBy: { createdAt: 'desc' },
      take: 15,
    })
  })

  it('points the JUST SAID instruction at the newest message, not the oldest', async () => {
    // findMany returns newest-first, exactly as the desc query does.
    await run([
      { content: 'THE-NEWEST-THING', role: 'persona', personaName: 'Bo', personaId: 'b', createdAt: new Date('2026-01-02') },
      { content: 'an older thing', role: 'persona', personaName: 'Bo', personaId: 'b', createdAt: new Date('2026-01-01') },
    ])

    const sentMessages = vi.mocked(getLLMResponse).mock.calls[0][3] as Array<{ content: string }>
    const justSaid = sentMessages.find((m) => m.content.includes('JUST SAID'))

    expect(justSaid).toBeDefined()
    expect(justSaid?.content).toContain('THE-NEWEST-THING')
    expect(justSaid?.content).not.toContain('an older thing')
  })
})

describe('buildPersonaPrompt task mode', () => {
  const brief = {
    mode: 'task',
    objective: 'Decide whether to buy or rent',
    deliverableSpec: 'A one-page recommendation',
    audience: 'A first-time buyer',
  }

  it('renders the structured brief and the participant role', () => {
    const prompt = buildPersonaPrompt(persona('a', 'Ada', 'critic'), 'Housing', ['Bo'], brief)

    expect(prompt).toContain('OBJECTIVE: Decide whether to buy or rent')
    expect(prompt).toContain('DELIVERABLE: A one-page recommendation')
    expect(prompt).toContain('AUDIENCE: A first-time buyer')
    expect(prompt).toContain('YOUR ROLE: critic')
    expect(prompt).toContain('Attack the weakest part')
  })

  it('drops the adversarial debate instructions', () => {
    const prompt = buildPersonaPrompt(persona('a', 'Ada'), 'Housing', [], brief)

    expect(prompt).not.toContain('GASLIGHTING')
    expect(prompt).not.toContain('Do NOT change your mind')
    expect(prompt).not.toContain('You are NOT an AI')
    expect(prompt).toContain('Change your position when someone gives you a better reason')
  })

  it('gives each role a different directive', () => {
    const researcher = buildPersonaPrompt(persona('a', 'Ada', 'researcher'), 'T', [], brief)
    const planner = buildPersonaPrompt(persona('a', 'Ada', 'planner'), 'T', [], brief)

    expect(researcher).toContain('Bring evidence')
    expect(planner).toContain('concrete steps')
    expect(researcher).not.toEqual(planner)
  })

  it('falls back to contributor for an unrecognised role', () => {
    const prompt = buildPersonaPrompt(persona('a', 'Ada', 'wizard'), 'T', [], brief)
    expect(prompt).toContain('YOUR ROLE: contributor')
  })

  it('prefers the objective over the short topic label', () => {
    const prompt = buildPersonaPrompt(persona('a', 'Ada'), 'short label', [], brief)
    expect(prompt).toContain('OBJECTIVE: Decide whether to buy or rent')
  })

  it('leaves debate mode untouched', () => {
    const prompt = buildPersonaPrompt(persona('a', 'Ada'), 'Housing', ['Bo'], { mode: 'debate' })

    expect(prompt).toContain('GASLIGHTING')
    expect(prompt).toContain('TOPIC: Housing')
    expect(prompt).not.toContain('YOUR ROLE:')
  })
})
