import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { sha256 } from '@/lib/decision-report'
import { buildWorkspaceDossier } from '@/lib/workspace-dossier'
import { canEditDecisions, getWorkspaceMembership } from '@/lib/workspaces'

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

    if (!canEditDecisions(membership.role)) {
      return NextResponse.json(
        { error: 'Viewers cannot generate a dossier' },
        { status: 403 }
      )
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: {
        name: true,
        description: true,
        decisions: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            title: true,
            summary: true,
            status: true,
            impact: true,
            debtScore: true,
            debtRationale: true,
            updatedAt: true,
            owner: { select: { name: true, email: true } },
            evidence: {
              orderBy: { createdAt: 'asc' },
              select: {
                kind: true,
                source: true,
                commit: true,
                quote: true,
                sha256: true,
                status: true,
                confidence: true,
              },
            },
            pins: {
              orderBy: { createdAt: 'asc' },
              select: {
                decisionPoint: true,
                chosenValue: true,
                separatingTest: true,
                expectedResult: true,
                codeScope: true,
                status: true,
                lastRunResult: true,
                supersessionTrigger: true,
              },
            },
            approvals: {
              orderBy: { createdAt: 'asc' },
              select: {
                role: true,
                status: true,
                note: true,
                createdAt: true,
                decidedAt: true,
                actor: { select: { name: true, email: true } },
              },
            },
          },
        },
        sources: {
          orderBy: { updatedAt: 'desc' },
          select: {
            owner: true,
            name: true,
            ref: true,
            commitSha: true,
            fileCount: true,
            commitCount: true,
            pullRequestCount: true,
            issueCount: true,
          },
        },
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    if (workspace.decisions.length === 0) {
      return NextResponse.json(
        { error: 'Add at least one decision before generating a dossier' },
        { status: 400 }
      )
    }

    const content = buildWorkspaceDossier({
      workspace,
      decisions: workspace.decisions,
      sources: workspace.sources,
      generatedBy: session.user.name || session.user.email || null,
    })

    const latest = await prisma.workspaceDossier.aggregate({
      where: { workspaceId: id },
      _max: { version: true },
    })
    const version = (latest._max.version ?? 0) + 1

    const dossier = await prisma.workspaceDossier.create({
      data: {
        workspaceId: id,
        createdById: session.user.id,
        version,
        content,
        contentHash: sha256(content),
      },
      select: {
        id: true,
        version: true,
        status: true,
        contentHash: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        ...dossier,
        path: `/workspaces/${id}/dossiers/${dossier.id}`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error generating workspace dossier:', error)
    return NextResponse.json({ error: 'Failed to generate dossier' }, { status: 500 })
  }
}
