import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The runner is the Stage 1 core: it advances debates unattended on a schedule,
 * so a regression here fails silently in production rather than in a test run.
 * These tests pin the paths that matter — the atomic claim, the stop conditions,
 * the turn accounting and the budget — rather than the SQL text itself.
 */
// vi.mock is hoisted above every declaration in this file, so the mocks have to
// be created inside vi.hoisted or they are still uninitialised when the factory
// runs.
const { prismaMock, orchestrateMessage } = vi.hoisted(() => ({
  prismaMock: {
    chat: { findUnique: vi.fn(), update: vi.fn() },
    $queryRaw: vi.fn(),
  },
  orchestrateMessage: vi.fn(),
}))

vi.mock('../prisma', () => ({ prisma: prismaMock }))
vi.mock('../orchestrator', () => ({ orchestrateMessage }))

import {
  DEFAULT_TICK_BATCH,
  TURN_INTERVAL_MS,
  advanceChat,
  claimDueChats,
  runTurn,
  startChat,
  stopChat,
  tick,
} from '../debate-runner'

const PERSONA = { id: 'persona-1', name: 'Researcher' }
const PARTICIPANT = { persona: PERSONA, sortOrder: 0 }

function chatRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'chat-1',
    topic: 'Buy vs rent',
    isAutoMode: true,
    lastSpeakerId: null,
    creatorId: 'user-1',
    participants: [PARTICIPANT],
    turnsRemaining: null,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  orchestrateMessage.mockResolvedValue({ speakerId: 'persona-1' })
  prismaMock.chat.update.mockResolvedValue({})
  prismaMock.$queryRaw.mockResolvedValue([])
})

describe('runTurn', () => {
  it('reports a missing chat rather than throwing', async () => {
    prismaMock.chat.findUnique.mockResolvedValue(null)

    await expect(runTurn('chat-1')).resolves.toEqual({
      ok: false,
      error: 'Chat not found',
    })
    expect(orchestrateMessage).not.toHaveBeenCalled()
  })

  it('refuses to run a chat with no participants', async () => {
    prismaMock.chat.findUnique.mockResolvedValue(chatRow({ participants: [] }))

    await expect(runTurn('chat-1')).resolves.toEqual({
      ok: false,
      error: 'No participants in chat',
    })
    expect(orchestrateMessage).not.toHaveBeenCalled()
  })

  it('asks for participants in speaking order', async () => {
    prismaMock.chat.findUnique.mockResolvedValue(chatRow())

    await runTurn('chat-1')

    // Order is what makes the researcher -> critic -> synthesizer sequence hold.
    expect(prismaMock.chat.findUnique).toHaveBeenCalledWith({
      where: { id: 'chat-1' },
      include: {
        participants: { include: { persona: true }, orderBy: { sortOrder: 'asc' } },
      },
    })
  })

  it('passes the brief and the participant list through to orchestration', async () => {
    const row = chatRow()
    prismaMock.chat.findUnique.mockResolvedValue(row)

    await runTurn('chat-1')

    const [context, message, isAuto, participants, ownerId] =
      orchestrateMessage.mock.calls[0]
    expect(context).toMatchObject({
      chatId: 'chat-1',
      topic: 'Buy vs rent',
      isAutoMode: true,
      brief: row,
    })
    // An empty message is what makes this an agent turn rather than a user turn.
    expect(message).toBe('')
    expect(isAuto).toBe(false)
    expect(participants).toEqual([PERSONA])
    expect(ownerId).toBe('user-1')
  })

  it('surfaces an orchestration error as a failed turn', async () => {
    prismaMock.chat.findUnique.mockResolvedValue(chatRow())
    orchestrateMessage.mockResolvedValue({ error: 'Provider returned 401' })

    await expect(runTurn('chat-1')).resolves.toEqual({
      ok: false,
      error: 'Provider returned 401',
    })
  })

  it('returns the speaker on success', async () => {
    prismaMock.chat.findUnique.mockResolvedValue(chatRow())
    orchestrateMessage.mockResolvedValue({ speakerId: 'persona-9' })

    await expect(runTurn('chat-1')).resolves.toEqual({
      ok: true,
      speakerId: 'persona-9',
    })
  })
})

