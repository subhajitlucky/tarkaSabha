import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  DEFAULT_CANDIDATES,
  DEFAULT_ROUNDS,
  MAX_CANDIDATES,
  MAX_ROUNDS,
  synthesizeChat,
} from '@/lib/synthesis'
import { auth } from '@/auth'

export const maxDuration = 60

/** Resolve the chat and confirm the caller owns it. */
async function authorize(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const chat = await prisma.chat.findUnique({
    where: { id },
    select: { creatorId: true },
  })

  if (!chat) {
    return { error: NextResponse.json({ error: 'Chat not found' }, { status: 404 }) }
  }

  if (chat.creatorId !== session.user.id) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { userId: session.user.id }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const access = await authorize(id)
    if ('error' in access) return access.error

    const artifacts = await prisma.artifact.findMany({
      where: { chatId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        kind: true,
        title: true,
        content: true,
        model: true,
        score: true,
        breakdown: true,
        selected: true,
        round: true,
        angle: true,
        createdAt: true,
      },
    })

    return NextResponse.json(artifacts)
  } catch (error) {
    console.error('Error fetching artifacts:', error)
    return NextResponse.json({ error: 'Failed to fetch artifacts' }, { status: 500 })
  }
}

/**
 * Produce a deliverable from the discussion so far and store it.
 *
 * This is the step that turns a transcript into an answer, so it runs as its own
 * request rather than as another debate turn.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const access = await authorize(id)
    if ('error' in access) return access.error

    const body = await request.json().catch(() => ({}))

    const clamp = (value: unknown, min: number, max: number, fallback: number) => {
      const parsed = Number(value)
      if (!Number.isFinite(parsed)) return fallback
      return Math.min(max, Math.max(min, Math.trunc(parsed)))
    }

    // Generating and judging N candidates costs 2N provider calls, so both
    // knobs are clamped and the caller opts into more.
    const result = await synthesizeChat(id, access.userId, {
      candidates: clamp(body?.candidates, 1, MAX_CANDIDATES, DEFAULT_CANDIDATES),
      rounds: clamp(body?.rounds, 1, MAX_ROUNDS, DEFAULT_ROUNDS),
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'Synthesis failed' }, { status: 400 })
    }

    return NextResponse.json({
      id: result.artifactId,
      title: result.title,
      content: result.content,
      score: result.score,
      rounds: result.rounds,
      budgetExhausted: result.budgetExhausted ?? false,
      candidates: result.candidates ?? [],
    })
  } catch (error) {
    console.error('Error synthesising chat:', error)
    return NextResponse.json({ error: 'Synthesis failed' }, { status: 500 })
  }
}
