import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import {
  DECISION_IMPACTS,
  DECISION_STATUSES,
  MAX_DECISION_SUMMARY,
  MAX_DECISION_TITLE,
  canEditDecisions,
  cleanText,
  getWorkspaceMembership,
  isDecisionImpact,
  isDecisionStatus,
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

    const membership = await getWorkspaceMembership(id, session.user.id)
    if (!membership) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const decisions = await prisma.decision.findMany({
      where: { workspaceId: id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        impact: true,
        updatedAt: true,
        owner: { select: { name: true } },
        _count: { select: { evidence: true, approvals: true } },
      },
    })

    return NextResponse.json(decisions)
  } catch (error) {
    console.error('Error fetching decisions:', error)
    return NextResponse.json({ error: 'Failed to fetch decisions' }, { status: 500 })
  }
}

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

    const membership = await getWorkspaceMembership(id, session.user.id)
    if (!membership) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    if (!canEditDecisions(membership.role)) {
      return NextResponse.json(
        { error: 'Viewers cannot create decisions in this workspace' },
        { status: 403 }
      )
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const title = cleanText(body.title, MAX_DECISION_TITLE)
    if (!title) {
      return NextResponse.json(
        { error: `Decision title is required (max ${MAX_DECISION_TITLE} characters)` },
        { status: 400 }
      )
    }

    const summary = optionalText(body.summary, MAX_DECISION_SUMMARY)
    if (body.summary !== undefined && summary === undefined) {
      return NextResponse.json(
        { error: `Summary must be a string (max ${MAX_DECISION_SUMMARY} characters)` },
        { status: 400 }
      )
    }

    const impact = body.impact === undefined ? 'MEDIUM' : body.impact
    if (!isDecisionImpact(impact)) {
      return NextResponse.json(
        { error: `Impact must be one of: ${DECISION_IMPACTS.join(', ')}` },
        { status: 400 }
      )
    }

    const status = body.status === undefined ? 'DRAFT' : body.status
    if (!isDecisionStatus(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${DECISION_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    let ownerId: string | null = session.user.id
    if (body.ownerId !== undefined) {
      if (body.ownerId === null) {
        ownerId = null
      } else if (typeof body.ownerId === 'string') {
        const ownerMembership = await getWorkspaceMembership(id, body.ownerId)
        if (!ownerMembership) {
          return NextResponse.json(
            { error: 'Owner must be a member of this workspace' },
            { status: 400 }
          )
        }
        ownerId = body.ownerId
      } else {
        return NextResponse.json({ error: 'Owner ID must be a string or null' }, { status: 400 })
      }
    }

    const decision = await prisma.decision.create({
      data: {
        workspaceId: id,
        title,
        summary: summary ?? null,
        impact,
        status,
        createdById: session.user.id,
        ownerId,
      },
      select: {
        id: true,
        title: true,
        summary: true,
        status: true,
        impact: true,
        createdAt: true,
        updatedAt: true,
        owner: { select: { name: true } },
      },
    })

    return NextResponse.json(decision, { status: 201 })
  } catch (error) {
    console.error('Error creating decision:', error)
    return NextResponse.json({ error: 'Failed to create decision' }, { status: 500 })
  }
}