describe('claimDueChats', () => {
  it('returns the claimed ids', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ id: 'a' }, { id: 'b' }])

    await expect(claimDueChats()).resolves.toEqual(['a', 'b'])
  })

  it('bounds the claim to the batch size', async () => {
    prismaMock.$queryRaw.mockResolvedValue([])

    await claimDueChats(3)

    const sql = prismaMock.$queryRaw.mock.calls[0][0]
    expect(sql.values).toContain(3)
  })

  it('defaults to the tick batch', async () => {
    prismaMock.$queryRaw.mockResolvedValue([])

    await claimDueChats()

    expect(prismaMock.$queryRaw.mock.calls[0][0].values).toContain(DEFAULT_TICK_BATCH)
  })

  it('pushes the next turn forward by the turn interval', async () => {
    prismaMock.$queryRaw.mockResolvedValue([])

    await claimDueChats()

    // The claim and the reschedule are the same statement, which is what stops
    // two overlapping ticks taking the same chat.
    expect(prismaMock.$queryRaw.mock.calls[0][0].values).toContain(TURN_INTERVAL_MS)
  })
})

describe('startChat and stopChat', () => {
  it('starts a chat immediately when no turn budget is given', async () => {
    await startChat('chat-1')

    const { data } = prismaMock.chat.update.mock.calls[0][0]
    expect(data.isAutoMode).toBe(true)
    expect(data.turnsRemaining).toBeNull()
    expect(data.autoAdvanceAt).toBeInstanceOf(Date)
  })

  it('records a turn budget when one is given', async () => {
    await startChat('chat-1', 4)

    expect(prismaMock.chat.update.mock.calls[0][0].data.turnsRemaining).toBe(4)
  })

  it('treats an explicit null budget as unbounded', async () => {
    await startChat('chat-1', null)

    expect(prismaMock.chat.update.mock.calls[0][0].data.turnsRemaining).toBeNull()
  })

  it('clears both the flag and the schedule when stopping', async () => {
    await stopChat('chat-1')

    expect(prismaMock.chat.update).toHaveBeenCalledWith({
      where: { id: 'chat-1' },
      data: { isAutoMode: false, autoAdvanceAt: null },
    })
  })
})

describe('advanceChat', () => {
  it('fails a chat that no longer exists', async () => {
    prismaMock.chat.findUnique.mockResolvedValue(null)

    await expect(advanceChat('chat-1')).resolves.toEqual({
      chatId: 'chat-1',
      outcome: 'failed',
      error: 'Chat not found',
    })
  })

  it('reports a stopped chat without running a turn', async () => {
    prismaMock.chat.findUnique.mockResolvedValue({ isAutoMode: false, turnsRemaining: null })

    await expect(advanceChat('chat-1')).resolves.toMatchObject({ outcome: 'stopped' })
    expect(orchestrateMessage).not.toHaveBeenCalled()
  })

  it('stops the run when a turn fails, so a broken provider is not retried', async () => {
    prismaMock.chat.findUnique
      .mockResolvedValueOnce({ isAutoMode: true, turnsRemaining: null })
      .mockResolvedValueOnce(chatRow())
    orchestrateMessage.mockResolvedValue({ error: 'Provider returned 500' })

    const result = await advanceChat('chat-1')

    expect(result).toMatchObject({ outcome: 'stopped', error: 'Provider returned 500' })
    expect(prismaMock.chat.update).toHaveBeenCalledWith({
      where: { id: 'chat-1' },
      data: { isAutoMode: false, autoAdvanceAt: null },
    })
  })

  it('increments the turn count and reschedules after a successful turn', async () => {
    prismaMock.chat.findUnique
      .mockResolvedValueOnce({ isAutoMode: true, turnsRemaining: null })
      .mockResolvedValueOnce(chatRow())

    const before = Date.now()
    const result = await advanceChat('chat-1')

    expect(result).toMatchObject({ outcome: 'advanced', speakerId: 'persona-1' })

    const { data } = prismaMock.chat.update.mock.calls[0][0]
    expect(data.turnCount).toEqual({ increment: 1 })
    expect(data.isAutoMode).toBe(true)
    expect(data.autoAdvanceAt.getTime()).toBeGreaterThanOrEqual(before + TURN_INTERVAL_MS)
  })

  it('keeps an unbounded run running indefinitely', async () => {
    prismaMock.chat.findUnique
      .mockResolvedValueOnce({ isAutoMode: true, turnsRemaining: null })
      .mockResolvedValueOnce(chatRow())

    await advanceChat('chat-1')

    expect(prismaMock.chat.update.mock.calls[0][0].data.turnsRemaining).toBeNull()
  })

  it('decrements a bounded run without finishing it early', async () => {
    prismaMock.chat.findUnique
      .mockResolvedValueOnce({ isAutoMode: true, turnsRemaining: 3 })
      .mockResolvedValueOnce(chatRow())

    await advanceChat('chat-1')

    const { data } = prismaMock.chat.update.mock.calls[0][0]
    expect(data.turnsRemaining).toBe(2)
    expect(data.isAutoMode).toBe(true)
    expect(data.autoAdvanceAt).toBeInstanceOf(Date)
  })

  it('finishes a run on its last turn', async () => {
    prismaMock.chat.findUnique
      .mockResolvedValueOnce({ isAutoMode: true, turnsRemaining: 1 })
      .mockResolvedValueOnce(chatRow())

    await advanceChat('chat-1')

    const { data } = prismaMock.chat.update.mock.calls[0][0]
    expect(data.turnsRemaining).toBe(0)
    expect(data.isAutoMode).toBe(false)
    expect(data.autoAdvanceAt).toBeNull()
  })
})

