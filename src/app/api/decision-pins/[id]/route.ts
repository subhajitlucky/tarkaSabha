import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import {
  MAX_PIN_EXPECTED,
  MAX_PIN_POINT,
  MAX_PIN_RUN_RESULT,
  MAX_PIN_SCOPE,
  MAX_PIN_TEST,
  MAX_PIN_TRIGGER,
  MAX_PIN_VALUE,
  canEditDecisions,
  cleanText,
  getWorkspaceMembership,
  isPinStatus,
  isWorkspaceRole,
  optionalText,
} from '@/lib/workspaces'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pin = await prisma.decisionPin.findUnique({
      where: { id },
      select: {
        id: true,
        decisionId: true,
        decision: {
          select: {
            workspaceId: true,
            workspace: {
              select: {
                memberships: {
                  where: { userId: session.user.id },
                  select: { role: true },
                },
              },
            },
          },
        },
      },
    })

    const role = pin?.decision.workspace.memberships[0]?.role
    if (!pin || !role || !isWorkspaceRole(role)) {
      return NextResponse.json({ error: 'Decision pin not found' }, { status: 404 })
    }

    if (!canEditDecisions(role)) {
      return NextResponse.json(
        { error: 'Viewers cannot edit decision pins' },
        { status: 403 }
      )
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const data: {
      decisionPoint?: string
      chosenValue?: string
      separatingTest?: string
      expectedResult?: string | null
      codeScope?: string | null
      supersessionTrigger?: string | null
      status?: string
      lastRunAt?: Date | null
      lastRunResult?: string | null
      ownerId?: string | null
    } = {}

    if (body.decisionPoint !== undefined) {
      const value = cleanText(body.decisionPoint, MAX_PIN_POINT)
      if (!value) return NextResponse.json({ error: 'Invalid decision point' }, { status: 400 })
      data.decisionPoint = value
    }
    if (body.chosenValue !== undefined) {
      const value = cleanText(body.chosenValue, MAX_PIN_VALUE)
      if (!value) return NextResponse.json({ error: 'Invalid chosen value' }, { status: 400 })
      data.chosenValue = value
    }
    if (body.separatingTest !== undefined) {
      const value = cleanText(body.separatingTest, MAX_PIN_TEST)
      if (!value) return NextResponse.json({ error: 'Invalid separating test' }, { status: 400 })
      data.separatingTest = value
    }
    if (body.expectedResult !== undefined) {
      const value = optionalText(body.expectedResult, MAX_PIN_EXPECTED)
      if (value === undefined) return NextResponse.json({ error: 'Invalid expected result' }, { status: 400 })
      data.expectedResult = value
    }
    if (body.codeScope !== undefined) {
      const value = optionalText(body.codeScope, MAX_PIN_SCOPE)
      if (value === undefined) return NextResponse.json({ error: 'Invalid code scope' }, { status: 400 })
      data.codeScope = value
    }
    if (body.supersessionTrigger !== undefined) {
      const value = optionalText(body.supersessionTrigger, MAX_PIN_TRIGGER)
      if (value === undefined) return NextResponse.json({ error: 'Invalid supersession trigger' }, { status: 400 })
      data.supersessionTrigger = value
    }
    if (body.status !== undefined) {
      if (!isPinStatus(body.status)) {
        return NextResponse.json({ error: 'Status must be ACTIVE or SUPERSEDED' }, { status: 400 })
      }
      data.status = body.status
    }
    if (body.lastRunResult !== undefined) {
      const value = optionalText(body.lastRunResult, MAX_PIN_RUN_RESULT)
      if (value === undefined) return NextResponse.json({ error: 'Invalid run result' }, { status: 400 })
      data.lastRunResult = value
      data.lastRunAt = value ? new Date() : null
    }
    if (body.ownerId !== undefined) {
      if (body.ownerId === null) {
        data.ownerId = null
      } else if (typeof body.ownerId === 'string') {
        const ownerMembership = await getWorkspaceMembership(
          pin.decision.workspaceId,
          body.ownerId
        )
        if (!ownerMembership) {
          return NextResponse.json(
            { error: 'Pin owner must be a member of this workspace' },
            { status: 400 }
          )
        }
        data.ownerId = body.ownerId
      } else {
        return NextResponse.json({ error: 'Owner ID must be a string or null' }, { status: 400 })
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await prisma.decisionPin.update({
      where: { id },
      data,
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
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating decision pin:', error)
    return NextResponse.json({ error: 'Failed to update decision pin' }, { status: 500 })
  }
}
