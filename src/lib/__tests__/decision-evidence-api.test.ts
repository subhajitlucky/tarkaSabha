import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, authMock } = vi.hoisted(() => ({
  prismaMock: {
    decision: { findUnique: vi.fn(), update: vi.fn() },
    sourceSnapshot: { findFirst: vi.fn() },
    evidence: { create: vi.fn() },
  },
  authMock: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/auth', () => ({ auth: authMock }))

import { POST as addEvidence } from '@/app/api/decisions/[id]/evidence/route'

function postEvidence(decisionId: string, body: unknown) {
  return addEvidence(
    new Request(`http://localhost/api/decisions/${decisionId}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
    { params: Promise.resolve({ id: decisionId }) }
  )
}

const decision = {
  id: 'd1',
  workspaceId: 'w1',
  status: 'DRAFT',
  impact: 'HIGH',
  workspace: { memberships: [{ role: 'REVIEWER' }] },
  evidence: [],
  approvals: [],
}

describe('POST /api/decisions/[id]/evidence — source snapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.decision.findUnique.mockResolvedValue(decision)
    prismaMock.decision.update.mockResolvedValue({ id: 'd1' })
    prismaMock.sourceSnapshot.findFirst.mockResolvedValue({
      id: 'snap1',
      kind: 'FILE',
      path: 'src/middleware.ts',
      sha: 'blob1',
      sha256: 'a'.repeat(64),
      source: { commitSha: 'abc123' },
    })
    prismaMock.evidence.create.mockImplementation(({ data }) => ({
      id: 'e1',
      ...data,
      createdAt: new Date('2026-10-21T12:00:00.000Z'),
      snapshot: {
        id: 'snap1',
        kind: 'FILE',
        path: 'src/middleware.ts',
        sha: 'blob1',
        sha256: 'a'.repeat(64),
        url: 'https://github.com/acme/kestrel/blob/abc123/src/middleware.ts',
      },
    }))
  })

  it('locks source, commit, and hash to an ingested snapshot', async () => {
    const res = await postEvidence('d1', {
      kind: 'CODE',
      source: 'manual/path.ts',
      quote: 'Sessions are validated on every request.',
      snapshotId: 'snap1',
    })

    expect(res.status).toBe(201)
    expect(prismaMock.sourceSnapshot.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'snap1', source: { workspaceId: 'w1' } },
      })
    )
    expect(prismaMock.evidence.create.mock.calls[0][0].data).toMatchObject({
      decisionId: 'd1',
      snapshotId: 'snap1',
      source: 'src/middleware.ts',
      commit: 'abc123',
      sha256: 'a'.repeat(64),
    })
  })

  it('rejects a snapshot outside the workspace', async () => {
    prismaMock.sourceSnapshot.findFirst.mockResolvedValue(null)

    const res = await postEvidence('d1', {
      kind: 'CODE',
      source: 'src/auth/session.ts',
      quote: 'quote',
      snapshotId: 'other-snapshot',
    })

    expect(res.status).toBe(400)
    expect(prismaMock.evidence.create).not.toHaveBeenCalled()
  })

  it('blocks viewers', async () => {
    prismaMock.decision.findUnique.mockResolvedValue({
      ...decision,
      workspace: { memberships: [{ role: 'VIEWER' }] },
    })

    const res = await postEvidence('d1', {
      kind: 'CODE',
      source: 'src/auth/session.ts',
      quote: 'quote',
    })

    expect(res.status).toBe(403)
    expect(prismaMock.evidence.create).not.toHaveBeenCalled()
  })
})
