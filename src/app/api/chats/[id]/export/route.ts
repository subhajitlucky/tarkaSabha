import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildRunMarkdown, exportFilename } from '@/lib/export'
import { auth } from '@/auth'

/**
 * Download a council run as Markdown.
 *
 * Owner-scoped: a run is a record of someone's private deliberation, so this
 * follows the same authorization as the rest of the chat API rather than
 * exposing anything by id alone.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const chat = await prisma.chat.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      topic: true,
      mode: true,
      objective: true,
      deliverableSpec: true,
      audience: true,
      creatorId: true,
      createdAt: true,
      participants: {
        select: {
          sortOrder: true,
          persona: { select: { name: true, role: true } },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!chat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  }

  if (chat.creatorId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [artifacts, messages] = await Promise.all([
    prisma.artifact.findMany({
      where: { chatId: id },
      orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
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
    }),
    prisma.message.findMany({
      where: { chatId: id },
      orderBy: { createdAt: 'asc' },
      select: { content: true, role: true, personaName: true, createdAt: true },
    }),
  ])

  const markdown = buildRunMarkdown({
    chat,
    // The Json column is typed loosely; the shape is written by synthesis-rubric.
    artifacts: artifacts.map((a) => ({
      ...a,
      breakdown: (a.breakdown ?? null) as never,
    })),
    messages,
  })

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${exportFilename(chat)}"`,
      // A run can be long; this is a document, not an API payload.
      'Cache-Control': 'no-store',
    },
  })
}
