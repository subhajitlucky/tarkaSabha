import { NextRequest, NextResponse } from 'next/server'
import {
  DEFAULT_TICK_BATCH,
  DEFAULT_TICK_BUDGET_MS,
  tick,
} from '@/lib/debate-runner'

// A tick may run several turns, so give it the full function budget.
export const maxDuration = 60

/**
 * Shared-secret guard. Vercel Cron sends `Authorization: Bearer $CRON_SECRET`
 * automatically when CRON_SECRET is set, and a self-hosted worker sends the same
 * header. Without the secret configured this endpoint fails closed.
 */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

function clampParam(raw: string | null, min: number, max: number, fallback: number): number {
  if (raw === null) return fallback
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(parsed)))
}

async function handle(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const params = new URL(request.url).searchParams

    const result = await tick({
      maxChats: clampParam(params.get('chats'), 1, 25, DEFAULT_TICK_BATCH),
      // Default to several turns per chat so a once-a-minute cron makes real
      // progress. The self-hosted worker passes turns=1 and relies on its own
      // tick interval for pacing.
      maxTurnsPerChat: clampParam(params.get('turns'), 1, 20, 5),
      budgetMs: clampParam(params.get('budgetMs'), 1_000, 55_000, DEFAULT_TICK_BUDGET_MS),
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error running debate tick:', error)
    return NextResponse.json({ error: 'Tick failed' }, { status: 500 })
  }
}

// Vercel Cron issues GET requests; a self-hosted worker uses POST.
export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
