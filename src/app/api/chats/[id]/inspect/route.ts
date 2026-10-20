import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

function evidenceCount(value: unknown): number {
  return Array.isArray(value) ? value.length : 0
}

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
        objective: true,
        topic: true,
        createdAt: true,
        updatedAt: true,
        turnCount: true,
        participants: {
          select: {
            persona: {
              select: {
                id: true,
                name: true,
                role: true,
                model: true,
                tools: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        messages: {
          select: {
            id: true,
            content: true,
            role: true,
            personaId: true,
            personaName: true,
            createdAt: true,
            selectionReason: true,
            inputTokens: true,
            outputTokens: true,
            latencyMs: true,
            evidence: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        artifacts: {
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
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }
    if (chat.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const agentMessages = chat.messages.filter((message) => message.role === 'persona')
    const totalInputTokens = agentMessages.reduce(
      (total, message) => total + (message.inputTokens ?? 0),
      0
    )
    const totalOutputTokens = agentMessages.reduce(
      (total, message) => total + (message.outputTokens ?? 0),
      0
    )
    const totalLatencyMs = agentMessages.reduce(
      (total, message) => total + (message.latencyMs ?? 0),
      0
    )

    return NextResponse.json({
      ok: true,
      chat: {
        ...chat,
        messages: chat.messages.map((message) => ({
          ...message,
          evidenceCount: evidenceCount(message.evidence),
          evidence: undefined,
        })),
        artifacts: chat.artifacts.map((artifact) => ({
          ...artifact,
          content: undefined,
        })),
      },
      summary: {
        turns: agentMessages.length,
        measuredTurns: agentMessages.filter((message) => message.latencyMs != null).length,
        toolCalls: chat.messages.reduce(
          (total, message) => total + evidenceCount(message.evidence),
          0
        ),
        totalInputTokens,
        totalOutputTokens,
        totalLatencyMs,
        candidates: chat.artifacts.length,
      },
    })
  } catch (error) {
    console.error('Run inspection failed:', error)
    return NextResponse.json({ error: 'Could not inspect this run' }, { status: 500 })
  }
}
