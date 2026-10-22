import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { getWorkspaceMembership } from '@/lib/workspaces'

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

    const { searchParams } = new URL(request.url)
    const decisionId = searchParams.get('decisionId')
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '100', 10)
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(200, Math.max(1, requestedLimit))
      : 100

    const events = await prisma.auditEvent.findMany({
      where: {
        workspaceId: id,
        ...(decisionId ? { decisionId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        summary: true,
        metadata: true,
        createdAt: true,
        actor: { select: { name: true, email: true } },
        decision: { select: { id: true, title: true } },
      },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching audit events:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}
