import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, authMock } = vi.hoisted(() => ({
  prismaMock: {
    decision: { findUnique: vi.fn() },
    decisionPin: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    membership: { findUnique: vi.fn() },
  },
  authMock: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/auth', () => ({ auth: authMock }))

import { POST as createPin } from '@/app/api/decisions/[id]/pins/route'
import { PATCH as updatePin } from '@/app/api/decision-pins/[id]/route'

function postPin(decisionId: string, body: unknown) {
  return createPin(
    new Request(`http://localhost/api/decisions/${decisionId}/pins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
    { params: Promise.resolve({ id: decisionId }) }
  )
}

function patchPin(pinId: string, body: unknown) {
  return updatePin(
    new Request(`http://localhost/api/decision-pins/${pinId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
    { params: Promise.resolve({ id: pinId }) }
  )
}

const pin = {
  id: 'p1',
  ownerId: 'u1',
  decisionPoint: 'Session validation point',
  chosenValue: 'Sessions are validated on every request.',
  separatingTest: 'Request a protected route without a cookie; expect 401.',
  expectedResult: '401 Unauthorized',
  codeScope: 'src/middleware.ts',
  status: 'ACTIVE',
  lastRunAt: null,
  lastRunResult: null,
  supersessionTrigger: 'Revisit if validation moves to the edge runtime.',
  createdAt: new Date('2026-10-21T12:00:00.000Z'),
  updatedAt: new Date('2026-10-21T12:00:00.000Z'),
  owner: { name: 'Asha Rao', email: 'asha@example.com' },
}

describe('POST /api/decisions/[id]/pins', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.decision.findUnique.mockResolvedValue({
      id: 'd1',
      workspaceId: 'w1',
      workspace: { memberships: [{ role: 'REVIEWER' }] },
    })
    prismaMock.decisionPin.create.mockResolvedValue(pin)
  })

  it('creates a decision pin owned by the caller', async () => {
    const res = await postPin('d1', {
      decisionPoint: 'Session validation point',
      chosenValue: 'Sessions are validated on every request.',
      separatingTest: 'Request a protected route without a cookie; expect 401.',
      expectedResult: '401 Unauthorized',
      codeScope: 'src/middleware.ts',
    })

    expect(res.status).toBe(201)
    expect(prismaMock.decisionPin.create.mock.calls[0][0].data).toMatchObject({
      decisionId: 'd1',
      ownerId: 'u1',
      decisionPoint: 'Session validation point',
      chosenValue: 'Sessions are validated on every request.',
      separatingTest: 'Request a protected route without a cookie; expect 401.',
    })
  })

  it('requires the separating test', async () => {
    const res = await postPin('d1', {
      decisionPoint: 'Session validation point',
      chosenValue: 'Sessions are validated on every request.',
    })

    expect(res.status).toBe(400)
    expect(prismaMock.decisionPin.create).not.toHaveBeenCalled()
  })

  it('blocks viewers', async () => {
    prismaMock.decision.findUnique.mockResolvedValue({
      id: 'd1',
      workspaceId: 'w1',
      workspace: { memberships: [{ role: 'VIEWER' }] },
    })

    const res = await postPin('d1', {
      decisionPoint: 'P',
      chosenValue: 'C',
      separatingTest: 'T',
    })

    expect(res.status).toBe(403)
    expect(prismaMock.decisionPin.create).not.toHaveBeenCalled()
  })
})

describe('PATCH /api/decision-pins/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.decisionPin.findUnique.mockResolvedValue({
      id: 'p1',
      decisionId: 'd1',
      decision: {
        workspaceId: 'w1',
        workspace: { memberships: [{ role: 'REVIEWER' }] },
      },
    })
    prismaMock.decisionPin.update.mockResolvedValue({ ...pin, status: 'SUPERSEDED' })
  })

  it('records a test run result and timestamp', async () => {
    const res = await patchPin('p1', { lastRunResult: 'Passed: 401 returned' })

    expect(res.status).toBe(200)
    expect(prismaMock.decisionPin.update.mock.calls[0][0].data).toMatchObject({
      lastRunResult: 'Passed: 401 returned',
      lastRunAt: expect.any(Date),
    })
  })

  it('can supersede a pin', async () => {
    const res = await patchPin('p1', { status: 'SUPERSEDED' })

    expect(res.status).toBe(200)
    expect(prismaMock.decisionPin.update.mock.calls[0][0].data).toEqual({
      status: 'SUPERSEDED',
    })
  })

  it('blocks viewers', async () => {
    prismaMock.decisionPin.findUnique.mockResolvedValue({
      id: 'p1',
      decisionId: 'd1',
      decision: {
        workspaceId: 'w1',
        workspace: { memberships: [{ role: 'VIEWER' }] },
      },
    })

    const res = await patchPin('p1', { status: 'SUPERSEDED' })

    expect(res.status).toBe(403)
    expect(prismaMock.decisionPin.update).not.toHaveBeenCalled()
  })
})
