import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import {
  MAX_WORKSPACE_DESCRIPTION,
  MAX_WORKSPACE_NAME,
  canManageWorkspace,
  cleanText,
  getWorkspaceMembership,
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

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            user: { select: { name: true, email: true } },
          },
        },
        dossiers: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            version: true,
            status: true,
            contentHash: true,
            createdAt: true,
          },
        },
        sources: {
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            provider: true,
            repoUrl: true,
            owner: true,
            name: true,
            ref: true,
            commitSha: true,
            status: true,
            error: true,
            fileCount: true,
            commitCount: true,
            pullRequestCount: true,
            issueCount: true,
            updatedAt: true,
          },
        },
        decisions: {
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            title: true,
            summary: true,
            status: true,
            impact: true,
            debtScore: true,
            updatedAt: true,
            owner: { select: { name: true } },
            _count: { select: { evidence: true, approvals: true } },
          },
        },
        _count: { select: { decisions: true } },
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    return NextResponse.json({ ...workspace, role: membership.role })
  } catch (error) {
    console.error('Error fetching workspace:', error)
    return NextResponse.json({ error: 'Failed to fetch workspace' }, { status: 500 })
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

    const membership = await getWorkspaceMembership(id, session.user.id)
    if (!membership) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    if (!canManageWorkspace(membership.role)) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can edit this workspace' },
        { status: 403 }
      )
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const data: { name?: string; description?: string | null } = {}

    if (body.name !== undefined) {
      const name = cleanText(body.name, MAX_WORKSPACE_NAME)
      if (!name) {
        return NextResponse.json(
          { error: `Workspace name is required (max ${MAX_WORKSPACE_NAME} characters)` },
          { status: 400 }
        )
      }
      data.name = name
    }

    if (body.description !== undefined) {
      const description = optionalText(body.description, MAX_WORKSPACE_DESCRIPTION)
      if (description === undefined) {
        return NextResponse.json(
          {
            error: `Description must be a string (max ${MAX_WORKSPACE_DESCRIPTION} characters)`,
          },
          { status: 400 }
        )
      }
      data.description = description
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const workspace = await prisma.workspace.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { decisions: true, memberships: true } },
      },
    })

    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Error updating workspace:', error)
    return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 })
  }
}
