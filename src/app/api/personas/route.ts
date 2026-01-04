import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const personas = await prisma.persona.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        provider: true,
      },
    })
    return NextResponse.json(personas)
  } catch (error) {
    console.error('Error fetching personas:', error)
    return NextResponse.json({ error: 'Failed to fetch personas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, bio, personality, providerId, model, temperature } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters' },
        { status: 400 }
      )
    }

    const normalizedName = name.trim()

    // Bio and personality are optional - provide defaults if not given
    const finalBio = bio?.trim() || `I am ${normalizedName}, a participant in this discussion.`
    const finalPersonality = personality?.trim() || 'Friendly and conversational.'

    // If provider is specified, verify it exists
    if (providerId) {
      const provider = await prisma.provider.findUnique({
        where: { id: providerId },
      })
      if (!provider) {
        return NextResponse.json({ error: 'Provider not found' }, { status: 400 })
      }
    }

    const persona = await prisma.persona.create({
      data: {
        name: normalizedName,
        bio: finalBio,
        personality: finalPersonality,
        providerId: providerId || null,
        model: model || null,
        temperature: temperature ?? null,
      },
      include: {
        provider: true,
      },
    })

    return NextResponse.json(persona)
  } catch (error) {
    console.error('Error creating persona:', error)
    return NextResponse.json({ error: 'Failed to create persona' }, { status: 500 })
  }
}
