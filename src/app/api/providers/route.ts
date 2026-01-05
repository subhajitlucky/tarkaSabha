import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cryptoService } from '@/lib/crypto'
import { LLMProviderFactory, ProviderType } from '@/lib/llm-provider'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const providers = await prisma.provider.findMany({
      where: { creatorId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        provider: true,
        apiUrl: true,
        model: true,
        temperature: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
        // Explicitly exclude apiKey
      }
    })

    // Add a placeholder for apiKey so the frontend knows it exists
    const maskedProviders = providers.map(p => ({
      ...p,
      apiKey: '********',
    }))

    return NextResponse.json(maskedProviders)
  } catch (error) {
    console.error('Error fetching providers:', error)
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // If setting as default, unset other defaults for THIS user
    if (isDefault) {
      await prisma.provider.updateMany({
        where: { 
          creatorId: session.user.id,
          isDefault: true 
        },
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
        creatorId: session.user.id,
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
