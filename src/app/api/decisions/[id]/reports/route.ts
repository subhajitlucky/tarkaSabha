import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { recordAuditEvent } from '@/lib/audit'
import { buildDecisionReport, sha256 } from '@/lib/decision-report'
import {
  canEditDecisions,
  getDecisionMembership,
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

    const membership = await getDecisionMembership(id, session.user.id)
    if (!membership) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 })
    }

    if (!canEditDecisions(membership.role)) {
      return NextResponse.json(
        { error: 'Viewers cannot generate reports for this decision' },
        { status: 403 }
      )
    }

    const decision = await prisma.decision.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        summary: true,
        status: true,
        impact: true,
        debtScore: true,
        debtRationale: true,
        revisitAt: true,
        outcome: true,
        outcomeSummary: true,
        createdAt: true,
        updatedAt: true,
        workspace: { select: { name: true } },
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
        approvals: {
          orderBy: { createdAt: 'asc' },
          select: {
            role: true,
            status: true,
            note: true,
            contentHash: true,
            createdAt: true,
            decidedAt: true,
            actor: { select: { name: true, email: true } },
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
            lastRunAt: true,
            lastRunResult: true,
            supersessionTrigger: true,
            owner: { select: { name: true, email: true } },
          },
        },
      },
    })

    if (!decision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 })
    }

    if (decision.evidence.length === 0) {
      return NextResponse.json(
        { error: 'Add at least one evidence item before generating a report' },
        { status: 400 }
      )
    }

    const content = buildDecisionReport({
      decision: {
        id: decision.id,
        title: decision.title,
        summary: decision.summary,
        status: decision.status,
        impact: decision.impact,
        debtScore: decision.debtScore,
        debtRationale: decision.debtRationale,
        revisitAt: decision.revisitAt,
        outcome: decision.outcome,
        outcomeSummary: decision.outcomeSummary,
        createdAt: decision.createdAt,
        updatedAt: decision.updatedAt,
        owner: decision.owner,
        workspace: decision.workspace,
      },
      evidence: decision.evidence,
      approvals: decision.approvals,
      pins: decision.pins,
    })

    const latest = await prisma.report.aggregate({
      where: { decisionId: id },
      _max: { version: true },
    })
    const version = (latest._max.version ?? 0) + 1

    const report = await prisma.report.create({
      data: {
        decisionId: id,
        version,
        status: 'DRAFT',
        content,
        contentHash: sha256(content),
      },
      select: {
        id: true,
        version: true,
        status: true,
        content: true,
        contentHash: true,
        createdAt: true,
        publishedAt: true,
      },
    })

    await recordAuditEvent({
      workspaceId: membership.workspaceId,
      actorId: session.user.id,
      decisionId: id,
      action: 'report.generated',
      entityType: 'Report',
      entityId: report.id,
      summary: `Generated report version ${report.version}.`,
      metadata: { version: report.version, contentHash: report.contentHash },
    })

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
