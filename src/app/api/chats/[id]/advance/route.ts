import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runTurn } from '@/lib/debate-runner'
import { auth } from '@/auth'

export const maxDuration = 60

/**
 * Run exactly one debate turn on demand. This is the manual-mode counterpart to
 * the scheduled runner: the user drives the debate one speaker at a time without
 * having to keep a browser loop alive.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const chat = await prisma.chat.findUnique({
      where: { id },
      select: { creatorId: true },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    if (chat.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the chat creator can advance this chat' },
        { status: 403 }
      )
    }

    const result = await runTurn(id)

    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'Turn failed' }, { status: 400 })
    }

    return NextResponse.json({ speakerId: result.speakerId })
  } catch (error) {
    console.error('Error advancing chat:', error)
    return NextResponse.json({ error: 'Failed to advance chat' }, { status: 500 })
  }
}
