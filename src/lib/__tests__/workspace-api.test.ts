import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, authMock } = vi.hoisted(() => ({
  prismaMock: {
    workspace: { create: vi.fn() },
    membership: { findUnique: vi.fn() },
    decision: { create: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    chat: { findUnique: vi.fn() },
  },
  authMock: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/auth', () => ({ auth: authMock }))

import { POST as createWorkspace } from '@/app/api/workspaces/route'
import { POST as createDecision } from '@/app/api/workspaces/[id]/decisions/route'
import { PUT as updateDecision } from '@/app/api/decisions/[id]/route'

function postWorkspace(body: unknown) {
  return createWorkspace(
    new Request('http://localhost/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never
  )
}

function postDecision(workspaceId: string, body: unknown) {
  return createDecision(
    new Request(`http://localhost/api/workspaces/${workspaceId}/decisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
    { params: Promise.resolve({ id: workspaceId }) }
  )
}

function putDecision(decisionId: string, body: unknown) {
  return updateDecision(
    new Request(`http://localhost/api/decisions/${decisionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
    { params: Promise.resolve({ id: decisionId }) }
  )
}

describe('POST /api/workspaces', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.workspace.create.mockResolvedValue({
      id: 'w1',
      name: 'Kestrel',
      description: null,
    })
  })

  it('requires an authenticated user', async () => {
    authMock.mockResolvedValue(null)

    const res = await postWorkspace({ name: 'Kestrel' })

    expect(res.status).toBe(401)
    expect(prismaMock.workspace.create).not.toHaveBeenCalled()
  })

  it('creates the workspace and an OWNER membership for its creator', async () => {
    const res = await postWorkspace({ name: '  Kestrel  ', description: '   ' })

    expect(res.status).toBe(201)
    const data = prismaMock.workspace.create.mock.calls[0][0].data
    expect(data).toMatchObject({
      name: 'Kestrel',
      description: null,
      creatorId: 'u1',
    })
    expect(data.memberships.create).toEqual({ userId: 'u1', role: 'OWNER' })
  })

  it('rejects an empty name', async () => {
    const res = await postWorkspace({ name: '   ' })

    expect(res.status).toBe(400)
    expect(prismaMock.workspace.create).not.toHaveBeenCalled()
  })
})

describe('POST /api/workspaces/[id]/decisions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.decision.create.mockResolvedValue({ id: 'd1', title: 'Proceed' })
  })

  it('returns 404 when the caller is not a member', async () => {
    prismaMock.membership.findUnique.mockResolvedValue(null)

    const res = await postDecision('w1', { title: 'Proceed' })

    expect(res.status).toBe(404)
    expect(prismaMock.decision.create).not.toHaveBeenCalled()
  })

  it('blocks viewers from creating decisions', async () => {
    prismaMock.membership.findUnique.mockResolvedValue({ role: 'VIEWER', workspaceId: 'w1' })

    const res = await postDecision('w1', { title: 'Proceed' })

    expect(res.status).toBe(403)
    expect(prismaMock.decision.create).not.toHaveBeenCalled()
  })

  it('lets a reviewer create a decision with a normalized payload', async () => {
    prismaMock.membership.findUnique.mockResolvedValue({ role: 'REVIEWER', workspaceId: 'w1' })

    const res = await postDecision('w1', {
      title: '  Proceed  ',
      summary: '   ',
      impact: 'HIGH',
    })

    expect(res.status).toBe(201)
    const data = prismaMock.decision.create.mock.calls[0][0].data
    expect(data).toMatchObject({
      workspaceId: 'w1',
      title: 'Proceed',
      summary: null,
      impact: 'HIGH',
      status: 'DRAFT',
      createdById: 'u1',
      ownerId: 'u1',
    })
  })

  it('rejects an unknown impact', async () => {
    prismaMock.membership.findUnique.mockResolvedValue({ role: 'OWNER', workspaceId: 'w1' })

    const res = await postDecision('w1', { title: 'Proceed', impact: 'SEVERE' })

    expect(res.status).toBe(400)
    expect(prismaMock.decision.create).not.toHaveBeenCalled()
  })
})

describe('PUT /api/decisions/[id] — review room attachment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    prismaMock.decision.findUnique.mockResolvedValue({
      id: 'd1',
      workspaceId: 'w1',
      workspace: { memberships: [{ role: 'REVIEWER' }] },
    })
    prismaMock.decision.findFirst.mockResolvedValue(null)
    prismaMock.decision.update.mockResolvedValue({
      id: 'd1',
      reviewRoom: { id: 'c1', title: 'Architecture review' },
    })
  })

  it('attaches a review room the caller created', async () => {
    prismaMock.chat.findUnique.mockResolvedValue({ id: 'c1', creatorId: 'u1' })

    const res = await putDecision('d1', { reviewRoomId: 'c1' })

    expect(res.status).toBe(200)
    expect(prismaMock.decision.update.mock.calls[0][0].data).toMatchObject({
      reviewRoomId: 'c1',
    })
  })

  it('detaches a review room', async () => {
    const res = await putDecision('d1', { reviewRoomId: null })

    expect(res.status).toBe(200)
    expect(prismaMock.decision.update.mock.calls[0][0].data).toMatchObject({
      reviewRoomId: null,
    })
    expect(prismaMock.chat.findUnique).not.toHaveBeenCalled()
  })

  it('refuses a review room created by someone else', async () => {
    prismaMock.chat.findUnique.mockResolvedValue({ id: 'c1', creatorId: 'someone-else' })

    const res = await putDecision('d1', { reviewRoomId: 'c1' })

    expect(res.status).toBe(403)
    expect(prismaMock.decision.update).not.toHaveBeenCalled()
  })

  it('refuses a review room already attached to another decision', async () => {
    prismaMock.chat.findUnique.mockResolvedValue({ id: 'c1', creatorId: 'u1' })
    prismaMock.decision.findFirst.mockResolvedValue({ id: 'd2' })

    const res = await putDecision('d1', { reviewRoomId: 'c1' })

    expect(res.status).toBe(409)
    expect(prismaMock.decision.update).not.toHaveBeenCalled()
  })
})
