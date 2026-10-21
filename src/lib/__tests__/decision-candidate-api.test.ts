import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, authMock } = vi.hoisted(() => ({
  prismaMock: {
    decisionCandidate: { findUnique: vi.fn(), update: vi.fn() },
    decision: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    evidence: { createMany: vi.fn() },
  },
  authMock: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/auth', () => ({ auth: authMock }))

import { PATCH as reviewCandidate } from '@/app/api/decision-candidates/[id]/route'

function patchCandidate(id: string, body: unknown) {
  return reviewCandidate(
    new Request(`http://localhost/api/decision-candidates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
    { params: Promise.resolve({ id }) }
  )
}

const candidate = {
  id: 'c1',
  workspaceId: 'w1',
  title: 'Validate sessions on every request',
  context: 'Sessions are bearer credentials.',
  proposal: 'Session validation happens in middleware.',
  rationale: 'The source shows it.',
  confidence: 'HIGH',
  status: 'PENDING',
  decisionId: null,
  workspace: { memberships: [{ role: 'REVIEWER' }] },
  evidence: [
    {
      quote: 'Sessions are validated on every request.',
      snapshot: {
        kind: 'FILE',
        path: 'src/auth/session.ts',
        title: 'session.ts',
        sha: 'blob1',
        sha256: 'a'.repeat(64),
        source: { commitSha: 'abc123' },
      },
    },
  ],
}

describe('PATCH /api/decision-candidates/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.decisionCandidate.findUnique.mockResolvedValue(candidate)
    prismaMock.decision.create.mockResolvedValue({
      id: 'd1',
      title: candidate.title,
    })
    prismaMock.decision.update.mockResolvedValue({ id: 'd1' })
    prismaMock.evidence.createMany.mockResolvedValue({ count: 1 })
    prismaMock.decisionCandidate.update.mockImplementation(({ data }) => ({
      id: 'c1',
      status: data.status,
      decisionId: data.decisionId ?? null,
    }))
  })

  it('confirms a candidate into a decision with evidence', async () => {
    const res = await patchCandidate('c1', { status: 'CONFIRMED' })

    expect(res.status).toBe(200)
    expect(prismaMock.decision.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workspaceId: 'w1',
          title: candidate.title,
          status: 'DRAFT',
          createdById: 'u1',
          ownerId: 'u1',
        }),
      })
    )
    expect(prismaMock.evidence.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          decisionId: 'd1',
          kind: 'CODE',
          source: 'src/auth/session.ts',
          commit: 'abc123',
          quote: 'Sessions are validated on every request.',
          sha256: 'a'.repeat(64),
          status: 'VERIFIED',
          confidence: 'HIGH',
        }),
      ],
    })
    expect(prismaMock.decisionCandidate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'c1' },
        data: expect.objectContaining({
          status: 'CONFIRMED',
          decisionId: 'd1',
        }),
      })
    )
  })

  it('accepts an edited title before confirmation', async () => {
    await patchCandidate('c1', {
      status: 'CONFIRMED',
      title: '  Sessions are validated in middleware  ',
    })

    expect(prismaMock.decision.create.mock.calls[0][0].data.title).toBe(
      'Sessions are validated in middleware'
    )
  })

  it('rejects a candidate without creating a decision', async () => {
    const res = await patchCandidate('c1', { status: 'REJECTED' })

    expect(res.status).toBe(200)
    expect(prismaMock.decisionCandidate.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { status: 'REJECTED' },
      select: { id: true, status: true, decisionId: true },
    })
    expect(prismaMock.decision.create).not.toHaveBeenCalled()
  })

  it('refuses a viewer', async () => {
    prismaMock.decisionCandidate.findUnique.mockResolvedValue({
      ...candidate,
      workspace: { memberships: [{ role: 'VIEWER' }] },
    })

    const res = await patchCandidate('c1', { status: 'CONFIRMED' })

    expect(res.status).toBe(403)
    expect(prismaMock.decision.create).not.toHaveBeenCalled()
  })

  it('refuses to review a candidate twice', async () => {
    prismaMock.decisionCandidate.findUnique.mockResolvedValue({
      ...candidate,
      status: 'CONFIRMED',
      decisionId: 'd1',
    })

    const res = await patchCandidate('c1', { status: 'CONFIRMED' })

    expect(res.status).toBe(409)
    expect(prismaMock.decision.create).not.toHaveBeenCalled()
  })
})