describe('tick', () => {
  it('does nothing when no chats are due', async () => {
    prismaMock.$queryRaw.mockResolvedValue([])

    await expect(tick()).resolves.toEqual({
      claimed: 0,
      advanced: 0,
      stopped: 0,
      failed: 0,
      chats: [],
    })
  })

  it('advances each claimed chat once by default', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ id: 'a' }, { id: 'b' }])
    prismaMock.chat.findUnique.mockResolvedValue({
      isAutoMode: true,
      turnsRemaining: null,
      participants: [PARTICIPANT],
      creatorId: 'user-1',
      topic: 't',
      lastSpeakerId: null,
    })

    const result = await tick()

    expect(result.claimed).toBe(2)
    expect(result.advanced).toBe(2)
    // One turn per chat, so orchestration runs exactly once per claimed chat.
    expect(orchestrateMessage).toHaveBeenCalledTimes(2)
  })

  it('paces turns between calls to the provider', async () => {
    // tick really does sleep TURN_INTERVAL_MS between turns, so this has to run
    // on fake timers rather than blocking the suite for eight seconds.
    vi.useFakeTimers()
    try {
      prismaMock.$queryRaw.mockResolvedValue([{ id: 'a' }])
      prismaMock.chat.findUnique.mockResolvedValue({
        isAutoMode: true,
        turnsRemaining: null,
        participants: [PARTICIPANT],
        creatorId: 'user-1',
        topic: 't',
        lastSpeakerId: null,
      })

      const pending = tick({ maxTurnsPerChat: 3, budgetMs: 30_000 })

      // Without advancing the clock only the first turn can have run.
      await vi.advanceTimersByTimeAsync(0)
      expect(orchestrateMessage).toHaveBeenCalledTimes(1)

      await vi.advanceTimersByTimeAsync(TURN_INTERVAL_MS * 2)
      const result = await pending

      expect(result.advanced).toBe(3)
      expect(orchestrateMessage).toHaveBeenCalledTimes(3)
    } finally {
      vi.useRealTimers()
    }
  })

  it('stops looping a chat once its turn is not advanced', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ id: 'a' }])
    // Not running: advanceChat returns 'stopped' immediately.
    prismaMock.chat.findUnique.mockResolvedValue({ isAutoMode: false, turnsRemaining: null })

    const result = await tick({ maxTurnsPerChat: 5, budgetMs: 30_000 })

    expect(result.stopped).toBe(1)
    expect(result.advanced).toBe(0)
    expect(orchestrateMessage).not.toHaveBeenCalled()
  })

  it('counts failures separately from stops', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ id: 'gone' }])
    prismaMock.chat.findUnique.mockResolvedValue(null)

    const result = await tick()

    expect(result.failed).toBe(1)
    expect(result.stopped).toBe(0)
    expect(result.advanced).toBe(0)
  })

  it('does not start a second turn when the budget is already spent', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ id: 'a' }])
    prismaMock.chat.findUnique.mockResolvedValue({
      isAutoMode: true,
      turnsRemaining: null,
      participants: [PARTICIPANT],
      creatorId: 'user-1',
      topic: 't',
      lastSpeakerId: null,
    })

    // A zero budget must not prevent the first turn, but must prevent a second.
    const result = await tick({ maxTurnsPerChat: 5, budgetMs: 0 })

    expect(result.advanced).toBe(1)
  })
})
