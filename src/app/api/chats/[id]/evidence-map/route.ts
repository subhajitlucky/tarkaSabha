import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { buildEvidenceMap } from '@/lib/evidence-map'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const chat = await prisma.chat.findUnique({
      where: { id },
      select: {
        creatorId: true,
        title: true,
        messages: {
          select: {
            id: true,
            content: true,
            role: true,
            personaName: true,
            createdAt: true,
            evidence: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        artifacts: {
          where: { kind: 'synthesis' },
          select: { id: true, title: true, content: true, selected: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }
    if (chat.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const winner = chat.artifacts.find((artifact) => artifact.selected) ?? chat.artifacts[0]
    const latestMessage = chat.messages.at(-1)
    const content = winner?.content ?? latestMessage?.content ?? null

    const map = buildEvidenceMap({
      content,
      messages: chat.messages.map((message) => ({
        id: message.id,
        speaker:
          message.personaName ||
          (message.role === 'user' ? 'Participant' : message.role === 'system' ? 'System' : 'Council'),
        createdAt: message.createdAt,
        evidence: message.evidence,
      })),
    })

    return NextResponse.json({
      ok: true,
      title: winner?.title ?? chat.title,
      source: winner ? 'deliverable' : latestMessage ? 'latest message' : 'none',
      ...map,
    })
  } catch (error) {
    console.error('Evidence map failed:', error)
    return NextResponse.json({ error: 'Could not build the evidence map' }, { status: 500 })
  }
}
