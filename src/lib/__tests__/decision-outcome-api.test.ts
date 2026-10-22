import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, authMock } = vi.hoisted(() => ({
  prismaMock: {
    decision: { findUnique: vi.fn(), update: vi.fn() },
  },
  authMock: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/auth', () => ({ auth: authMock }))

import { PUT as updateDecision } from '@/app/api/decisions/[id]/route'

function putDecision(decisionId: string, body: unknown) {
  return updateDecision(
    new Request(`http://localhost/api/decisions/${decisionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
    { params: Promise.resolve({ id: decisionId }) }
  )
}

describe('PUT /api/decisions/[id] — outcome and revisit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.decision.findUnique.mockResolvedValue({
      id: 'd1',
      workspaceId: 'w1',
      workspace: { memberships: [{ role: 'REVIEWER' }] },
    })
    prismaMock.decision.update.mockImplementation(({ data }) => ({
      id: 'd1',
      title: 'Validate sessions',
      summary: null,
      status: 'APPROVED',
      impact: 'HIGH',
      debtScore: 30,
      debtRationale: null,
      scoredAt: null,
      reviewRoom: null,
      owner: null,
      createdAt: new Date('2026-10-21T12:00:00.000Z'),
      updatedAt: new Date('2026-10-21T12:00:00.000Z'),
      ...data,
    }))
  })

  it('records an outcome and revisit date', async () => {
    const res = await putDecision('d1', {
      outcome: 'VALIDATED',
      outcomeSummary: 'The control held in production.',
      revisitAt: '2027-01-15',
    })

    expect(res.status).toBe(200)
    const data = prismaMock.decision.update.mock.calls[0][0].data
    expect(data).toMatchObject({
      outcome: 'VALIDATED',
      outcomeSummary: 'The control held in production.',
      revisitAt: expect.any(Date),
      outcomeAt: expect.any(Date),
    })
  })

  it('clears the outcome and revisit date', async () => {
    const res = await putDecision('d1', { outcome: null, revisitAt: null })

    expect(res.status).toBe(200)
    expect(prismaMock.decision.update.mock.calls[0][0].data).toEqual({
      outcome: null,
      outcomeAt: null,
      revisitAt: null,
    })
  })

  it('rejects an unknown outcome', async () => {
    const res = await putDecision('d1', { outcome: 'MAYBE' })

    expect(res.status).toBe(400)
    expect(prismaMock.decision.update).not.toHaveBeenCalled()
  })

  it('rejects an invalid revisit date', async () => {
    const res = await putDecision('d1', { revisitAt: 'not-a-date' })

    expect(res.status).toBe(400)
    expect(prismaMock.decision.update).not.toHaveBeenCalled()
  })

  it('blocks viewers', async () => {
    prismaMock.decision.findUnique.mockResolvedValue({
      id: 'd1',
      workspaceId: 'w1',
      workspace: { memberships: [{ role: 'VIEWER' }] },
    })

    const res = await putDecision('d1', { outcome: 'VALIDATED' })

    expect(res.status).toBe(403)
    expect(prismaMock.decision.update).not.toHaveBeenCalled()
  })
})
