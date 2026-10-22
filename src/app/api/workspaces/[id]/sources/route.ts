import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { recordAuditEvent } from '@/lib/audit'
import { ingestGitHubRepo, parseGitHubRepo } from '@/lib/github-ingest'
import { canEditDecisions, getWorkspaceMembership } from '@/lib/workspaces'

export const maxDuration = 60

const SOURCE_SELECT = {
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
} as const

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
        { error: 'Viewers cannot ingest sources into this workspace' },
        { status: 403 }
      )
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (typeof body.url !== 'string') {
      return NextResponse.json({ error: 'A GitHub repository URL is required' }, { status: 400 })
    }

    const parsed = parseGitHubRepo(body.url)
    if (!parsed) {
      return NextResponse.json(
        { error: 'Use a public GitHub repository URL, such as https://github.com/owner/repo' },
        { status: 400 }
      )
    }

    if (body.ref !== undefined && typeof body.ref !== 'string') {
      return NextResponse.json({ error: 'Branch must be a string' }, { status: 400 })
    }
    const ref = typeof body.ref === 'string' ? body.ref.trim() : ''
    if (ref.length > 200) {
      return NextResponse.json({ error: 'Branch name is too long' }, { status: 400 })
    }

    const result = await ingestGitHubRepo({
      owner: parsed.owner,
      repo: parsed.repo,
      ref: ref || undefined,
    })

    const source = await prisma.workspaceSource.create({
      data: {
        workspaceId: id,
        createdById: session.user.id,
        provider: 'github',
        repoUrl: result.repoUrl,
        owner: result.owner,
        name: result.name,
        ref: result.ref,
        commitSha: result.commitSha,
        status: 'READY',
        fileCount: result.counts.files,
        commitCount: result.counts.commits,
        pullRequestCount: result.counts.pullRequests,
        issueCount: result.counts.issues,
        snapshots: {
          create: result.snapshots.map((snapshot) => ({
            kind: snapshot.kind,
            path: snapshot.path,
            title: snapshot.title ?? null,
            content: snapshot.content ?? null,
            url: snapshot.url,
            sha: snapshot.sha ?? null,
            sha256: snapshot.sha256 ?? null,
            size: snapshot.size ?? null,
            metadata: snapshot.metadata ?? undefined,
          })),
        },
      },
      select: SOURCE_SELECT,
    })

    await recordAuditEvent({
      workspaceId: id,
      actorId: session.user.id,
      action: 'source.ingested',
      entityType: 'WorkspaceSource',
      entityId: source.id,
      summary: `Ingested ${source.owner}/${source.name}@${source.ref}.`,
      metadata: {
        files: source.fileCount,
        commits: source.commitCount,
        pullRequests: source.pullRequestCount,
        issues: source.issueCount,
      },
    })

    return NextResponse.json(source, { status: 201 })
  } catch (error) {
    console.error('Error ingesting source:', error)
    const message =
      error instanceof Error && /GitHub|Repository, branch/.test(error.message)
        ? error.message
        : 'Could not ingest the repository.'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
