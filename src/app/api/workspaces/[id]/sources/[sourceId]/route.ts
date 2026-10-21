import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { getWorkspaceMembership } from '@/lib/workspaces'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
  try {
    const { id, sourceId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membership = await getWorkspaceMembership(id, session.user.id)
    if (!membership) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const source = await prisma.workspaceSource.findFirst({
      where: { id: sourceId, workspaceId: id },
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
        createdAt: true,
        updatedAt: true,
        snapshots: {
          orderBy: [{ kind: 'asc' }, { path: 'asc' }],
          select: {
            id: true,
            kind: true,
            path: true,
            title: true,
            content: true,
            url: true,
            sha: true,
            sha256: true,
            size: true,
            metadata: true,
            retrievedAt: true,
          },
        },
        candidates: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            context: true,
            proposal: true,
            rationale: true,
            confidence: true,
            status: true,
            decisionId: true,
            createdAt: true,
            evidence: {
              select: {
                id: true,
                quote: true,
                snapshot: {
                  select: {
                    id: true,
                    kind: true,
                    path: true,
                    title: true,
                    sha: true,
                    sha256: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    return NextResponse.json({ ...source, role: membership.role })
  } catch (error) {
    console.error('Error fetching source:', error)
    return NextResponse.json({ error: 'Failed to fetch source' }, { status: 500 })
  }
}
