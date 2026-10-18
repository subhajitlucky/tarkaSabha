import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { synthesizeChat } from '@/lib/synthesis'
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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const access = await authorize(id)
    if ('error' in access) return access.error

    const result = await synthesizeChat(id, access.userId)

    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'Synthesis failed' }, { status: 400 })
    }

    return NextResponse.json({
      id: result.artifactId,
      title: result.title,
      content: result.content,
    })
  } catch (error) {
    console.error('Error synthesising chat:', error)
    return NextResponse.json({ error: 'Synthesis failed' }, { status: 500 })
  }
}
