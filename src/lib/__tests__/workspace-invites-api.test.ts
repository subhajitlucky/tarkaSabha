import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sha256 } from '../decision-report'

const { prismaMock, authMock } = vi.hoisted(() => ({
  prismaMock: {
    membership: { findUnique: vi.fn(), upsert: vi.fn() },
    user: { findFirst: vi.fn() },
    workspaceInvite: {
      updateMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  authMock: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/auth', () => ({ auth: authMock }))

import { POST as createInvite } from '@/app/api/workspaces/[id]/invites/route'
import { POST as acceptInvite } from '@/app/api/invites/[token]/accept/route'

function postInvite(workspaceId: string, body: unknown) {
  return createInvite(
    new Request(`http://localhost/api/workspaces/${workspaceId}/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
    { params: Promise.resolve({ id: workspaceId }) }
  )
}

function postAccept(token: string) {
  return acceptInvite(
    new Request(`http://localhost/api/invites/${token}/accept`, {
      method: 'POST',
    }) as never,
    { params: Promise.resolve({ token }) }
  )
}

describe('POST /api/workspaces/[id]/invites', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.membership.findUnique.mockResolvedValue({ role: 'OWNER', workspaceId: 'w1' })
    prismaMock.user.findFirst.mockResolvedValue(null)
    prismaMock.workspaceInvite.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.workspaceInvite.create.mockResolvedValue({
      id: 'i1',
      email: 'new@example.com',
      role: 'REVIEWER',
      expiresAt: new Date('2026-10-28T12:00:00.000Z'),
      createdAt: new Date('2026-10-21T12:00:00.000Z'),
    })
  })

  it('creates a hash-only, one-time invite path', async () => {
    const res = await postInvite('w1', {
      email: '  NEW@example.com ',
      role: 'REVIEWER',
    })
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.path).toMatch(/^\/invite\/.+/)
    const token = body.path.split('/').pop()
    const data = prismaMock.workspaceInvite.create.mock.calls[0][0].data
    expect(data.tokenHash).toBe(sha256(token))
    expect(data.email).toBe('new@example.com')
    expect(data.role).toBe('REVIEWER')
    expect(data.expiresAt).toBeInstanceOf(Date)
  })

  it('revokes existing active invites for the same email', async () => {
    await postInvite('w1', { email: 'new@example.com', role: 'REVIEWER' })

    expect(prismaMock.workspaceInvite.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workspaceId: 'w1',
          acceptedAt: null,
          revokedAt: null,
        }),
        data: { revokedAt: expect.any(Date) },
      })
    )
  })

  it('refuses inviting an existing member', async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: 'u2' })
    prismaMock.membership.findUnique
      .mockReset()
      .mockResolvedValueOnce({ role: 'OWNER', workspaceId: 'w1' })
      .mockResolvedValueOnce({ id: 'm2' })

    const res = await postInvite('w1', { email: 'member@example.com' })

    expect(res.status).toBe(409)
    expect(prismaMock.workspaceInvite.create).not.toHaveBeenCalled()
  })

  it('does not let an admin invite an owner', async () => {
    prismaMock.membership.findUnique.mockResolvedValue({ role: 'ADMIN', workspaceId: 'w1' })

    const res = await postInvite('w1', { email: 'new@example.com', role: 'OWNER' })

    expect(res.status).toBe(403)
    expect(prismaMock.workspaceInvite.create).not.toHaveBeenCalled()
  })
})

describe('POST /api/invites/[token]/accept', () => {
  const activeInvite = {
    id: 'i1',
    workspaceId: 'w1',
    email: 'new@example.com',
    role: 'REVIEWER',
    expiresAt: new Date('2026-10-28T12:00:00.000Z'),
    acceptedAt: null,
    revokedAt: null,
    workspace: { name: 'Project Kestrel' },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u2', email: 'new@example.com' } })
    prismaMock.workspaceInvite.findUnique.mockResolvedValue(activeInvite)
    prismaMock.membership.upsert.mockResolvedValue({ role: 'REVIEWER' })
    prismaMock.workspaceInvite.update.mockResolvedValue({ id: 'i1' })
  })

  it('adds the invited account and marks the link used', async () => {
    const res = await postAccept('invite-token')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toMatchObject({
      workspaceId: 'w1',
      workspaceName: 'Project Kestrel',
      role: 'REVIEWER',
    })
    expect(prismaMock.membership.upsert.mock.calls[0][0]).toMatchObject({
      where: { workspaceId_userId: { workspaceId: 'w1', userId: 'u2' } },
      create: { workspaceId: 'w1', userId: 'u2', role: 'REVIEWER' },
    })
    expect(prismaMock.workspaceInvite.update).toHaveBeenCalledWith({
      where: { id: 'i1' },
      data: {
        acceptedAt: expect.any(Date),
        acceptedById: 'u2',
      },
    })
  })

  it('rejects a signed-in account with a different email', async () => {
    authMock.mockResolvedValue({ user: { id: 'u3', email: 'other@example.com' } })

    const res = await postAccept('invite-token')

    expect(res.status).toBe(403)
    expect(prismaMock.membership.upsert).not.toHaveBeenCalled()
  })

  it('rejects an expired invite', async () => {
    prismaMock.workspaceInvite.findUnique.mockResolvedValue({
      ...activeInvite,
      expiresAt: new Date('2020-01-01T00:00:00.000Z'),
    })

    const res = await postAccept('invite-token')

    expect(res.status).toBe(410)
    expect(prismaMock.membership.upsert).not.toHaveBeenCalled()
  })

  it('rejects an already accepted invite', async () => {
    prismaMock.workspaceInvite.findUnique.mockResolvedValue({
      ...activeInvite,
      acceptedAt: new Date('2026-10-22T12:00:00.000Z'),
    })

    const res = await postAccept('invite-token')

    expect(res.status).toBe(410)
    expect(prismaMock.membership.upsert).not.toHaveBeenCalled()
  })
})
