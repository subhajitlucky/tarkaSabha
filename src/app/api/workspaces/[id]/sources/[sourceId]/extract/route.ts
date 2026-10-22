import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { recordAuditEvent } from '@/lib/audit'
import { getLLMResponse, ProviderType } from '@/lib/llm-provider'
import { LLM_TIMEOUT_MS, withTimeout } from '@/lib/llm-protection'
import {
  buildExtractionPrompt,
  parseCandidateResponse,
} from '@/lib/decision-extraction'
import { canEditDecisions, getWorkspaceMembership } from '@/lib/workspaces'

export const maxDuration = 60

const CANDIDATE_SELECT = {
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
} as const

export async function POST(
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

    if (!canEditDecisions(membership.role)) {
      return NextResponse.json(
        { error: 'Viewers cannot extract candidate decisions' },
        { status: 403 }
      )
    }

    const source = await prisma.workspaceSource.findFirst({
      where: { id: sourceId, workspaceId: id },
      select: {
        id: true,
        owner: true,
        name: true,
        ref: true,
        snapshots: {
          select: {
            id: true,
            kind: true,
            path: true,
            title: true,
            content: true,
            sha: true,
          },
        },
      },
    })

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    if (source.snapshots.length === 0) {
      return NextResponse.json(
        { error: 'This source has no snapshots to extract from' },
        { status: 400 }
      )
    }

    const pending = await prisma.decisionCandidate.count({
      where: { sourceId, status: 'PENDING' },
    })
    if (pending > 0) {
      return NextResponse.json(
        { error: 'Review the pending candidates before extracting again' },
        { status: 409 }
      )
    }

    const provider = await prisma.provider.findFirst({
      where: { creatorId: session.user.id, isDefault: true },
    })

    if (!provider) {
      return NextResponse.json(
        { error: 'Add a default provider in Providers before extracting decisions' },
        { status: 400 }
      )
    }

    const ordered = [...source.snapshots].sort((a, b) => {
      const order: Record<string, number> = {
        FILE: 0,
        COMMIT: 1,
        PULL_REQUEST: 2,
        ISSUE: 3,
      }
      return (order[a.kind] ?? 4) - (order[b.kind] ?? 4) || a.path.localeCompare(b.path)
    })

    const promptSnapshots = ordered.slice(0, 23)
    const prompt = buildExtractionPrompt({
      repo: `${source.owner}/${source.name}`,
      ref: source.ref,
      snapshots: promptSnapshots,
    })

    const response = await withTimeout(
      getLLMResponse(
        provider.apiKey,
        provider.provider as ProviderType,
        provider.model,
        [{ role: 'user', content: prompt }],
        {
          apiUrl: provider.apiUrl,
          temperature: 0.1,
          maxTokens: 3000,
        }
      ),
      LLM_TIMEOUT_MS,
      'Decision extraction timed out'
    )

    const parsed = parseCandidateResponse(
      response.content,
      new Set(promptSnapshots.map((snapshot) => snapshot.id))
    )

    if (parsed === null) {
      return NextResponse.json(
        { error: 'The model did not return valid decision candidates. Try again.' },
        { status: 502 }
      )
    }

    const created = []

    for (const candidate of parsed) {
      const row = await prisma.decisionCandidate.create({
        data: {
          workspaceId: id,
          sourceId,
          createdById: session.user.id,
          title: candidate.title,
          context: candidate.context,
          proposal: candidate.proposal,
          rationale: candidate.rationale,
          confidence: candidate.confidence,
          evidence: {
            create: candidate.evidence.map((evidence) => ({
              snapshotId: evidence.snapshotId,
              quote: evidence.quote,
            })),
          },
        },
        select: CANDIDATE_SELECT,
      })
      created.push(row)
    }

    if (created.length > 0) {
      await recordAuditEvent({
        workspaceId: id,
        actorId: session.user.id,
        action: 'candidate.extracted',
        entityType: 'WorkspaceSource',
        entityId: sourceId,
        summary: `Extracted ${created.length} candidate decision${created.length === 1 ? '' : 's'}.`,
        metadata: { count: created.length, model: provider.model },
      })
    }

    return NextResponse.json(
      {
        candidates: created,
        model: provider.model,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error extracting candidates:', error)
    const message =
      error instanceof Error && /timed out|rate limit/i.test(error.message)
        ? error.message
        : 'Could not extract candidate decisions.'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
