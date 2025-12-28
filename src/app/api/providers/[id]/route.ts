import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cryptoService } from '@/lib/crypto'
import { LLMProviderFactory, ProviderType } from '@/lib/llm-provider'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const provider = await prisma.provider.findUnique({
      where: { id },
    })

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...provider,
      apiKey: cryptoService.maskKey(provider.apiKey),
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
    const { id } = await params
    const body = await request.json()
    const { name, provider, apiUrl, apiKey, model, temperature, isDefault } = body

    const existing = await prisma.provider.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    // Handle default toggle
    if (isDefault && !existing.isDefault) {
      await prisma.provider.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    // Encrypt new API key if provided
    const encryptedKey = apiKey
      ? (apiKey.startsWith('enc:') ? apiKey : cryptoService.encrypt(apiKey))
      : existing.apiKey

    const providerType = provider || existing.provider
    const providerInfo = providerType
      ? LLMProviderFactory.getProviderInfo(providerType as ProviderType)
      : null

    const updated = await prisma.provider.update({
      where: { id },
      data: {
        name: name || existing.name,
        provider: provider || existing.provider,
        apiUrl: apiUrl || existing.apiUrl,
        apiKey: encryptedKey,
        model: model || existing.model,
        temperature: temperature ?? existing.temperature,
        isDefault: isDefault ?? existing.isDefault,
      },
    })

    return NextResponse.json({
      ...updated,
      apiKey: cryptoService.maskKey(updated.apiKey),
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
    const { id } = await params

    // Check if provider is in use
    const personas = await prisma.persona.findMany({
      where: { providerId: id },
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
