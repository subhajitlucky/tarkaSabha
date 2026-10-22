import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dossierCanonicalPayload, signDossierExport } from '../dossier-signature'

const { prismaMock, authMock } = vi.hoisted(() => ({
  prismaMock: { workspaceDossier: { findUnique: vi.fn() } },
  authMock: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/auth', () => ({ auth: authMock }))

import { GET as exportDossier } from '@/app/api/dossiers/[id]/export/route'

const dossier = {
  id: 'dos1',
  workspaceId: 'w1',
  version: 2,
  content: '# Decision Diligence Dossier — Kestrel',
  contentHash: 'a'.repeat(64),
  createdAt: new Date('2026-10-22T09:00:00.000Z'),
  workspace: {
    name: 'Project Kestrel',
    memberships: [{ role: 'OWNER' }],
  },
}

function getExport(dossierId: string) {
  return exportDossier(
    new Request(`http://localhost/api/dossiers/${dossierId}/export`) as never,
    { params: Promise.resolve({ id: dossierId }) }
  )
}

describe('GET /api/dossiers/[id]/export', () => {
  const originalKey = process.env.EXPORT_SIGNING_KEY

  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.workspaceDossier.findUnique.mockResolvedValue(dossier)
    process.env.EXPORT_SIGNING_KEY = 'test-export-key'
  })

  afterEach(() => {
    if (originalKey === undefined) delete process.env.EXPORT_SIGNING_KEY
    else process.env.EXPORT_SIGNING_KEY = originalKey
  })

  it('returns a signed JSON bundle with a verifiable signature', async () => {
    const res = await getExport('dos1')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.schema).toBe('tarka-dossier-export/v1')
    expect(body.dossier).toMatchObject({
      id: 'dos1',
      workspaceId: 'w1',
      version: 2,
      contentHash: 'a'.repeat(64),
    })
    expect(body.content).toContain('Decision Diligence Dossier')

    const expected = signDossierExport(
      {
        id: 'dos1',
        workspaceId: 'w1',
        workspaceName: 'Project Kestrel',
        version: 2,
        contentHash: 'a'.repeat(64),
        createdAt: dossier.createdAt.toISOString(),
        content: dossier.content,
      },
      'test-export-key'
    )
    expect(body.signature).toEqual(expected)
    expect(dossierCanonicalPayload({
      id: 'dos1',
      workspaceId: 'w1',
      workspaceName: 'Project Kestrel',
      version: 2,
      contentHash: 'a'.repeat(64),
      createdAt: dossier.createdAt.toISOString(),
      content: dossier.content,
    })).toContain('Project Kestrel')
  })

  it('fails closed when no signing key is configured', async () => {
    delete process.env.EXPORT_SIGNING_KEY

    const res = await getExport('dos1')

    expect(res.status).toBe(503)
  })

  it('returns 404 when the caller is not a member', async () => {
    prismaMock.workspaceDossier.findUnique.mockResolvedValue({
      ...dossier,
      workspace: { name: 'Project Kestrel', memberships: [] },
    })

    const res = await getExport('dos1')

    expect(res.status).toBe(404)
  })
})
