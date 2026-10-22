import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { buildWorkspaceInsights } from '@/lib/workspace-insights'
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

    const [decisions, sources] = await Promise.all([
      prisma.decision.findMany({
        where: { workspaceId: id },
        select: {
          id: true,
          title: true,
          status: true,
          impact: true,
          debtScore: true,
          outcome: true,
          revisitAt: true,
          evidence: { select: { status: true } },
          approvals: { select: { status: true } },
        },
      }),
      prisma.workspaceSource.findMany({
        where: { workspaceId: id },
        select: {
          fileCount: true,
          commitCount: true,
          pullRequestCount: true,
          issueCount: true,
        },
      }),
    ])

    return NextResponse.json(
      buildWorkspaceInsights({
        decisions,
        sources,
        now: new Date(),
      })
    )
  } catch (error) {
    console.error('Error building workspace insights:', error)
    return NextResponse.json({ error: 'Failed to build insights' }, { status: 500 })
  }
}
