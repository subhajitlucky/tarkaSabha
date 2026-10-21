import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, authMock } = vi.hoisted(() => ({
  prismaMock: {
    membership: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    user: { findFirst: vi.fn() },
  },
  authMock: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/auth', () => ({ auth: authMock }))

import { POST as inviteMember } from '@/app/api/workspaces/[id]/members/route'
import {
  DELETE as removeMember,
  PUT as updateMember,
} from '@/app/api/workspaces/[id]/members/[memberId]/route'

function postMember(workspaceId: string, body: unknown) {
  return inviteMember(
    new Request(`http://localhost/api/workspaces/${workspaceId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
    { params: Promise.resolve({ id: workspaceId }) }
  )
}

function putMember(workspaceId: string, memberId: string, body: unknown) {
  return updateMember(
    new Request(`http://localhost/api/workspaces/${workspaceId}/members/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
    { params: Promise.resolve({ id: workspaceId, memberId }) }
  )
}

function deleteMember(workspaceId: string, memberId: string) {
  return removeMember(
    new Request(`http://localhost/api/workspaces/${workspaceId}/members/${memberId}`, {
      method: 'DELETE',
    }) as never,
    { params: Promise.resolve({ id: workspaceId, memberId }) }
  )
}

describe('POST /api/workspaces/[id]/members', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.membership.findUnique
      .mockResolvedValueOnce({ role: 'OWNER', workspaceId: 'w1' })
      .mockResolvedValueOnce(null)
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'u2',
      name: 'Reviewer',
      email: 'reviewer@example.com',
    })
    prismaMock.membership.create.mockResolvedValue({
      id: 'm2',
      role: 'REVIEWER',
      user: { name: 'Reviewer', email: 'reviewer@example.com' },
    })
  })

  it('invites an existing account as a reviewer', async () => {
    const res = await postMember('w1', {
      email: 'reviewer@example.com',
      role: 'REVIEWER',
    })

    expect(res.status).toBe(201)
    expect(prismaMock.membership.create.mock.calls[0][0].data).toMatchObject({
      workspaceId: 'w1',
      userId: 'u2',
      role: 'REVIEWER',
    })
  })

  it('returns 404 when no account uses the email', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null)

    const res = await postMember('w1', { email: 'missing@example.com' })

    expect(res.status).toBe(404)
    expect(prismaMock.membership.create).not.toHaveBeenCalled()
  })

  it('returns 409 when the person is already a member', async () => {
    prismaMock.membership.findUnique
      .mockReset()
      .mockResolvedValueOnce({ role: 'OWNER', workspaceId: 'w1' })
      .mockResolvedValueOnce({ id: 'm2' })

    const res = await postMember('w1', { email: 'reviewer@example.com' })

    expect(res.status).toBe(409)
    expect(prismaMock.membership.create).not.toHaveBeenCalled()
  })

  it('does not let an admin grant the owner role', async () => {
    prismaMock.membership.findUnique.mockReset().mockResolvedValue({ role: 'ADMIN' })

    const res = await postMember('w1', {
      email: 'reviewer@example.com',
      role: 'OWNER',
    })

    expect(res.status).toBe(403)
    expect(prismaMock.membership.create).not.toHaveBeenCalled()
  })
})

describe('PUT /api/workspaces/[id]/members/[memberId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.membership.findUnique.mockResolvedValue({ role: 'OWNER', workspaceId: 'w1' })
    prismaMock.membership.findFirst.mockResolvedValue({
      id: 'm2',
      userId: 'u2',
      role: 'REVIEWER',
    })
    prismaMock.membership.count.mockResolvedValue(1)
    prismaMock.membership.update.mockResolvedValue({
      id: 'm2',
      role: 'ADMIN',
      user: { name: 'Reviewer', email: 'reviewer@example.com' },
    })
  })

  it('lets an owner promote a reviewer to admin', async () => {
    const res = await putMember('w1', 'm2', { role: 'ADMIN' })

    expect(res.status).toBe(200)
    expect(prismaMock.membership.update.mock.calls[0][0]).toMatchObject({
      where: { id: 'm2' },
      data: { role: 'ADMIN' },
    })
  })

  it('refuses to demote the last owner', async () => {
    prismaMock.membership.findFirst.mockResolvedValue({
      id: 'm1',
      userId: 'u1',
      role: 'OWNER',
    })

    const res = await putMember('w1', 'm1', { role: 'ADMIN' })

    expect(res.status).toBe(400)
    expect(prismaMock.membership.update).not.toHaveBeenCalled()
  })

  it('refuses an admin changing an owner', async () => {
    prismaMock.membership.findUnique.mockResolvedValue({ role: 'ADMIN', workspaceId: 'w1' })
    prismaMock.membership.findFirst.mockResolvedValue({
      id: 'm1',
      userId: 'u1',
      role: 'OWNER',
    })

    const res = await putMember('w1', 'm1', { role: 'ADMIN' })

    expect(res.status).toBe(403)
    expect(prismaMock.membership.update).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/workspaces/[id]/members/[memberId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.membership.findUnique.mockResolvedValue({ role: 'OWNER', workspaceId: 'w1' })
    prismaMock.membership.findFirst.mockResolvedValue({
      id: 'm2',
      userId: 'u2',
      role: 'REVIEWER',
    })
    prismaMock.membership.delete.mockResolvedValue({ id: 'm2' })
  })

  it('lets an owner remove a reviewer', async () => {
    const res = await deleteMember('w1', 'm2')

    expect(res.status).toBe(200)
    expect(prismaMock.membership.delete).toHaveBeenCalledWith({ where: { id: 'm2' } })
  })

  it('refuses to remove the last owner', async () => {
    prismaMock.membership.findFirst.mockResolvedValue({
      id: 'm1',
      userId: 'u1',
      role: 'OWNER',
    })
    prismaMock.membership.count.mockResolvedValue(1)

    const res = await deleteMember('w1', 'm1')

    expect(res.status).toBe(400)
    expect(prismaMock.membership.delete).not.toHaveBeenCalled()
  })
})
