import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Creating a chat with participants must record a speaking order.
 *
 * This is the bug these tests exist for: the create path passed only `personaId`
 * and relied on `PersonaOnChat.sortOrder`'s schema default of 0. Every
 * participant therefore tied, `ORDER BY sortOrder` became a no-op, and the
 * speaker was whichever row Postgres happened to return first. The roles feature
 * promises the researcher grounds the discussion first; without an order that
 * promise was never actually kept, and the symptom was intermittent because a
 * tie usually resolves to insertion order until the table is churned.
 */
const { prismaMock, authMock } = vi.hoisted(() => ({
  prismaMock: {
    persona: { findMany: vi.fn() },
    chat: { create: vi.fn() },
  },
  authMock: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/auth', () => ({ auth: authMock }))

import { POST } from '@/app/api/chats/route'

/** Pull the participant rows out of whatever was handed to prisma.chat.create. */
function participantsSentToCreate(): Array<{ personaId: string; sortOrder?: number }> {
  const arg = prismaMock.chat.create.mock.calls.at(-1)?.[0]
  return arg?.data?.participants?.create ?? []
}

function post(body: unknown) {
  return POST(
    new Request('http://localhost/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never
  )
}

describe('POST /api/chats — participant speaking order', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.persona.findMany.mockResolvedValue([
      { id: 'p-researcher' },
      { id: 'p-critic' },
      { id: 'p-synth' },
    ])
    prismaMock.chat.create.mockResolvedValue({ id: 'c1', participants: [] })
  })

  it('assigns an explicit sortOrder to every participant', async () => {
    await post({
      title: 'T',
      participantIds: ['p-researcher', 'p-critic', 'p-synth'],
    })

    const rows = participantsSentToCreate()
    expect(rows).toHaveLength(3)
    for (const row of rows) {
      expect(row.sortOrder).toBeTypeOf('number')
    }
  })

  it('numbers participants from zero, in the order they were given', async () => {
    await post({
      title: 'T',
      participantIds: ['p-researcher', 'p-critic', 'p-synth'],
    })

    expect(participantsSentToCreate()).toEqual([
      { personaId: 'p-researcher', sortOrder: 0 },
      { personaId: 'p-critic', sortOrder: 1 },
      { personaId: 'p-synth', sortOrder: 2 },
    ])
  })

  it('never leaves two participants tied — a tie is what made order random', async () => {
    await post({
      title: 'T',
      participantIds: ['p-researcher', 'p-critic', 'p-synth'],
    })

    const orders = participantsSentToCreate().map((r) => r.sortOrder)
    expect(new Set(orders).size).toBe(orders.length)
  })

  it('still creates the chat when no participants are given', async () => {
    await post({ title: 'T' })
    expect(prismaMock.chat.create).toHaveBeenCalled()
    expect(participantsSentToCreate()).toEqual([])
  })

  it('drops personas the caller does not own, and keeps the rest ordered', async () => {
    prismaMock.persona.findMany.mockResolvedValue([{ id: 'p-critic' }])

    await post({
      title: 'T',
      participantIds: ['p-researcher', 'p-critic'],
    })

    expect(participantsSentToCreate()).toEqual([{ personaId: 'p-critic', sortOrder: 0 }])
  })
})
