import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sha256 } from '../decision-report'

const { prismaMock, authMock } = vi.hoisted(() => ({
  prismaMock: {
    workspaceDossier: { findUnique: vi.fn() },
    dossierShare: {
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

import {
  GET as listShares,
  POST as createShare,
} from '@/app/api/dossiers/[id]/shares/route'
import { DELETE as revokeShare } from '@/app/api/dossier-shares/[id]/route'

const access = {
  id: 'dos1',
  workspace: { memberships: [{ role: 'OWNER' }] },
}

function postShare(dossierId: string, body: unknown) {
  return createShare(
    new Request(`http://localhost/api/dossiers/${dossierId}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
    { params: Promise.resolve({ id: dossierId }) }
  )
}

function getShares(dossierId: string) {
  return listShares(
    new Request(`http://localhost/api/dossiers/${dossierId}/shares`) as never,
    { params: Promise.resolve({ id: dossierId }) }
  )
}

function deleteShare(shareId: string) {
  return revokeShare(
    new Request(`http://localhost/api/dossier-shares/${shareId}`, {
      method: 'DELETE',
    }) as never,
    { params: Promise.resolve({ id: shareId }) }
  )
}

describe('POST /api/dossiers/[id]/shares', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.workspaceDossier.findUnique.mockResolvedValue(access)
    prismaMock.dossierShare.create.mockResolvedValue({
      id: 'sh1',
      expiresAt: new Date('2026-10-29T12:00:00.000Z'),
      redactSources: true,
      viewCount: 0,
      createdAt: new Date('2026-10-22T12:00:00.000Z'),
    })
  })

  it('creates a hash-only dossier share path', async () => {
    const res = await postShare('dos1', { expiresInDays: 7, redactSources: true })
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.path).toMatch(/^\/share\/dossier\/.+/)
    const token = body.path.split('/').pop()
    const data = prismaMock.dossierShare.create.mock.calls[0][0].data
    expect(data.tokenHash).toBe(sha256(token))
    expect(data.redactSources).toBe(true)
  })

  it('blocks viewers', async () => {
    prismaMock.workspaceDossier.findUnique.mockResolvedValue({
      ...access,
      workspace: { memberships: [{ role: 'VIEWER' }] },
    })

    const res = await postShare('dos1', {})

    expect(res.status).toBe(403)
    expect(prismaMock.dossierShare.create).not.toHaveBeenCalled()
  })

  it('rejects an expiry outside the allowed window', async () => {
    const res = await postShare('dos1', { expiresInDays: 365 })

    expect(res.status).toBe(400)
    expect(prismaMock.dossierShare.create).not.toHaveBeenCalled()
  })
})

describe('GET /api/dossiers/[id]/shares', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.workspaceDossier.findUnique.mockResolvedValue(access)
    prismaMock.dossierShare.findMany.mockResolvedValue([])
  })

  it('lists active shares for an editor', async () => {
    const res = await getShares('dos1')

    expect(res.status).toBe(200)
    expect(prismaMock.dossierShare.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          dossierId: 'dos1',
          revokedAt: null,
        }),
      })
    )
  })
})

describe('DELETE /api/dossier-shares/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.dossierShare.findUnique.mockResolvedValue({
      id: 'sh1',
      revokedAt: null,
      dossier: { workspace: { memberships: [{ role: 'OWNER' }] } },
    })
    prismaMock.dossierShare.update.mockResolvedValue({ id: 'sh1', revokedAt: new Date() })
  })

  it('revokes an active link', async () => {
    const res = await deleteShare('sh1')

    expect(res.status).toBe(200)
    expect(prismaMock.dossierShare.update).toHaveBeenCalledWith({
      where: { id: 'sh1' },
      data: { revokedAt: expect.any(Date) },
    })
  })
})
