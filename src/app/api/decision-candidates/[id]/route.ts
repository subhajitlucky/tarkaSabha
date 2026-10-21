import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import {
  MAX_DECISION_SUMMARY,
  MAX_DECISION_TITLE,
  canEditDecisions,
  cleanText,
  isWorkspaceRole,
  optionalText,
} from '@/lib/workspaces'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const candidate = await prisma.decisionCandidate.findUnique({
      where: { id },
      select: {
        id: true,
        workspaceId: true,
        title: true,
        context: true,
        proposal: true,
        rationale: true,
        confidence: true,
        status: true,
        decisionId: true,
        workspace: {
          select: {
            memberships: {
              where: { userId: session.user.id },
              select: { role: true },
            },
          },
        },
        evidence: {
          select: {
            quote: true,
            snapshot: {
              select: {
                kind: true,
                path: true,
                title: true,
                sha: true,
                sha256: true,
                source: { select: { commitSha: true } },
              },
            },
          },
        },
      },
    })

    const role = candidate?.workspace.memberships[0]?.role
    if (!candidate || !role || !isWorkspaceRole(role)) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    if (!canEditDecisions(role)) {
      return NextResponse.json(
        { error: 'Viewers cannot review candidate decisions' },
        { status: 403 }
      )
    }

    if (candidate.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This candidate has already been reviewed' },
        { status: 409 }
      )
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (body.status !== 'CONFIRMED' && body.status !== 'REJECTED') {
      return NextResponse.json(
        { error: 'Status must be CONFIRMED or REJECTED' },
        { status: 400 }
      )
    }

    if (body.status === 'REJECTED') {
      const rejected = await prisma.decisionCandidate.update({
        where: { id },
        data: { status: 'REJECTED' },
        select: { id: true, status: true, decisionId: true },
      })
      return NextResponse.json({ candidate: rejected, decision: null })
    }

    const title =
      body.title === undefined
        ? candidate.title
        : cleanText(body.title, MAX_DECISION_TITLE)
    if (!title) {
      return NextResponse.json(
        { error: `Decision title is required (max ${MAX_DECISION_TITLE} characters)` },
        { status: 400 }
      )
    }

    function resolveSummaryField(value: unknown, fallback: string | null): string | null {
      if (value === undefined) return fallback
      const parsed = optionalText(value, MAX_DECISION_SUMMARY)
      if (parsed === undefined) {
        throw new Error('Invalid field')
      }
      return parsed
    }

    let context: string | null
    let proposal: string | null
    let rationale: string | null
    try {
      context = resolveSummaryField(body.context, candidate.context)
      proposal = resolveSummaryField(body.proposal, candidate.proposal)
      rationale = resolveSummaryField(body.rationale, candidate.rationale)
    } catch {
      return NextResponse.json(
        { error: `Context, proposal, and rationale must be strings (max ${MAX_DECISION_SUMMARY} characters)` },
        { status: 400 }
      )
    }

    const summary =
      [context, proposal].filter(Boolean).join('\n\n').slice(0, MAX_DECISION_SUMMARY) || null

    const decision = await prisma.decision.create({
      data: {
        workspaceId: candidate.workspaceId,
        title,
        summary,
        status: 'DRAFT',
        impact: 'MEDIUM',
        createdById: session.user.id,
        ownerId: session.user.id,
      },
      select: { id: true, title: true },
    })

    const evidenceRows = candidate.evidence.map((entry) => {
      const snapshot = entry.snapshot
      const kind =
        snapshot.kind === 'FILE'
          ? /\.(md|mdx|rst|txt|adoc)$/i.test(snapshot.path)
            ? 'DOC'
            : 'CODE'
          : snapshot.kind === 'COMMIT'
            ? 'COMMIT'
            : 'OTHER'

      return {
        decisionId: decision.id,
        kind,
        source: snapshot.path,
        commit:
          snapshot.kind === 'COMMIT' ? snapshot.sha : snapshot.source.commitSha,
        quote: entry.quote || snapshot.title || snapshot.path,
        sha256: snapshot.sha256,
        status: 'VERIFIED',
        confidence: candidate.confidence,
      }
    })

    try {
      if (evidenceRows.length > 0) {
        await prisma.evidence.createMany({ data: evidenceRows })
      }
    } catch (error) {
      await prisma.decision.delete({ where: { id: decision.id } }).catch(() => undefined)
      throw error
    }

    const updated = await prisma.decisionCandidate.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        decisionId: decision.id,
        title,
        context,
        proposal,
        rationale,
      },
      select: { id: true, status: true, decisionId: true },
    })

    return NextResponse.json({
      candidate: updated,
      decision,
      evidenceCount: evidenceRows.length,
    })
  } catch (error) {
    console.error('Error reviewing candidate decision:', error)
    return NextResponse.json({ error: 'Failed to review candidate decision' }, { status: 500 })
  }
}
