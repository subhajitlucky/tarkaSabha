import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, authMock, ingestMock } = vi.hoisted(() => ({
  prismaMock: {
    membership: { findUnique: vi.fn() },
    workspaceSource: { create: vi.fn() },
  },
  authMock: vi.fn(),
  ingestMock: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/auth', () => ({ auth: authMock }))
vi.mock('@/lib/github-ingest', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/github-ingest')>()
  return { ...actual, ingestGitHubRepo: ingestMock }
})

import { POST as ingestSource } from '@/app/api/workspaces/[id]/sources/route'

function postSource(workspaceId: string, body: unknown) {
  return ingestSource(
    new Request(`http://localhost/api/workspaces/${workspaceId}/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
    { params: Promise.resolve({ id: workspaceId }) }
  )
}

describe('POST /api/workspaces/[id]/sources', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.membership.findUnique.mockResolvedValue({ role: 'OWNER', workspaceId: 'w1' })
    prismaMock.workspaceSource.create.mockImplementation(({ data }) => ({
      id: 's1',
      provider: data.provider,
      repoUrl: data.repoUrl,
      owner: data.owner,
      name: data.name,
      ref: data.ref,
      commitSha: data.commitSha,
      status: data.status,
      fileCount: data.fileCount,
      commitCount: data.commitCount,
      pullRequestCount: data.pullRequestCount,
      issueCount: data.issueCount,
    }))
    ingestMock.mockResolvedValue({
      repoUrl: 'https://github.com/acme/kestrel',
      owner: 'acme',
      name: 'kestrel',
      ref: 'main',
      commitSha: 'abc123',
      defaultBranch: 'main',
      snapshots: [
        {
          kind: 'FILE',
          path: 'README.md',
          title: 'README.md',
          content: '# Kestrel',
          url: 'https://github.com/acme/kestrel/blob/abc123/README.md',
          sha: 'blob1',
          sha256: 'a'.repeat(64),
          size: 9,
        },
        {
          kind: 'COMMIT',
          path: 'abc123',
          title: 'Initial commit',
          content: 'Initial commit',
          url: 'https://github.com/acme/kestrel/commit/abc123',
          sha: 'abc123',
          metadata: { author: 'Asha', date: '2026-10-01T00:00:00Z' },
        },
      ],
      counts: { files: 1, commits: 1, pullRequests: 0, issues: 0 },
    })
  })

  it('ingests a public repository and stores snapshot rows', async () => {
    const res = await postSource('w1', { url: 'https://github.com/acme/kestrel' })

    expect(res.status).toBe(201)
    expect(ingestMock).toHaveBeenCalledWith({ owner: 'acme', repo: 'kestrel', ref: undefined })
    const data = prismaMock.workspaceSource.create.mock.calls[0][0].data
    expect(data).toMatchObject({
      workspaceId: 'w1',
      createdById: 'u1',
      owner: 'acme',
      name: 'kestrel',
      ref: 'main',
      fileCount: 1,
      commitCount: 1,
    })
    expect(data.snapshots.create).toHaveLength(2)
  })

  it('rejects an invalid repository URL', async () => {
    const res = await postSource('w1', { url: 'https://gitlab.com/acme/kestrel' })

    expect(res.status).toBe(400)
    expect(ingestMock).not.toHaveBeenCalled()
  })

  it('blocks viewers from ingesting', async () => {
    prismaMock.membership.findUnique.mockResolvedValue({ role: 'VIEWER', workspaceId: 'w1' })

    const res = await postSource('w1', { url: 'https://github.com/acme/kestrel' })

    expect(res.status).toBe(403)
    expect(ingestMock).not.toHaveBeenCalled()
  })

  it('surfaces a GitHub rate-limit failure', async () => {
    ingestMock.mockRejectedValue(
      new Error('GitHub API rate limit reached. Try again later or configure GITHUB_TOKEN.')
    )

    const res = await postSource('w1', { url: 'https://github.com/acme/kestrel' })
    const body = await res.json()

    expect(res.status).toBe(502)
    expect(body.error).toContain('rate limit')
  })
})
