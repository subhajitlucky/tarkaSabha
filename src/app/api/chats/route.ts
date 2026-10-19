import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { CHAT_MODES, MAX_BRIEF_FIELD_LENGTH, isChatMode } from '@/lib/chat-brief'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const chats = await prisma.chat.findMany({
      where: { creatorId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        title: true,
        topic: true,
        createdAt: true,
        updatedAt: true,
        isAutoMode: true,
        participants: {
          select: {
            id: true,
            personaId: true,
            persona: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              }
            }
          },
          orderBy: { sortOrder: 'asc' },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            content: true,
            createdAt: true,
          }
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
    const { title, topic, mode, objective, deliverableSpec, audience, participantIds } = body

    if (title !== undefined && title !== null && typeof title !== 'string') {
      return NextResponse.json({ error: 'Title must be a string' }, { status: 400 })
    }
    if (topic !== undefined && topic !== null && typeof topic !== 'string') {
      return NextResponse.json({ error: 'Topic must be a string' }, { status: 400 })
    }
    if (mode !== undefined && mode !== null && !isChatMode(mode)) {
      return NextResponse.json(
        { error: `Mode must be one of: ${CHAT_MODES.join(', ')}` },
        { status: 400 }
      )
    }
    for (const [label, value] of [
      ['objective', objective],
      ['deliverableSpec', deliverableSpec],
      ['audience', audience],
    ] as const) {
      if (value !== undefined && value !== null && typeof value !== 'string') {
        return NextResponse.json({ error: `${label} must be a string` }, { status: 400 })
      }
      if (typeof value === 'string' && value.length > MAX_BRIEF_FIELD_LENGTH) {
        return NextResponse.json(
          { error: `${label} must be at most ${MAX_BRIEF_FIELD_LENGTH} characters` },
          { status: 400 }
        )
      }
    }
    if (
      participantIds !== undefined &&
      participantIds !== null &&
      (!Array.isArray(participantIds) || participantIds.some((id: unknown) => typeof id !== 'string'))
    ) {
      return NextResponse.json(
        { error: 'participantIds must be an array of strings' },
        { status: 400 }
      )
    }

    // Only personas the caller owns may join. Without this the create path had
    // the same hole the PUT path was fixed for: attach someone else's persona at
    // creation time, then read its bio and personality back through
    // GET /api/chats/[id].
    let ownedParticipantIds: string[] = []
    if (participantIds?.length > 0) {
      const owned = await prisma.persona.findMany({
        where: { id: { in: participantIds }, creatorId: session.user.id },
        select: { id: true },
      })
      ownedParticipantIds = owned.map((persona) => persona.id)
    }

    const chat = await prisma.chat.create({
      data: {
        title: title || 'New Discussion',
        topic: topic?.trim() || null,
        mode: mode || 'debate',
        objective: objective?.trim() || null,
        deliverableSpec: deliverableSpec?.trim() || null,
        audience: audience?.trim() || null,
        creatorId: session.user.id,
        participants: ownedParticipantIds.length > 0
          ? {
              // sortOrder must be explicit. The column defaults to 0, so omitting
              // it ties every participant and turns the speaker query's
              // ORDER BY into a no-op — the order the caller gave would be
              // silently discarded and the speaker chosen by heap order.
              create: ownedParticipantIds.map((id, index) => ({
                personaId: id,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      include: {
        participants: {
          include: { persona: true },
          // Distinct sortOrder is what makes this deterministic; without an
          // explicit order the display order is whatever the heap returns.
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    return NextResponse.json(chat)
  } catch (error) {
    console.error('Error creating chat:', error)
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 })
  }
}
