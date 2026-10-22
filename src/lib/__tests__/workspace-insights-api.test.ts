import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, authMock } = vi.hoisted(() => ({
  prismaMock: {
    membership: { findUnique: vi.fn() },
    decision: { findMany: vi.fn() },
    workspaceSource: { findMany: vi.fn() },
  },
  authMock: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/auth', () => ({ auth: authMock }))

import { GET as getInsights } from '@/app/api/workspaces/[id]/insights/route'

function requestInsights(workspaceId: string) {
  return getInsights(
    new Request(`http://localhost/api/workspaces/${workspaceId}/insights`) as never,
    { params: Promise.resolve({ id: workspaceId }) }
  )
}

describe('GET /api/workspaces/[id]/insights', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.membership.findUnique.mockResolvedValue({ role: 'VIEWER', workspaceId: 'w1' })
    prismaMock.decision.findMany.mockResolvedValue([
      {
        id: 'd1',
        title: 'Validate sessions',
        status: 'APPROVED',
        impact: 'HIGH',
        debtScore: 30,
        outcome: 'VALIDATED',
        revisitAt: null,
        evidence: [{ status: 'VERIFIED' }],
        approvals: [{ status: 'APPROVED' }],
      },
    ])
    prismaMock.workspaceSource.findMany.mockResolvedValue([
      { fileCount: 1, commitCount: 2, pullRequestCount: 0, issueCount: 0 },
    ])
  })

  it('returns insights to any member', async () => {
    const res = await requestInsights('w1')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toMatchObject({
      totalDecisions: 1,
      averageDebt: 30,
      evidenceCoverage: 100,
      totalEvidence: 1,
      totalApprovals: 1,
    })
    expect(prismaMock.decision.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { workspaceId: 'w1' } })
    )
  })

  it('returns 404 for a non-member', async () => {
    prismaMock.membership.findUnique.mockResolvedValue(null)

    const res = await requestInsights('w1')

    expect(res.status).toBe(404)
    expect(prismaMock.decision.findMany).not.toHaveBeenCalled()
  })

  it('requires authentication', async () => {
    authMock.mockResolvedValue(null)

    const res = await requestInsights('w1')

    expect(res.status).toBe(401)
  })
})
