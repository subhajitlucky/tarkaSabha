import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { recordAuditEvent } from '@/lib/audit'
import {
  DEFAULT_INVITE_DAYS,
  MAX_INVITE_DAYS,
  MIN_INVITE_DAYS,
  createInviteToken,
} from '@/lib/invites'
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
        { error: 'Only workspace owners and admins can create invites' },
        { status: 403 }
      )
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const email = isEmail(body.email) ? body.email.trim().toLowerCase() : null
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

    const days = body.expiresInDays === undefined ? DEFAULT_INVITE_DAYS : body.expiresInDays
    if (
      typeof days !== 'number' ||
      !Number.isInteger(days) ||
      days < MIN_INVITE_DAYS ||
      days > MAX_INVITE_DAYS
    ) {
      return NextResponse.json(
        { error: `Invite expiry must be between ${MIN_INVITE_DAYS} and ${MAX_INVITE_DAYS} days` },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    })

    if (existingUser) {
      const existingMembership = await prisma.membership.findUnique({
        where: { workspaceId_userId: { workspaceId: id, userId: existingUser.id } },
        select: { id: true },
      })
      if (existingMembership) {
        return NextResponse.json(
          { error: 'That person is already a member of this workspace' },
          { status: 409 }
        )
      }
    }

    // One active invite per email: replace an earlier link rather than leave
    // multiple live tokens floating around.
    await prisma.workspaceInvite.updateMany({
      where: {
        workspaceId: id,
        email: { equals: email, mode: 'insensitive' },
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { revokedAt: new Date() },
    })

    const { token, tokenHash } = createInviteToken()
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)

    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId: id,
        email,
        role,
        createdById: session.user.id,
        tokenHash,
        expiresAt,
      },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
      },
    })

    await recordAuditEvent({
      workspaceId: id,
      actorId: session.user.id,
      action: 'invite.created',
      entityType: 'WorkspaceInvite',
      entityId: invite.id,
      summary: `Created a ${role.toLowerCase()} invitation.`,
      metadata: { role },
    })

    return NextResponse.json(
      {
        ...invite,
        path: `/invite/${token}`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating workspace invite:', error)
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }
}
