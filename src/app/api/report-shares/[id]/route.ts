import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { canEditDecisions, isWorkspaceRole } from '@/lib/workspaces'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const share = await prisma.reportShare.findUnique({
      where: { id },
      select: {
        id: true,
        revokedAt: true,
        report: {
          select: {
            decision: {
              select: {
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
        },
      },
    })

    const role = share?.report.decision.workspace.memberships[0]?.role
    if (!share || !role || !isWorkspaceRole(role)) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 })
    }

    if (!canEditDecisions(role)) {
      return NextResponse.json(
        { error: 'Viewers cannot revoke share links' },
        { status: 403 }
      )
    }

    if (!share.revokedAt) {
      await prisma.reportShare.update({
        where: { id },
        data: { revokedAt: new Date() },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking report share:', error)
    return NextResponse.json({ error: 'Failed to revoke share link' }, { status: 500 })
  }
}
