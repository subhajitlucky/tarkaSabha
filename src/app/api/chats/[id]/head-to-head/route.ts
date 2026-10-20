import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { compareCouncilToSingle } from '@/lib/head-to-head'

export const maxDuration = 60

export async function POST(
  request: Request,
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
      select: { creatorId: true },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }
    if (chat.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the chat creator can run a comparison' },
        { status: 403 }
      )
    }

    const result = await compareCouncilToSingle(id, session.user.id)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Head-to-head comparison failed:', error)
    return NextResponse.json({ error: 'The comparison failed' }, { status: 500 })
  }
}
