import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { recordAuditEvent } from '@/lib/audit'
import {
  MAX_PIN_EXPECTED,
  MAX_PIN_POINT,
  MAX_PIN_SCOPE,
  MAX_PIN_TEST,
  MAX_PIN_TRIGGER,
  MAX_PIN_VALUE,
  canEditDecisions,
  cleanText,
  getDecisionMembership,
  getWorkspaceMembership,
  optionalText,
} from '@/lib/workspaces'

const PIN_SELECT = {
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
} as const

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
        { error: 'Viewers cannot add decision pins' },
        { status: 403 }
      )
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const decisionPoint = cleanText(body.decisionPoint, MAX_PIN_POINT)
    const chosenValue = cleanText(body.chosenValue, MAX_PIN_VALUE)
    const separatingTest = cleanText(body.separatingTest, MAX_PIN_TEST)

    if (!decisionPoint) {
      return NextResponse.json(
        { error: `Decision point is required (max ${MAX_PIN_POINT} characters)` },
        { status: 400 }
      )
    }
    if (!chosenValue) {
      return NextResponse.json(
        { error: `Chosen value is required (max ${MAX_PIN_VALUE} characters)` },
        { status: 400 }
      )
    }
    if (!separatingTest) {
      return NextResponse.json(
        { error: `Separating test is required (max ${MAX_PIN_TEST} characters)` },
        { status: 400 }
      )
    }

    const expectedResult = optionalText(body.expectedResult, MAX_PIN_EXPECTED)
    const codeScope = optionalText(body.codeScope, MAX_PIN_SCOPE)
    const supersessionTrigger = optionalText(body.supersessionTrigger, MAX_PIN_TRIGGER)

    if (body.expectedResult !== undefined && expectedResult === undefined) {
      return NextResponse.json(
        { error: `Expected result must be a string (max ${MAX_PIN_EXPECTED} characters)` },
        { status: 400 }
      )
    }
    if (body.codeScope !== undefined && codeScope === undefined) {
      return NextResponse.json(
        { error: `Code scope must be a string (max ${MAX_PIN_SCOPE} characters)` },
        { status: 400 }
      )
    }
    if (body.supersessionTrigger !== undefined && supersessionTrigger === undefined) {
      return NextResponse.json(
        {
          error: `Supersession trigger must be a string (max ${MAX_PIN_TRIGGER} characters)`,
        },
        { status: 400 }
      )
    }

    let ownerId: string | null = session.user.id
    if (body.ownerId !== undefined) {
      if (body.ownerId === null) {
        ownerId = null
      } else if (typeof body.ownerId === 'string') {
        const ownerMembership = await getWorkspaceMembership(
          membership.workspaceId,
          body.ownerId
        )
        if (!ownerMembership) {
          return NextResponse.json(
            { error: 'Pin owner must be a member of this workspace' },
            { status: 400 }
          )
        }
        ownerId = body.ownerId
      } else {
        return NextResponse.json(
          { error: 'Owner ID must be a string or null' },
          { status: 400 }
        )
      }
    }

    const pin = await prisma.decisionPin.create({
      data: {
        decisionId: id,
        ownerId,
        decisionPoint,
        chosenValue,
        separatingTest,
        expectedResult: expectedResult ?? null,
        codeScope: codeScope ?? null,
        supersessionTrigger: supersessionTrigger ?? null,
      },
      select: PIN_SELECT,
    })

    await recordAuditEvent({
      workspaceId: membership.workspaceId,
      actorId: session.user.id,
      decisionId: id,
      action: 'pin.created',
      entityType: 'DecisionPin',
      entityId: pin.id,
      summary: `Added pin "${pin.decisionPoint}".`,
      metadata: { status: pin.status },
    })

    return NextResponse.json(pin, { status: 201 })
  } catch (error) {
    console.error('Error creating decision pin:', error)
    return NextResponse.json({ error: 'Failed to create decision pin' }, { status: 500 })
  }
}
