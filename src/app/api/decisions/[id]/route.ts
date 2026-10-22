import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { recordAuditEvent } from '@/lib/audit'
import { recalculateDecisionDebt } from '@/lib/decision-debt-server'
import {
  DECISION_IMPACTS,
  DECISION_STATUSES,
  MAX_DECISION_SUMMARY,
  MAX_DECISION_TITLE,
  MAX_OUTCOME_SUMMARY,
  OUTCOME_STATUSES,
  canEditDecisions,
  cleanText,
  getDecisionMembership,
  getWorkspaceMembership,
  isDecisionImpact,
  isDecisionStatus,
  isOutcomeStatus,
  optionalText,
} from '@/lib/workspaces'

export async function GET(
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

    const decision = await prisma.decision.findUnique({
      where: { id },
      select: {
        id: true,
        workspaceId: true,
        title: true,
        summary: true,
        status: true,
        impact: true,
        debtScore: true,
        debtRationale: true,
        scoredAt: true,
        revisitAt: true,
        outcome: true,
        outcomeSummary: true,
        outcomeAt: true,
        createdAt: true,
        updatedAt: true,
        workspace: { select: { id: true, name: true } },
        reviewRoom: { select: { id: true, title: true } },
        owner: { select: { name: true, email: true } },
        createdBy: { select: { name: true, email: true } },
        evidence: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            snapshotId: true,
            kind: true,
            source: true,
            commit: true,
            quote: true,
            sha256: true,
            status: true,
            confidence: true,
            createdAt: true,
            snapshot: {
              select: { id: true, kind: true, path: true, sha: true, sha256: true, url: true },
            },
          },
        },
        approvals: {
          orderBy: { createdAt: 'desc' },
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
        },
        reports: {
          orderBy: { version: 'desc' },
          select: {
            id: true,
            version: true,
            status: true,
            content: true,
            contentHash: true,
            createdAt: true,
            publishedAt: true,
          },
        },
        pins: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            ownerId: true,
            decisionPoint: true,
            chosenValue: true,
            separatingTest: true,
            expectedResult: true,
            codeScope: true,
            status: true,
            lastRunAt: true,
            lastRunResult: true,
            supersessionTrigger: true,
            createdAt: true,
            updatedAt: true,
            owner: { select: { name: true, email: true } },
          },
        },
      },
    })

    if (!decision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 })
    }

    return NextResponse.json({ ...decision, role: membership.role })
  } catch (error) {
    console.error('Error fetching decision:', error)
    return NextResponse.json({ error: 'Failed to fetch decision' }, { status: 500 })
  }
}

