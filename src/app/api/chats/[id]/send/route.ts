import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  orchestrateMessage,
  extractMention,
  autoContinueDebate,
  getParticipants,
} from '@/lib/orchestrator'
import { auth } from '@/auth'
import { sanitizeContent, validateMessageLength } from '@/lib/llm-protection'

export const maxDuration = 60 // 60 seconds

// In-memory lock to prevent concurrent auto-debate calls per chat
const debateLocks = new Map<string, boolean>()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chatId } = await params
    const body = await request.json()
    const { content, isUser, userName } = body

    // Validate content only for user messages
    if (isUser) {
      const validation = validateMessageLength(content)
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }
    }

    // Sanitize content (only if provided)
    const sanitizedContent = content ? sanitizeContent(content) : ''

    const session = await auth()

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: {
          include: { persona: true },
        },
      },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Only the chat creator can send messages or trigger agents
    if (chat.creatorId !== session?.user?.id) {
      return NextResponse.json(
        { error: 'Only the chat creator can send messages' },
        { status: 403 }
      )
    }

    const participants = chat.participants.map(p => p.persona)
    const mention = extractMention(sanitizedContent)
    const mentionedPersonaId = mention
      ? participants.find(p => p.name.toLowerCase() === mention.toLowerCase())?.id
      : undefined

    // If user message, save it first
    if (isUser) {
      const message = await prisma.message.create({
        data: {
          content: sanitizedContent,
          role: 'user',
          chatId,
          personaName: userName || 'User',
        },
      })

      await prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      })

      return NextResponse.json(message)
    }

    // Persona message - use orchestrator
    const result = await orchestrateMessage(
      {
        chatId,
        topic: chat.topic,
        isAutoMode: chat.isAutoMode,
        lastSpeakerId: chat.lastSpeakerId,
        mentionedPersonaId,
      },
      sanitizedContent,
      false,
      participants,
      session.user.id
    )

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      content: result.message,
      speakerId: result.speakerId,
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
