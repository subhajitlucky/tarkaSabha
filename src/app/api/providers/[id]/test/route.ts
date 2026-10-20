import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { cryptoService } from '@/lib/crypto'
import { getLLMResponse, LLMError, ProviderType } from '@/lib/llm-provider'
import { withTimeout } from '@/lib/llm-protection'

export const maxDuration = 30

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const provider = await prisma.provider.findUnique({ where: { id } })

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }
    if (provider.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const started = Date.now()
    const response = await withTimeout(
      getLLMResponse(
        cryptoService.decrypt(provider.apiKey),
        provider.provider as ProviderType,
        provider.model,
        [{ role: 'user', content: 'Reply with exactly one word: ready' }],
        { apiUrl: provider.apiUrl, temperature: 0, maxTokens: 32 }
      ),
      15_000,
      'The provider did not answer within 15 seconds.'
    )

    return NextResponse.json({
      ok: true,
      model: provider.model,
      latencyMs: Date.now() - started,
      sample: response.content.trim().slice(0, 120),
    })
  } catch (error) {
    if (error instanceof LLMError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Provider test failed:', error)
    return NextResponse.json({ error: 'The provider test failed' }, { status: 500 })
  }
}
