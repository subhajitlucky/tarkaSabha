import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import {
  WORKSPACE_ROLES,
  canManageWorkspace,
  getWorkspaceMembership,
  isWorkspaceRole,
} from '@/lib/workspaces'

type RouteContext = { params: Promise<{ id: string; memberId: string }> }

type ManagedMembership =
  | { error: NextResponse }
  | {
      workspaceId: string
      membership: { role: 'OWNER' | 'ADMIN' | 'REVIEWER' | 'VIEWER'; workspaceId: string }
      target: { id: string; userId: string; role: string }
    }

async function getManagedMembership(
  context: RouteContext,
  userId: string
): Promise<ManagedMembership> {
  const { id, memberId } = await context.params
  const membership = await getWorkspaceMembership(id, userId)

  if (!membership) {
    return { error: NextResponse.json({ error: 'Workspace not found' }, { status: 404 }) }
  }

  if (!canManageWorkspace(membership.role)) {
    return {
      error: NextResponse.json(
        { error: 'Only workspace owners and admins can manage members' },
        { status: 403 }
      ),
    }
  }

  const target = await prisma.membership.findFirst({
    where: { id: memberId, workspaceId: id },
    select: { id: true, userId: true, role: true },
  })

  if (!target) {
    return { error: NextResponse.json({ error: 'Member not found' }, { status: 404 }) }
  }

  return { workspaceId: id, membership, target }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const managed = await getManagedMembership(context, session.user.id)
    if ('error' in managed) return managed.error

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!isWorkspaceRole(body.role)) {
      return NextResponse.json(
        { error: `Role must be one of: ${WORKSPACE_ROLES.join(', ')}` },
        { status: 400 }
      )
    }

    if (
      (managed.target.role === 'OWNER' || body.role === 'OWNER') &&
      managed.membership.role !== 'OWNER'
    ) {
      return NextResponse.json(
        { error: 'Only an owner can change the owner role' },
        { status: 403 }
      )
    }

    if (managed.target.role === 'OWNER' && body.role !== 'OWNER') {
      const ownerCount = await prisma.membership.count({
        where: { workspaceId: managed.workspaceId, role: 'OWNER' },
      })
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'A workspace needs at least one owner' },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.membership.update({
      where: { id: managed.target.id },
      data: { role: body.role },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating workspace member:', error)
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const managed = await getManagedMembership(context, session.user.id)
    if ('error' in managed) return managed.error

    if (managed.target.role === 'OWNER' && managed.membership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only an owner can remove an owner' },
        { status: 403 }
      )
    }

    if (managed.target.role === 'OWNER') {
      const ownerCount = await prisma.membership.count({
        where: { workspaceId: managed.workspaceId, role: 'OWNER' },
      })
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'A workspace needs at least one owner' },
          { status: 400 }
        )
      }
    }

    await prisma.membership.delete({ where: { id: managed.target.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing workspace member:', error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
