import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const chats = await prisma.chat.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        participants: {
          include: { persona: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    return NextResponse.json(chats)
  } catch (error) {
    console.error('Error fetching chats:', error)
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, topic, participantIds, creatorId } = body

    const chat = await prisma.chat.create({
      data: {
        title: title || 'New Discussion',
        topic: topic?.trim() || null,
        creatorId: creatorId || null,
        participants: participantIds?.length > 0
          ? {
              create: participantIds.map((id: string) => ({
                personaId: id,
              })),
            }
          : undefined,
      },
      include: {
        participants: {
          include: { persona: true },
        },
      },
    })

    return NextResponse.json(chat)
  } catch (error) {
    console.error('Error creating chat:', error)
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 })
  }
}
