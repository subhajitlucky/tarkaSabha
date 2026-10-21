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

    const snapshots = await prisma.sourceSnapshot.findMany({
      where: { source: { workspaceId: id } },
      orderBy: [{ kind: 'asc' }, { path: 'asc' }],
      take: 200,
      select: {
        id: true,
        kind: true,
        path: true,
        title: true,
        sha: true,
        sha256: true,
        url: true,
        size: true,
        source: {
          select: {
            id: true,
            owner: true,
            name: true,
            ref: true,
            commitSha: true,
          },
        },
      },
    })

    return NextResponse.json(snapshots)
  } catch (error) {
    console.error('Error fetching workspace snapshots:', error)
    return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 })
  }
}
