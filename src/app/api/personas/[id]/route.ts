import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { PERSONA_ROLES, isPersonaRole } from '@/lib/orchestrator'
import { TOOL_NAMES, isToolName } from '@/lib/tools'

function withoutApiKey<T extends { apiKey: string }>(provider: T): Omit<T, 'apiKey'> {
  const clone = { ...provider } as { apiKey?: string }
  delete clone.apiKey
  return clone as Omit<T, 'apiKey'>
}

async function getPersonaForRequest(id: string, userId: string) {
  const persona = await prisma.persona.findUnique({
    where: { id },
    include: { provider: true },
  })

  if (!persona) {
    return { error: 'not_found' as const, status: 404 }
  }

  if (persona.creatorId !== userId) {
    return { error: 'forbidden' as const, status: 403 }
  }

  return { persona }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const result = await getPersonaForRequest(id, session.user.id)

    if ('error' in result) {
      return NextResponse.json(
        { error: result.status === 404 ? 'Persona not found' : 'Forbidden' },
        { status: result.status }
      )
    }

    const { provider, ...persona } = result.persona

    return NextResponse.json({
      ...persona,
      provider: provider ? withoutApiKey(provider) : provider,
    })
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
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const result = await getPersonaForRequest(id, session.user.id)

    if ('error' in result) {
      return NextResponse.json(
        { error: result.status === 404 ? 'Persona not found' : 'Forbidden' },
        { status: result.status }
      )
    }

    const body = await request.json()
    const { name, bio, personality, role, tools, providerId, model, temperature } = body

    if (name !== undefined && typeof name !== 'string') {
      return NextResponse.json({ error: 'Name must be a string' }, { status: 400 })
    }
    if (bio !== undefined && bio !== null && typeof bio !== 'string') {
      return NextResponse.json({ error: 'Bio must be a string' }, { status: 400 })
    }
    if (personality !== undefined && personality !== null && typeof personality !== 'string') {
      return NextResponse.json({ error: 'Personality must be a string' }, { status: 400 })
    }
    if (model !== undefined && model !== null && typeof model !== 'string') {
      return NextResponse.json({ error: 'Model must be a string' }, { status: 400 })
    }
    if (temperature !== undefined && temperature !== null && typeof temperature !== 'number') {
      return NextResponse.json({ error: 'Temperature must be a number' }, { status: 400 })
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

    if (name !== undefined && name.trim().length === 0) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
    }
    if (bio !== undefined && (bio === null || bio.trim().length === 0)) {
      return NextResponse.json({ error: 'Bio cannot be empty' }, { status: 400 })
    }

    if (providerId) {
      const provider = await prisma.provider.findFirst({
        where: { id: providerId, creatorId: session.user.id },
      })
      if (!provider) {
        return NextResponse.json({ error: 'Provider not found or access denied' }, { status: 400 })
      }
    }

    // Only touch the fields the caller actually sent. Writing
    // `providerId: providerId || null` unconditionally nulled providerId, model
    // and temperature on any partial update, so renaming a persona silently
    // unbound it from its provider and discarded its tuned model settings.
    const data: {
      name?: string
      bio?: string
      personality?: string | null
      role?: string
      tools?: string[]
      providerId?: string | null
      model?: string | null
      temperature?: number | null
    } = {}

    if (name !== undefined) data.name = name.trim()
    if (bio !== undefined) data.bio = bio.trim()
    if (personality !== undefined) data.personality = personality?.trim() || null
    if (role !== undefined) data.role = role || 'contributor'
    if (tools !== undefined) data.tools = tools
    if (providerId !== undefined) data.providerId = providerId || null
    if (model !== undefined) data.model = model || null
    if (temperature !== undefined) data.temperature = temperature ?? null

    const persona = await prisma.persona.update({
      where: { id },
      data,
      include: { provider: true },
    })

    const { provider, ...safePersona } = persona

    return NextResponse.json({
      ...safePersona,
      provider: provider ? withoutApiKey(provider) : provider,
    })
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
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const result = await getPersonaForRequest(id, session.user.id)

    if ('error' in result) {
      return NextResponse.json(
        { error: result.status === 404 ? 'Persona not found' : 'Forbidden' },
        { status: result.status }
      )
    }

    await prisma.persona.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting persona:', error)
    return NextResponse.json({ error: 'Failed to delete persona' }, { status: 500 })
  }
}
