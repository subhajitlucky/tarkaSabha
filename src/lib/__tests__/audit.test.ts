import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { auditEvent: { create: vi.fn() } },
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

import { recordAuditEvent } from '../audit'

describe('recordAuditEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.auditEvent.create.mockResolvedValue({ id: 'a1' })
  })

  it('writes an append-only event with metadata', async () => {
    await recordAuditEvent({
      workspaceId: 'w1',
      actorId: 'u1',
      decisionId: 'd1',
      action: 'decision.created',
      entityType: 'Decision',
      entityId: 'd1',
      summary: 'Created decision.',
      metadata: { impact: 'HIGH' },
    })

    expect(prismaMock.auditEvent.create).toHaveBeenCalledWith({
      data: {
        workspaceId: 'w1',
        actorId: 'u1',
        decisionId: 'd1',
        action: 'decision.created',
        entityType: 'Decision',
        entityId: 'd1',
        summary: 'Created decision.',
        metadata: { impact: 'HIGH' },
      },
    })
  })

  it('never throws when audit logging fails', async () => {
    prismaMock.auditEvent.create.mockRejectedValue(new Error('database unavailable'))
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(
      recordAuditEvent({
        workspaceId: 'w1',
        action: 'decision.created',
        entityType: 'Decision',
        summary: 'Created decision.',
      })
    ).resolves.toBeUndefined()

    spy.mockRestore()
  })
})
