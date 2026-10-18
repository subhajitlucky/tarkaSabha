import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// Upper bound on messages returned per poll. The chat view refreshes every few
// seconds, so this must never grow with the length of the debate.
const MAX_MESSAGES_PER_FETCH = 500

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify chat ownership
    const chat = await prisma.chat.findUnique({
      where: { id },
      select: { creatorId: true }
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    if (chat.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // The client polls this every few seconds, so the query must be bounded.
    // It previously fetched every message in the chat with no limit, and the
    // `lastId` parameter that was meant to make it incremental was never sent by
    // any caller. Return the most recent window, oldest-first for rendering.
    const messages = await prisma.message.findMany({
      where: { chatId: id },
      orderBy: { createdAt: 'desc' },
      take: MAX_MESSAGES_PER_FETCH,
    })

    return NextResponse.json(messages.reverse())
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify chat ownership
    const chat = await prisma.chat.findUnique({
      where: { id },
      select: { creatorId: true }
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    if (chat.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.message.deleteMany({
      where: { chatId: id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error wiping messages:', error)
    return NextResponse.json({ error: 'Failed to wipe messages' }, { status: 500 })
  }
}
