import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sha256 } from '../decision-report'

const { prismaMock, authMock } = vi.hoisted(() => ({
  prismaMock: {
    report: { findUnique: vi.fn() },
    reportShare: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  authMock: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/auth', () => ({ auth: authMock }))

import { GET as listShares, POST as createShare } from '@/app/api/reports/[id]/shares/route'
import { DELETE as revokeShare } from '@/app/api/report-shares/[id]/route'

const reportAccess = {
  id: 'r1',
  decision: { workspace: { memberships: [{ role: 'OWNER' }] } },
}

function postShare(reportId: string, body: unknown) {
  return createShare(
    new Request(`http://localhost/api/reports/${reportId}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
    { params: Promise.resolve({ id: reportId }) }
  )
}

function getShares(reportId: string) {
  return listShares(
    new Request(`http://localhost/api/reports/${reportId}/shares`) as never,
    { params: Promise.resolve({ id: reportId }) }
  )
}

function deleteShare(shareId: string) {
  return revokeShare(
    new Request(`http://localhost/api/report-shares/${shareId}`, {
      method: 'DELETE',
    }) as never,
    { params: Promise.resolve({ id: shareId }) }
  )
}

describe('POST /api/reports/[id]/shares', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.report.findUnique.mockResolvedValue(reportAccess)
    prismaMock.reportShare.create.mockResolvedValue({
      id: 's1',
      expiresAt: new Date('2026-10-28T12:00:00.000Z'),
      redactSources: false,
      viewCount: 0,
      createdAt: new Date('2026-10-21T12:00:00.000Z'),
    })
  })

  it('creates a hash-only share token and returns the one-time path', async () => {
    const res = await postShare('r1', { expiresInDays: 7, redactSources: true })
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.path).toMatch(/^\/share\/report\/.+/)
    const token = body.path.split('/').pop()
    const data = prismaMock.reportShare.create.mock.calls[0][0].data
    expect(data.tokenHash).toBe(sha256(token))
    expect(data.redactSources).toBe(true)
    expect(data.expiresAt).toBeInstanceOf(Date)
  })

  it('blocks viewers from creating share links', async () => {
    prismaMock.report.findUnique.mockResolvedValue({
      ...reportAccess,
      decision: { workspace: { memberships: [{ role: 'VIEWER' }] } },
    })

    const res = await postShare('r1', {})

    expect(res.status).toBe(403)
    expect(prismaMock.reportShare.create).not.toHaveBeenCalled()
  })

  it('rejects an expiry outside the allowed window', async () => {
    const res = await postShare('r1', { expiresInDays: 365 })

    expect(res.status).toBe(400)
    expect(prismaMock.reportShare.create).not.toHaveBeenCalled()
  })
})

describe('GET /api/reports/[id]/shares', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.report.findUnique.mockResolvedValue(reportAccess)
    prismaMock.reportShare.findMany.mockResolvedValue([])
  })

  it('lists only active links for an editor', async () => {
    const res = await getShares('r1')

    expect(res.status).toBe(200)
    expect(prismaMock.reportShare.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          reportId: 'r1',
          revokedAt: null,
        }),
      })
    )
  })
})

describe('DELETE /api/report-shares/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.reportShare.findUnique.mockResolvedValue({
      id: 's1',
      revokedAt: null,
      report: { decision: { workspace: { memberships: [{ role: 'OWNER' }] } } },
    })
    prismaMock.reportShare.update.mockResolvedValue({ id: 's1', revokedAt: new Date() })
  })

  it('revokes an active share without deleting its audit row', async () => {
    const res = await deleteShare('s1')

    expect(res.status).toBe(200)
    expect(prismaMock.reportShare.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { revokedAt: expect.any(Date) },
    })
  })

  it('blocks viewers from revoking a link', async () => {
    prismaMock.reportShare.findUnique.mockResolvedValue({
      id: 's1',
      revokedAt: null,
      report: { decision: { workspace: { memberships: [{ role: 'VIEWER' }] } } },
    })

    const res = await deleteShare('s1')

    expect(res.status).toBe(403)
    expect(prismaMock.reportShare.update).not.toHaveBeenCalled()
  })
})
