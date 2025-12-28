import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const persona = await prisma.persona.findUnique({
      where: { id },
      include: { provider: true },
    })
    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }
    return NextResponse.json(persona)
  } catch (error) {
    console.error('Error fetching persona:', error)
    return NextResponse.json({ error: 'Failed to fetch persona' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, bio, personality, providerId, model, temperature } = body

    const persona = await prisma.persona.update({
      where: { id },
      data: {
        name: name?.trim(),
        bio: bio?.trim(),
        personality: personality?.trim(),
        providerId: providerId || null,
        model: model || null,
        temperature: temperature ?? null,
      },
      include: { provider: true },
    })

    return NextResponse.json(persona)
  } catch (error) {
    console.error('Error updating persona:', error)
    return NextResponse.json({ error: 'Failed to update persona' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.persona.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting persona:', error)
    return NextResponse.json({ error: 'Failed to delete persona' }, { status: 500 })
  }
}
