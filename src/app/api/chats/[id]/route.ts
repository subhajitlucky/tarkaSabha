import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addParticipants, removeParticipants, autoContinueDebate } from '@/lib/orchestrator'
import { auth } from '@/auth'

// In-memory lock to prevent concurrent auto-debate calls per chat
// (Note: This map is local to this file/module. If the server is serverless/lambda, this might not be perfect but sufficient for now)
const debateLocks = new Map<string, boolean>()

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
      include: {
        participants: {
          include: { persona: true },
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

    // Check if chat exists and get creator
    const existingChat = await prisma.chat.findUnique({
      where: { id },
      select: { creatorId: true },
    })

    if (!existingChat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Only the chat creator can update it
    if (existingChat.creatorId !== session?.user?.id) {
      return NextResponse.json(
        { error: 'Only the chat creator can modify this chat' },
        { status: 403 }
      )
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
      const result = await addParticipants(id, addParticipantIds)
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

    // Get all persona IDs associated with this chat
    const personaOnChat = await prisma.personaOnChat.findMany({
      where: { chatId: id },
      select: { personaId: true },
    })
    const personaIds = personaOnChat.map(p => p.personaId)

    // Get all provider IDs used by these personas
    const providers = await prisma.provider.findMany({
      where: {
        personas: {
          some: {
            id: { in: personaIds },
          },
        },
      },
    })
    const providerIds = providers.map(p => p.id)

    // Delete all providers (cascades to personas and their messages)
    if (providerIds.length > 0) {
      await prisma.provider.deleteMany({
        where: { id: { in: providerIds } },
      })
    }

    // Delete the chat (cascades to PersonaOnChat and remaining messages)
    await prisma.chat.delete({ where: { id } })

    return NextResponse.json({ success: true, deletedProviders: providerIds.length })
  } catch (error) {
    console.error('Error deleting chat:', error)
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 })
  }
}
