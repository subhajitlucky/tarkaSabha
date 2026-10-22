import type { Prisma } from '@/generated/prisma/client'
import { prisma } from './prisma'

export interface AuditEventInput {
  workspaceId: string
  actorId?: string | null
  decisionId?: string | null
  action: string
  entityType: string
  entityId?: string | null
  summary: string
  metadata?: Prisma.InputJsonValue | null
}

/**
 * Best-effort append-only audit. A logging failure must never roll back the
 * user action that produced it.
 */
export async function recordAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        workspaceId: input.workspaceId,
        actorId: input.actorId ?? null,
        decisionId: input.decisionId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        summary: input.summary,
        metadata: input.metadata ?? undefined,
      },
    })
  } catch (error) {
    console.error('[audit] Failed to record audit event:', error)
  }
}
