import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, authMock } = vi.hoisted(() => ({
  prismaMock: {
    membership: { findUnique: vi.fn() },
    auditEvent: { findMany: vi.fn() },
  },
  authMock: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/auth', () => ({ auth: authMock }))

import { GET as getActivity } from '@/app/api/workspaces/[id]/audit/route'

function requestActivity(workspaceId: string, query = '') {
  return getActivity(
    new Request(`http://localhost/api/workspaces/${workspaceId}/audit${query}`) as never,
    { params: Promise.resolve({ id: workspaceId }) }
  )
}

describe('GET /api/workspaces/[id]/audit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.membership.findUnique.mockResolvedValue({ role: 'VIEWER', workspaceId: 'w1' })
    prismaMock.auditEvent.findMany.mockResolvedValue([])
  })

  it('lets any member read the activity feed', async () => {
    const res = await requestActivity('w1')

    expect(res.status).toBe(200)
    expect(prismaMock.auditEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workspaceId: 'w1' },
        take: 100,
      })
    )
  })

  it('filters by decision and clamps the limit', async () => {
    await requestActivity('w1', '?decisionId=d1&limit=999')

    expect(prismaMock.auditEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workspaceId: 'w1', decisionId: 'd1' },
        take: 200,
      })
    )
  })

  it('returns 404 for a non-member', async () => {
    prismaMock.membership.findUnique.mockResolvedValue(null)

    const res = await requestActivity('w1')

    expect(res.status).toBe(404)
    expect(prismaMock.auditEvent.findMany).not.toHaveBeenCalled()
  })

  it('requires authentication', async () => {
    authMock.mockResolvedValue(null)

    const res = await requestActivity('w1')

    expect(res.status).toBe(401)
  })
})
