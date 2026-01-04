import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const personas = await prisma.persona.findMany({
      where: { creatorId: session.user.id },
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
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // If provider is specified, verify it exists and belongs to user
    if (providerId) {
      const provider = await prisma.provider.findFirst({
        where: { 
          id: providerId,
          creatorId: session.user.id
        },
      })
      if (!provider) {
        return NextResponse.json({ error: 'Provider not found or access denied' }, { status: 400 })
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
        creatorId: session.user.id,
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
