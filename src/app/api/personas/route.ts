import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { PERSONA_ROLES, isPersonaRole } from '@/lib/orchestrator'
import { TOOL_NAMES, isToolName } from '@/lib/tools'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const personas = await prisma.persona.findMany({
      where: { creatorId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        bio: true,
        personality: true,
        role: true,
        tools: true,
        avatarUrl: true,
        model: true,
        temperature: true,
        createdAt: true,
        provider: {
          select: {
            id: true,
            name: true,
            provider: true,
          }
        },
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
    const { name, bio, personality, role, tools, providerId, model, temperature } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters' },
        { status: 400 }
      )
    }

    if (bio !== undefined && bio !== null && typeof bio !== 'string') {
      return NextResponse.json({ error: 'Bio must be a string' }, { status: 400 })
    }
    if (personality !== undefined && personality !== null && typeof personality !== 'string') {
      return NextResponse.json({ error: 'Personality must be a string' }, { status: 400 })
    }
    if (providerId !== undefined && providerId !== null && typeof providerId !== 'string') {
      return NextResponse.json({ error: 'Provider ID must be a string' }, { status: 400 })
    }
    if (tools !== undefined && tools !== null) {
      if (!Array.isArray(tools) || tools.some((name: unknown) => typeof name !== 'string')) {
        return NextResponse.json({ error: 'tools must be an array of strings' }, { status: 400 })
      }
      const unknownTools = tools.filter((name: string) => !isToolName(name))
      if (unknownTools.length > 0) {
        return NextResponse.json(
          { error: `Unknown tool(s): ${unknownTools.join(', ')}. Available: ${TOOL_NAMES.join(', ')}` },
          { status: 400 }
        )
      }
    }
    if (role !== undefined && role !== null && !isPersonaRole(role)) {
      return NextResponse.json(
        { error: `Role must be one of: ${PERSONA_ROLES.join(', ')}` },
        { status: 400 }
      )
    }
    if (model !== undefined && model !== null && typeof model !== 'string') {
      return NextResponse.json({ error: 'Model must be a string' }, { status: 400 })
    }
    if (temperature !== undefined && temperature !== null && typeof temperature !== 'number') {
      return NextResponse.json({ error: 'Temperature must be a number' }, { status: 400 })
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
        role: role || 'contributor',
        tools: tools || [],
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
