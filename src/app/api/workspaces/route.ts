import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { recordAuditEvent } from '@/lib/audit'
import {
  MAX_WORKSPACE_DESCRIPTION,
  MAX_WORKSPACE_NAME,
  cleanText,
  optionalText,
} from '@/lib/workspaces'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspaces = await prisma.workspace.findMany({
      where: { memberships: { some: { userId: session.user.id } } },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { decisions: true, memberships: true },
        },
      },
    })

    return NextResponse.json(workspaces)
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const name = cleanText(body.name, MAX_WORKSPACE_NAME)
    if (!name) {
      return NextResponse.json(
        { error: `Workspace name is required (max ${MAX_WORKSPACE_NAME} characters)` },
        { status: 400 }
      )
    }

    const description = optionalText(body.description, MAX_WORKSPACE_DESCRIPTION)
    if (body.description !== undefined && description === undefined) {
      return NextResponse.json(
        {
          error: `Description must be a string (max ${MAX_WORKSPACE_DESCRIPTION} characters)`,
        },
        { status: 400 }
      )
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        description: description ?? null,
        creatorId: session.user.id,
        memberships: {
          create: { userId: session.user.id, role: 'OWNER' },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { decisions: true, memberships: true },
        },
      },
    })

    await recordAuditEvent({
      workspaceId: workspace.id,
      actorId: session.user.id,
      action: 'workspace.created',
      entityType: 'Workspace',
      entityId: workspace.id,
      summary: `Created workspace "${workspace.name}".`,
    })

    return NextResponse.json(workspace, { status: 201 })
  } catch (error) {
    console.error('Error creating workspace:', error)
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
  }
}
