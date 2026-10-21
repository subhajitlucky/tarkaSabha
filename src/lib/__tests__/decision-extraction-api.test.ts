import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, authMock, llmMock } = vi.hoisted(() => ({
  prismaMock: {
    membership: { findUnique: vi.fn() },
    workspaceSource: { findFirst: vi.fn() },
    decisionCandidate: { count: vi.fn(), create: vi.fn() },
    provider: { findFirst: vi.fn() },
  },
  authMock: vi.fn(),
  llmMock: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/auth', () => ({ auth: authMock }))
vi.mock('@/lib/llm-provider', () => ({ getLLMResponse: llmMock }))

import { POST as extractCandidates } from '@/app/api/workspaces/[id]/sources/[sourceId]/extract/route'

function postExtract(workspaceId: string, sourceId: string) {
  return extractCandidates(
    new Request(
      `http://localhost/api/workspaces/${workspaceId}/sources/${sourceId}/extract`,
      { method: 'POST' }
    ) as never,
    { params: Promise.resolve({ id: workspaceId, sourceId }) }
  )
}

describe('POST /api/workspaces/[id]/sources/[sourceId]/extract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.membership.findUnique.mockResolvedValue({ role: 'OWNER', workspaceId: 'w1' })
    prismaMock.workspaceSource.findFirst.mockResolvedValue({
      id: 'src1',
      owner: 'acme',
      name: 'kestrel',
      ref: 'main',
      snapshots: [
        {
          id: 'snap-file',
          kind: 'FILE',
          path: 'src/auth/session.ts',
          title: 'session.ts',
          content: 'Sessions are validated on every request.',
          sha: 'blob1',
        },
        {
          id: 'snap-commit',
          kind: 'COMMIT',
          path: 'abc123',
          title: 'Validate sessions in middleware',
          content: 'Move session validation into middleware.',
          sha: 'abc123',
        },
      ],
    })
    prismaMock.decisionCandidate.count.mockResolvedValue(0)
    prismaMock.provider.findFirst.mockResolvedValue({
      apiKey: 'encrypted',
      provider: 'openai',
      model: 'gpt-4o-mini',
      apiUrl: 'https://api.openai.com/v1',
    })
    llmMock.mockResolvedValue({
      content: JSON.stringify({
        candidates: [
          {
            title: 'Validate sessions on every request',
            context: 'Sessions are bearer credentials.',
            proposal: 'Session validation happens in middleware.',
            rationale: 'The guided evidence shows it.',
            confidence: 'HIGH',
            evidence: [
              {
                snapshotId: 'snap-file',
                quote: 'Sessions are validated on every request.',
              },
            ],
          },
        ],
      }),
    })
    prismaMock.decisionCandidate.create.mockImplementation(({ data }) => ({
      id: 'c1',
      title: data.title,
      context: data.context,
      proposal: data.proposal,
      rationale: data.rationale,
      confidence: data.confidence,
      status: 'PENDING',
      decisionId: null,
      createdAt: new Date('2026-10-21T12:00:00.000Z'),
      evidence: [],
    }))
  })

  it('creates pending candidates from a validated LLM response', async () => {
    const res = await postExtract('w1', 'src1')
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.candidates).toHaveLength(1)
    const data = prismaMock.decisionCandidate.create.mock.calls[0][0].data
    expect(data).toMatchObject({
      workspaceId: 'w1',
      sourceId: 'src1',
      createdById: 'u1',
      title: 'Validate sessions on every request',
      confidence: 'HIGH',
      evidence: {
        create: [
          {
            snapshotId: 'snap-file',
            quote: 'Sessions are validated on every request.',
          },
        ],
      },
    })
    expect(llmMock).toHaveBeenCalled()
  })

  it('blocks extraction while candidates are pending', async () => {
    prismaMock.decisionCandidate.count.mockResolvedValue(1)

    const res = await postExtract('w1', 'src1')

    expect(res.status).toBe(409)
    expect(llmMock).not.toHaveBeenCalled()
  })

  it('requires a default provider', async () => {
    prismaMock.provider.findFirst.mockResolvedValue(null)

    const res = await postExtract('w1', 'src1')

    expect(res.status).toBe(400)
    expect(llmMock).not.toHaveBeenCalled()
  })

  it('blocks viewers', async () => {
    prismaMock.membership.findUnique.mockResolvedValue({ role: 'VIEWER', workspaceId: 'w1' })

    const res = await postExtract('w1', 'src1')

    expect(res.status).toBe(403)
    expect(llmMock).not.toHaveBeenCalled()
  })

  it('rejects a malformed model response', async () => {
    llmMock.mockResolvedValue({ content: 'not json' })

    const res = await postExtract('w1', 'src1')

    expect(res.status).toBe(502)
    expect(prismaMock.decisionCandidate.create).not.toHaveBeenCalled()
  })
})
