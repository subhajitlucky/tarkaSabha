import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cryptoService } from '@/lib/crypto'
import { LLMProviderFactory, ProviderType } from '@/lib/llm-provider'
import { auth } from '@/auth'
import { validateProviderApiUrl } from '@/lib/api-url'

function maskProviderKey(apiKey: string): string {
  try {
    return cryptoService.maskKey(cryptoService.decrypt(apiKey))
  } catch {
    return '********'
  }
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
    const provider = await prisma.provider.findUnique({
      where: { id },
    })

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    if (provider.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      ...provider,
      apiKey: maskProviderKey(provider.apiKey),
    })
  } catch (error) {
    console.error('Error fetching provider:', error)
    return NextResponse.json({ error: 'Failed to fetch provider' }, { status: 500 })
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
    const body = await request.json()
    const { name, provider, apiUrl, apiKey, model, temperature, isDefault } = body

    const existing = await prisma.provider.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    if (existing.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (name !== undefined && typeof name !== 'string') {
      return NextResponse.json({ error: 'Name must be a string' }, { status: 400 })
    }
    if (provider !== undefined && typeof provider !== 'string') {
      return NextResponse.json({ error: 'Provider must be a string' }, { status: 400 })
    }
    if (typeof provider === 'string' && !LLMProviderFactory.getProviderInfo(provider as ProviderType)) {
      return NextResponse.json({ error: 'Unknown provider type' }, { status: 400 })
    }
    if (model !== undefined && model !== null && typeof model !== 'string') {
      return NextResponse.json({ error: 'Model must be a string' }, { status: 400 })
    }
    if (temperature !== undefined && temperature !== null && typeof temperature !== 'number') {
      return NextResponse.json({ error: 'Temperature must be a number' }, { status: 400 })
    }
    if (apiKey !== undefined && apiKey !== null && typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'API key must be a string' }, { status: 400 })
    }
    if (isDefault !== undefined && isDefault !== null && typeof isDefault !== 'boolean') {
      return NextResponse.json({ error: 'isDefault must be a boolean' }, { status: 400 })
    }

    let nextApiUrl = existing.apiUrl
    if (apiUrl !== undefined && apiUrl !== null && apiUrl !== '') {
      if (typeof apiUrl !== 'string') {
        return NextResponse.json({ error: 'API URL must be a string' }, { status: 400 })
      }
      const urlValidation = validateProviderApiUrl(apiUrl)
      if (!urlValidation.valid) {
        return NextResponse.json({ error: urlValidation.error }, { status: 400 })
      }
      nextApiUrl = apiUrl.trim()
    }

    // Handle default toggle, scoped to this user's providers
    if (isDefault && !existing.isDefault) {
      await prisma.provider.updateMany({
        where: { isDefault: true, creatorId: session.user.id },
        data: { isDefault: false },
      })
    }

    // API keys from the client are always treated as plaintext.
    // A masked value means the client wants to keep the existing key.
    let encryptedKey = existing.apiKey
    if (typeof apiKey === 'string' && apiKey !== '') {
      encryptedKey = apiKey.includes('*')
        ? existing.apiKey
        : cryptoService.encrypt(apiKey)
    }

    const updated = await prisma.provider.update({
      where: { id },
      data: {
        name: name || existing.name,
        provider: provider || existing.provider,
        apiUrl: nextApiUrl,
        apiKey: encryptedKey,
        model: model || existing.model,
        temperature: temperature ?? existing.temperature,
        isDefault: isDefault ?? existing.isDefault,
      },
    })

    return NextResponse.json({
      ...updated,
      apiKey: maskProviderKey(updated.apiKey),
    })
  } catch (error) {
    console.error('Error updating provider:', error)
    return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 })
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

    const existing = await prisma.provider.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    if (existing.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if provider is in use by this user's personas
    const personas = await prisma.persona.findMany({
      where: { providerId: id, creatorId: session.user.id },
    })

    if (personas.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete provider with active personas',
          personasCount: personas.length,
        },
        { status: 400 }
      )
    }

    await prisma.provider.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting provider:', error)
    return NextResponse.json({ error: 'Failed to delete provider' }, { status: 500 })
  }
}
