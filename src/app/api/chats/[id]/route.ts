import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addParticipants, removeParticipants } from '@/lib/orchestrator'
import { auth } from '@/auth'

export async function GET(
  request: NextRequest,
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
      select: {
        id: true,
        title: true,
        topic: true,
        isAutoMode: true,
        creatorId: true,
        createdAt: true,
        updatedAt: true,
        lastSpeakerId: true,
        participants: {
          select: {
            id: true,
            personaId: true,
            persona: {
              select: {
                id: true,
                name: true,
                bio: true,
                personality: true,
                avatarUrl: true,
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    if (chat.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error('Error fetching chat:', error)
    return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, topic, isAutoMode, addParticipantIds, removeParticipantIds } = body

    const session = await auth()
    const userId = session?.user?.id

    // Check if chat exists and get creator
    const existingChat = await prisma.chat.findUnique({
      where: { id },
      select: { creatorId: true },
    })

    if (!existingChat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Only the chat creator can update it
    if (!userId || existingChat.creatorId !== userId) {
      return NextResponse.json(
        { error: 'Only the chat creator can modify this chat' },
        { status: 403 }
      )
    }

    if (title !== undefined && (title === null || typeof title !== 'string' || title.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Title must be a non-empty string' },
        { status: 400 }
      )
    }
    if (topic !== undefined && topic !== null && typeof topic !== 'string') {
      return NextResponse.json({ error: 'Topic must be a string' }, { status: 400 })
    }
    if (isAutoMode !== undefined && typeof isAutoMode !== 'boolean') {
      return NextResponse.json({ error: 'isAutoMode must be a boolean' }, { status: 400 })
    }
    for (const [label, value] of [
      ['addParticipantIds', addParticipantIds],
      ['removeParticipantIds', removeParticipantIds],
    ] as const) {
      if (
        value !== undefined &&
        value !== null &&
        (!Array.isArray(value) || value.some((entry: unknown) => typeof entry !== 'string'))
      ) {
        return NextResponse.json(
          { error: `${label} must be an array of strings` },
          { status: 400 }
        )
      }
    }

    // Update chat settings
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title.trim()
    if (topic !== undefined) updateData.topic = topic?.trim() || null
    if (isAutoMode !== undefined) updateData.isAutoMode = isAutoMode

    // Handle participant changes
    let participantChanges = { added: 0, removed: 0 }
    if (removeParticipantIds?.length > 0) {
      participantChanges.removed = await removeParticipants(id, removeParticipantIds)
    }
    if (addParticipantIds?.length > 0) {
      const result = await addParticipants(id, addParticipantIds, userId)
      participantChanges = { ...participantChanges, ...result }
    }

    const chat = await prisma.chat.update({
      where: { id },
      data: updateData,
      include: {
        participants: {
          include: { persona: true },
        },
      },
    })

    return NextResponse.json({
      chat,
      participantChanges,
    })
  } catch (error) {
    console.error('Error updating chat:', error)
    return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await auth()

    // Check if chat exists and get creator
    const existingChat = await prisma.chat.findUnique({
      where: { id },
      select: { creatorId: true },
    })

    if (!existingChat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Only the chat creator can delete it
    if (existingChat.creatorId !== session?.user?.id) {
      return NextResponse.json(
        { error: 'Only the chat creator can delete this chat' },
        { status: 403 }
      )
    }

    // Delete the chat (PersonaOnChat and messages cascade via schema)
    await prisma.chat.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting chat:', error)
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 })
  }
}
