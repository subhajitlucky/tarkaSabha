import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const messages = await prisma.message.findMany({
      where: { chatId: id },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.message.deleteMany({
      where: { chatId: id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error wiping messages:', error)
    return NextResponse.json({ error: 'Failed to wipe messages' }, { status: 500 })
  }
}
