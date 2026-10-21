import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import {
  CONFIDENCES,
  EVIDENCE_KINDS,
  EVIDENCE_STATUSES,
  MAX_EVIDENCE_COMMIT,
  MAX_EVIDENCE_HASH,
  MAX_EVIDENCE_QUOTE,
  MAX_EVIDENCE_SOURCE,
  canEditDecisions,
  cleanText,
  getDecisionMembership,
  isConfidence,
  isEvidenceKind,
  isEvidenceStatus,
  optionalText,
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
        { error: 'Viewers cannot add evidence to this decision' },
        { status: 403 }
      )
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const kind = body.kind === undefined ? 'CODE' : body.kind
    if (!isEvidenceKind(kind)) {
      return NextResponse.json(
        { error: `Evidence kind must be one of: ${EVIDENCE_KINDS.join(', ')}` },
        { status: 400 }
      )
    }

    const source = cleanText(body.source, MAX_EVIDENCE_SOURCE)
    if (!source) {
      return NextResponse.json(
        { error: `Evidence source is required (max ${MAX_EVIDENCE_SOURCE} characters)` },
        { status: 400 }
      )
    }

    const quote = cleanText(body.quote, MAX_EVIDENCE_QUOTE)
    if (!quote) {
      return NextResponse.json(
        { error: `Evidence quote is required (max ${MAX_EVIDENCE_QUOTE} characters)` },
        { status: 400 }
      )
    }

    const commit = optionalText(body.commit, MAX_EVIDENCE_COMMIT)
    if (body.commit !== undefined && commit === undefined) {
      return NextResponse.json(
        { error: `Commit must be a string (max ${MAX_EVIDENCE_COMMIT} characters)` },
        { status: 400 }
      )
    }

    const sha256 = optionalText(body.sha256, MAX_EVIDENCE_HASH)
    if (body.sha256 !== undefined && sha256 === undefined) {
      return NextResponse.json(
        { error: `Hash must be a string (max ${MAX_EVIDENCE_HASH} characters)` },
        { status: 400 }
      )
    }

    const status = body.status === undefined ? 'VERIFIED' : body.status
    if (!isEvidenceStatus(status)) {
      return NextResponse.json(
        { error: `Evidence status must be one of: ${EVIDENCE_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const confidence = body.confidence === undefined ? 'MEDIUM' : body.confidence
    if (!isConfidence(confidence)) {
      return NextResponse.json(
        { error: `Confidence must be one of: ${CONFIDENCES.join(', ')}` },
        { status: 400 }
      )
    }

    const evidence = await prisma.evidence.create({
      data: {
        decisionId: id,
        kind,
        source,
        quote,
        commit: commit ?? null,
        sha256: sha256 ?? null,
        status,
        confidence,
      },
      select: {
        id: true,
        kind: true,
        source: true,
        commit: true,
        quote: true,
        sha256: true,
        status: true,
        confidence: true,
        createdAt: true,
      },
    })

    return NextResponse.json(evidence, { status: 201 })
  } catch (error) {
    console.error('Error adding evidence:', error)
    return NextResponse.json({ error: 'Failed to add evidence' }, { status: 500 })
  }
}
