import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cryptoService } from '@/lib/crypto'
import { LLMProviderFactory, ProviderType } from '@/lib/llm-provider'

export async function GET() {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Mask API keys before returning
    const maskedProviders = providers.map(p => ({
      ...p,
      apiKey: cryptoService.maskKey(p.apiKey),
    }))

    return NextResponse.json(maskedProviders)
  } catch (error) {
    console.error('Error fetching providers:', error)
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, provider, apiUrl, apiKey, model, temperature, isDefault } = body

    // Validate required fields
    if (!name || !provider) {
      return NextResponse.json(
        { error: 'Name and provider type are required' },
        { status: 400 }
      )
    }

    // Get provider info for defaults
    const providerInfo = LLMProviderFactory.getProviderInfo(provider as ProviderType)

    // Validate API key if required
    if (providerInfo.requiresKey && !apiKey) {
      return NextResponse.json(
        { error: `API key is required for ${providerInfo.name}` },
        { status: 400 }
      )
    }

    // Encrypt API key
    const encryptedKey = apiKey ? cryptoService.encrypt(apiKey) : ''

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.provider.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const newProvider = await prisma.provider.create({
      data: {
        name,
        provider,
        apiUrl: apiUrl || providerInfo.defaultUrl,
        apiKey: encryptedKey,
        model: model || LLMProviderFactory.getModelsForProvider(provider as ProviderType)[0],
        temperature: temperature || 0.7,
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json({
      ...newProvider,
      apiKey: cryptoService.maskKey(newProvider.apiKey),
    })
  } catch (error) {
    console.error('Error creating provider:', error)
    return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 })
  }
}
