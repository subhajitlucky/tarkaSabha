import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const chats = await prisma.chat.findMany({
      where: { creatorId: session.user.id },
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
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, topic, participantIds } = body

    const chat = await prisma.chat.create({
      data: {
        title: title || 'New Discussion',
        topic: topic?.trim() || null,
        creatorId: session.user.id,
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
