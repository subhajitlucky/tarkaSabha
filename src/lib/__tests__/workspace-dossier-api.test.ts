import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, authMock } = vi.hoisted(() => ({
  prismaMock: {
    membership: { findUnique: vi.fn() },
    workspace: { findUnique: vi.fn() },
    workspaceDossier: {
      aggregate: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
  authMock: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/auth', () => ({ auth: authMock }))

import { POST as generateDossier } from '@/app/api/workspaces/[id]/dossiers/route'
import { GET as getDossier } from '@/app/api/dossiers/[id]/route'

function postDossier(workspaceId: string) {
  return generateDossier(
    new Request(`http://localhost/api/workspaces/${workspaceId}/dossiers`, {
      method: 'POST',
    }) as never,
    { params: Promise.resolve({ id: workspaceId }) }
  )
}

function getDossierRequest(dossierId: string, download = false) {
  return getDossier(
    new Request(
      `http://localhost/api/dossiers/${dossierId}${download ? '?download=1' : ''}`
    ) as never,
    { params: Promise.resolve({ id: dossierId }) }
  )
}

const workspace = {
  name: 'Project Kestrel',
  description: 'Acquisition review.',
  decisions: [
    {
      id: 'd1',
      title: 'Validate sessions on every request',
      summary: 'Sessions are bearer credentials.',
      status: 'IN_REVIEW',
      impact: 'HIGH',
      debtScore: 65,
      debtRationale: 'Only one evidence item (+25)',
      updatedAt: new Date('2026-10-21T12:00:00.000Z'),
      owner: { name: 'Asha Rao', email: 'asha@example.com' },
      evidence: [],
      pins: [],
      approvals: [],
    },
  ],
  sources: [],
}

describe('POST /api/workspaces/[id]/dossiers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({
      user: { id: 'u1', name: 'Asha Rao', email: 'asha@example.com' },
    })
    prismaMock.membership.findUnique.mockResolvedValue({ role: 'OWNER', workspaceId: 'w1' })
    prismaMock.workspace.findUnique.mockResolvedValue(workspace)
    prismaMock.workspaceDossier.aggregate.mockResolvedValue({ _max: { version: 0 } })
    prismaMock.workspaceDossier.create.mockResolvedValue({
      id: 'dos1',
      version: 1,
      status: 'DRAFT',
      contentHash: 'a'.repeat(64),
      createdAt: new Date('2026-10-22T09:00:00.000Z'),
    })
  })

  it('generates a versioned dossier from the workspace', async () => {
    const res = await postDossier('w1')
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.path).toBe('/workspaces/w1/dossiers/dos1')
    const data = prismaMock.workspaceDossier.create.mock.calls[0][0].data
    expect(data).toMatchObject({ workspaceId: 'w1', version: 1 })
    expect(data.content).toContain('# Decision Diligence Dossier — Project Kestrel')
    expect(data.contentHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('requires at least one decision', async () => {
    prismaMock.workspace.findUnique.mockResolvedValue({ ...workspace, decisions: [] })

    const res = await postDossier('w1')

    expect(res.status).toBe(400)
    expect(prismaMock.workspaceDossier.create).not.toHaveBeenCalled()
  })

  it('blocks viewers', async () => {
    prismaMock.membership.findUnique.mockResolvedValue({ role: 'VIEWER', workspaceId: 'w1' })

    const res = await postDossier('w1')

    expect(res.status).toBe(403)
    expect(prismaMock.workspaceDossier.create).not.toHaveBeenCalled()
  })
})

describe('GET /api/dossiers/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.workspaceDossier.findUnique.mockResolvedValue({
      id: 'dos1',
      workspaceId: 'w1',
      version: 1,
      status: 'DRAFT',
      content: '# Decision Diligence Dossier — Kestrel',
      contentHash: 'a'.repeat(64),
      createdAt: new Date('2026-10-22T09:00:00.000Z'),
      publishedAt: null,
      createdBy: { name: 'Asha Rao', email: 'asha@example.com' },
      workspace: { name: 'Project Kestrel', memberships: [{ role: 'OWNER' }] },
    })
  })

  it('returns the dossier JSON to a member', async () => {
    const res = await getDossierRequest('dos1')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toMatchObject({
      workspaceId: 'w1',
      version: 1,
      role: 'OWNER',
    })
  })

  it('downloads the dossier as Markdown', async () => {
    const res = await getDossierRequest('dos1', true)

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/markdown')
    expect(await res.text()).toContain('Decision Diligence Dossier')
  })
})
