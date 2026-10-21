import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, authMock } = vi.hoisted(() => ({
  prismaMock: {
    decision: { findUnique: vi.fn() },
    approval: { create: vi.fn() },
    report: { aggregate: vi.fn(), create: vi.fn() },
  },
  authMock: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/auth', () => ({ auth: authMock }))

import { POST as recordApproval } from '@/app/api/decisions/[id]/approvals/route'
import { POST as generateReport } from '@/app/api/decisions/[id]/reports/route'

const baseDecision = {
  id: 'd1',
  workspaceId: 'w1',
  title: 'Proceed with Kestrel',
  summary: 'Context for the decision.',
  status: 'IN_REVIEW',
  impact: 'HIGH',
  ownerId: 'u1',
  createdAt: new Date('2026-10-01T09:00:00.000Z'),
  updatedAt: new Date('2026-10-02T09:00:00.000Z'),
  workspace: { name: 'Project Kestrel', memberships: [{ role: 'REVIEWER' }] },
  owner: { name: 'Asha Rao', email: 'asha@example.com' },
  evidence: [
    {
      id: 'e1',
      kind: 'CODE',
      source: 'src/auth/session.ts:42',
      commit: 'abc123',
      quote: 'Sessions are validated on every request.',
      sha256: 'a'.repeat(64),
      status: 'VERIFIED',
      confidence: 'HIGH',
      createdAt: new Date('2026-10-02T08:00:00.000Z'),
    },
  ],
  approvals: [],
}

function postApproval(decisionId: string, body: unknown) {
  return recordApproval(
    new Request(`http://localhost/api/decisions/${decisionId}/approvals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
    { params: Promise.resolve({ id: decisionId }) }
  )
}

function postReport(decisionId: string) {
  return generateReport(
    new Request(`http://localhost/api/decisions/${decisionId}/reports`, {
      method: 'POST',
    }) as never,
    { params: Promise.resolve({ id: decisionId }) }
  )
}

describe('POST /api/decisions/[id]/approvals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.decision.findUnique.mockResolvedValue(baseDecision)
    prismaMock.approval.create.mockResolvedValue({
      id: 'a1',
      role: 'REVIEWER',
      status: 'APPROVED',
      note: 'Evidence is sufficient.',
      contentHash: 'b'.repeat(64),
      createdAt: new Date('2026-10-03T09:00:00.000Z'),
      decidedAt: new Date('2026-10-03T09:00:00.000Z'),
      actor: { name: 'Reviewer', email: 'reviewer@example.com' },
    })
  })

  it('records an approval with a snapshot hash', async () => {
    const res = await postApproval('d1', {
      status: 'APPROVED',
      note: 'Evidence is sufficient.',
    })

    expect(res.status).toBe(201)
    const data = prismaMock.approval.create.mock.calls[0][0].data
    expect(data).toMatchObject({
      decisionId: 'd1',
      actorId: 'u1',
      role: 'REVIEWER',
      status: 'APPROVED',
      note: 'Evidence is sufficient.',
    })
    expect(data.contentHash).toMatch(/^[a-f0-9]{64}$/)
    expect(data.decidedAt).toBeInstanceOf(Date)
  })

  it('blocks viewers from recording approvals', async () => {
    prismaMock.decision.findUnique.mockResolvedValue({
      ...baseDecision,
      workspace: { name: 'Project Kestrel', memberships: [{ role: 'VIEWER' }] },
    })

    const res = await postApproval('d1', { status: 'APPROVED' })

    expect(res.status).toBe(403)
    expect(prismaMock.approval.create).not.toHaveBeenCalled()
  })

  it('rejects an unknown approval state', async () => {
    const res = await postApproval('d1', { status: 'SIGNED' })

    expect(res.status).toBe(400)
    expect(prismaMock.approval.create).not.toHaveBeenCalled()
  })
})

describe('POST /api/decisions/[id]/reports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.decision.findUnique.mockResolvedValue(baseDecision)
    prismaMock.report.aggregate.mockResolvedValue({ _max: { version: 0 } })
    prismaMock.report.create.mockResolvedValue({
      id: 'r1',
      version: 1,
      status: 'DRAFT',
      content: 'report',
      contentHash: 'c'.repeat(64),
      createdAt: new Date('2026-10-04T09:00:00.000Z'),
      publishedAt: null,
    })
  })

  it('generates the first report from the decision evidence', async () => {
    const res = await postReport('d1')

    expect(res.status).toBe(201)
    const data = prismaMock.report.create.mock.calls[0][0].data
    expect(data.decisionId).toBe('d1')
    expect(data.version).toBe(1)
    expect(data.content).toContain('# Decision Evidence Report — Proceed with Kestrel')
    expect(data.content).toContain('src/auth/session.ts:42')
    expect(data.contentHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('refuses a report without evidence', async () => {
    prismaMock.decision.findUnique.mockResolvedValue({ ...baseDecision, evidence: [] })

    const res = await postReport('d1')

    expect(res.status).toBe(400)
    expect(prismaMock.report.create).not.toHaveBeenCalled()
  })

  it('blocks viewers from generating reports', async () => {
    prismaMock.decision.findUnique.mockResolvedValue({
      ...baseDecision,
      workspace: { name: 'Project Kestrel', memberships: [{ role: 'VIEWER' }] },
    })

    const res = await postReport('d1')

    expect(res.status).toBe(403)
    expect(prismaMock.report.create).not.toHaveBeenCalled()
  })
})
