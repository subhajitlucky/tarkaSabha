import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { recordAuditEvent } from '@/lib/audit'
import { sha256 } from '@/lib/decision-report'
import { recalculateDecisionDebt } from '@/lib/decision-debt-server'
import {
  APPROVAL_STATUSES,
  MAX_APPROVAL_NOTE,
  approvalRoleForWorkspaceRole,
  canEditDecisions,
  getDecisionMembership,
  isApprovalStatus,
  optionalText,
} from '@/lib/workspaces'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membership = await getDecisionMembership(id, session.user.id)
    if (!membership) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 })
    }

    if (!canEditDecisions(membership.role)) {
      return NextResponse.json(
        { error: 'Viewers cannot record approvals for this decision' },
        { status: 403 }
      )
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!isApprovalStatus(body.status)) {
      return NextResponse.json(
        { error: `Approval status must be one of: ${APPROVAL_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const note = optionalText(body.note, MAX_APPROVAL_NOTE)
    if (body.note !== undefined && note === undefined) {
      return NextResponse.json(
        { error: `Note must be a string (max ${MAX_APPROVAL_NOTE} characters)` },
        { status: 400 }
      )
    }

    const decision = await prisma.decision.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        summary: true,
        status: true,
        impact: true,
        ownerId: true,
        updatedAt: true,
        evidence: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            kind: true,
            source: true,
            commit: true,
            quote: true,
            sha256: true,
            status: true,
            confidence: true,
            createdAt: true,
          },
        },
        approvals: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            actorId: true,
            role: true,
            status: true,
            note: true,
            contentHash: true,
            createdAt: true,
            decidedAt: true,
          },
        },
      },
    })

    if (!decision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 })
    }

    const role = approvalRoleForWorkspaceRole(membership.role)
    const decidedAt = body.status === 'PENDING' ? null : new Date()

    const contentHash = sha256(
      JSON.stringify({
        decision: {
          id: decision.id,
          title: decision.title,
          summary: decision.summary,
          status: decision.status,
          impact: decision.impact,
          ownerId: decision.ownerId,
          updatedAt: decision.updatedAt.toISOString(),
        },
        evidence: decision.evidence.map((item) => ({
          id: item.id,
          kind: item.kind,
          source: item.source,
          commit: item.commit,
          quote: item.quote,
          sha256: item.sha256,
          status: item.status,
          confidence: item.confidence,
          createdAt: item.createdAt.toISOString(),
        })),
        priorApprovals: decision.approvals.map((approval) => ({
          id: approval.id,
          actorId: approval.actorId,
          role: approval.role,
          status: approval.status,
          note: approval.note,
          contentHash: approval.contentHash,
          createdAt: approval.createdAt.toISOString(),
          decidedAt: approval.decidedAt?.toISOString() ?? null,
        })),
        actorId: session.user.id,
        role,
        status: body.status,
        note: note ?? null,
        decidedAt: decidedAt?.toISOString() ?? null,
      })
    )

    const approval = await prisma.approval.create({
      data: {
        decisionId: id,
        actorId: session.user.id,
        role,
        status: body.status,
        note: note ?? null,
        contentHash,
        decidedAt,
      },
      select: {
        id: true,
        role: true,
        status: true,
        note: true,
        contentHash: true,
        createdAt: true,
        decidedAt: true,
        actor: { select: { name: true, email: true } },
      },
    })

    const debt = await recalculateDecisionDebt(id)

    await recordAuditEvent({
      workspaceId: membership.workspaceId,
      actorId: session.user.id,
      decisionId: id,
      action: 'approval.recorded',
      entityType: 'Approval',
      entityId: approval.id,
      summary: `Recorded ${body.status} approval.`,
      metadata: { role, status: body.status },
    })

    return NextResponse.json(
      {
        ...approval,
        debtScore: debt?.score ?? null,
        debtRationale: debt?.rationale ?? null,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error recording approval:', error)
    return NextResponse.json({ error: 'Failed to record approval' }, { status: 500 })
  }
}
