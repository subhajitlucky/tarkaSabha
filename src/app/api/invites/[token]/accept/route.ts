import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { sha256 } from '@/lib/decision-report'
import { isWorkspaceRole } from '@/lib/workspaces'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const session = await auth()
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invite = await prisma.workspaceInvite.findUnique({
      where: { tokenHash: sha256(token) },
      select: {
        id: true,
        workspaceId: true,
        email: true,
        role: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
        workspace: { select: { name: true } },
      },
    })

    if (!invite) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    if (invite.acceptedAt || invite.revokedAt || invite.expiresAt.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: 'This invitation is no longer available' },
        { status: 410 }
      )
    }

    if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json(
        { error: `This invitation was sent to ${invite.email}` },
        { status: 403 }
      )
    }

    if (!isWorkspaceRole(invite.role)) {
      return NextResponse.json({ error: 'Invitation role is invalid' }, { status: 400 })
    }

    const membership = await prisma.membership.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: invite.workspaceId,
          userId: session.user.id,
        },
      },
      update: {},
      create: {
        workspaceId: invite.workspaceId,
        userId: session.user.id,
        role: invite.role,
      },
      select: { role: true },
    })

    await prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: {
        acceptedAt: new Date(),
        acceptedById: session.user.id,
      },
    })

    return NextResponse.json({
      workspaceId: invite.workspaceId,
      workspaceName: invite.workspace.name,
      role: membership.role,
    })
  } catch (error) {
    console.error('Error accepting workspace invite:', error)
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 })
  }
}
