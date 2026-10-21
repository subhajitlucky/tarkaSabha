import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import {
  WORKSPACE_ROLES,
  canManageWorkspace,
  getWorkspaceMembership,
  isEmail,
  isWorkspaceRole,
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

    const membership = await getWorkspaceMembership(id, session.user.id)
    if (!membership) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    if (!canManageWorkspace(membership.role)) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can invite members' },
        { status: 403 }
      )
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const email = isEmail(body.email) ? body.email.trim() : null
    if (!email) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 })
    }

    const role = body.role === undefined ? 'REVIEWER' : body.role
    if (!isWorkspaceRole(role)) {
      return NextResponse.json(
        { error: `Role must be one of: ${WORKSPACE_ROLES.join(', ')}` },
        { status: 400 }
      )
    }

    if (role === 'OWNER' && membership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only an owner can grant the owner role' },
        { status: 403 }
      )
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, name: true, email: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'No Tarka account uses that email yet. Ask them to sign in first.' },
        { status: 404 }
      )
    }

    const existing = await prisma.membership.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId: user.id } },
      select: { id: true },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'That person is already a member of this workspace' },
        { status: 409 }
      )
    }

    const created = await prisma.membership.create({
      data: { workspaceId: id, userId: user.id, role },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error inviting workspace member:', error)
    return NextResponse.json({ error: 'Failed to invite member' }, { status: 500 })
  }
}