export async function PUT(
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
        { error: 'Viewers cannot edit decisions in this workspace' },
        { status: 403 }
      )
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const data: {
      title?: string
      summary?: string | null
      status?: string
      impact?: string
      ownerId?: string | null
      reviewRoomId?: string | null
      revisitAt?: Date | null
      outcome?: string | null
      outcomeSummary?: string | null
      outcomeAt?: Date | null
    } = {}

    if (body.title !== undefined) {
      const title = cleanText(body.title, MAX_DECISION_TITLE)
      if (!title) {
        return NextResponse.json(
          { error: `Decision title is required (max ${MAX_DECISION_TITLE} characters)` },
          { status: 400 }
        )
      }
      data.title = title
    }

    if (body.summary !== undefined) {
      const summary = optionalText(body.summary, MAX_DECISION_SUMMARY)
      if (summary === undefined) {
        return NextResponse.json(
          { error: `Summary must be a string (max ${MAX_DECISION_SUMMARY} characters)` },
          { status: 400 }
        )
      }
      data.summary = summary
    }

    if (body.status !== undefined) {
      if (!isDecisionStatus(body.status)) {
        return NextResponse.json(
          { error: `Status must be one of: ${DECISION_STATUSES.join(', ')}` },
          { status: 400 }
        )
      }
      data.status = body.status
    }

    if (body.impact !== undefined) {
      if (!isDecisionImpact(body.impact)) {
        return NextResponse.json(
          { error: `Impact must be one of: ${DECISION_IMPACTS.join(', ')}` },
          { status: 400 }
        )
      }
      data.impact = body.impact
    }

    if (body.revisitAt !== undefined) {
      if (body.revisitAt === null || body.revisitAt === '') {
        data.revisitAt = null
      } else if (typeof body.revisitAt === 'string') {
        const date = new Date(body.revisitAt)
        if (Number.isNaN(date.getTime())) {
          return NextResponse.json({ error: 'Revisit date is invalid' }, { status: 400 })
        }
        data.revisitAt = date
      } else {
        return NextResponse.json(
          { error: 'Revisit date must be an ISO date string or null' },
          { status: 400 }
        )
      }
    }

    if (body.outcome !== undefined) {
      if (body.outcome === null) {
        data.outcome = null
        data.outcomeAt = null
      } else if (isOutcomeStatus(body.outcome)) {
        data.outcome = body.outcome
        data.outcomeAt = body.outcome === 'PENDING' ? null : new Date()
      } else {
        return NextResponse.json(
          { error: `Outcome must be one of: ${OUTCOME_STATUSES.join(', ')}` },
          { status: 400 }
        )
      }
    }

    if (body.outcomeSummary !== undefined) {
      const summary = optionalText(body.outcomeSummary, MAX_OUTCOME_SUMMARY)
      if (summary === undefined) {
        return NextResponse.json(
          {
            error: `Outcome summary must be a string (max ${MAX_OUTCOME_SUMMARY} characters)`,
          },
          { status: 400 }
        )
      }
      data.outcomeSummary = summary
    }

    if (body.ownerId !== undefined) {
      if (body.ownerId === null) {
        data.ownerId = null
      } else if (typeof body.ownerId === 'string') {
        const ownerMembership = await getWorkspaceMembership(membership.workspaceId, body.ownerId)
        if (!ownerMembership) {
          return NextResponse.json(
            { error: 'Owner must be a member of this workspace' },
            { status: 400 }
          )
        }
        data.ownerId = body.ownerId
      } else {
        return NextResponse.json({ error: 'Owner ID must be a string or null' }, { status: 400 })
      }
    }

    if (body.reviewRoomId !== undefined) {
      if (body.reviewRoomId === null) {
        data.reviewRoomId = null
      } else if (typeof body.reviewRoomId === 'string') {
        const reviewRoom = await prisma.chat.findUnique({
          where: { id: body.reviewRoomId },
          select: { id: true, creatorId: true },
        })

        if (!reviewRoom) {
          return NextResponse.json({ error: 'Review room not found' }, { status: 404 })
        }
        if (reviewRoom.creatorId !== session.user.id) {
          return NextResponse.json(
            { error: 'You can only attach a review room you created' },
            { status: 403 }
          )
        }

        const alreadyAttached = await prisma.decision.findFirst({
          where: { reviewRoomId: body.reviewRoomId, NOT: { id } },
          select: { id: true },
        })
        if (alreadyAttached) {
          return NextResponse.json(
            { error: 'That review room is already attached to another decision' },
            { status: 409 }
          )
        }

        data.reviewRoomId = body.reviewRoomId
      } else {
        return NextResponse.json(
          { error: 'Review room ID must be a string or null' },
          { status: 400 }
        )
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const decision = await prisma.decision.update({
      where: { id },
      data,
      select: {
        id: true,
        workspaceId: true,
        title: true,
        summary: true,
        status: true,
        impact: true,
        createdAt: true,
        updatedAt: true,
        debtScore: true,
        debtRationale: true,
        scoredAt: true,
        revisitAt: true,
        outcome: true,
        outcomeSummary: true,
        outcomeAt: true,
        owner: { select: { name: true, email: true } },
        reviewRoom: { select: { id: true, title: true } },
      },
    })

    const debt =
      data.status !== undefined || data.impact !== undefined
        ? await recalculateDecisionDebt(id)
        : null

    await recordAuditEvent({
      workspaceId: membership.workspaceId,
      actorId: session.user.id,
      decisionId: id,
      action: 'decision.updated',
      entityType: 'Decision',
      entityId: id,
      summary: `Updated decision "${decision.title}".`,
      metadata: { fields: Object.keys(data) },
    })

    return NextResponse.json({
      ...decision,
      debtScore: debt?.score ?? decision.debtScore,
      debtRationale: debt?.rationale ?? decision.debtRationale,
      scoredAt: debt ? new Date() : decision.scoredAt,
    })
  } catch (error) {
    console.error('Error updating decision:', error)
    return NextResponse.json({ error: 'Failed to update decision' }, { status: 500 })
  }
}
