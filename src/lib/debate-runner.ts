import { Prisma } from '@/generated/prisma/client'
import { prisma } from './prisma'
import { orchestrateMessage } from './orchestrator'

/** Pacing between automatic turns within a running debate. */
export const TURN_INTERVAL_MS = 4000

/** How many due chats a single tick will pick up. */
export const DEFAULT_TICK_BATCH = 5

/**
 * Safety ceiling on turns per chat per tick. A tick is a request-scoped
 * operation, so it must always be able to finish inside the platform's function
 * timeout rather than looping until a debate completes.
 */
export const DEFAULT_MAX_TURNS_PER_CHAT = 1

/** Wall-clock budget for one tick, leaving headroom under a 60s function limit. */
export const DEFAULT_TICK_BUDGET_MS = 45_000

export type AdvanceOutcome = 'advanced' | 'stopped' | 'failed'

export interface TurnResult {
  ok: boolean
  speakerId?: string
  error?: string
}

export interface ChatAdvanceResult {
  chatId: string
  outcome: AdvanceOutcome
  speakerId?: string
  error?: string
}

export interface TickResult {
  claimed: number
  advanced: number
  stopped: number
  failed: number
  chats: ChatAdvanceResult[]
}

export interface TickOptions {
  maxChats?: number
  maxTurnsPerChat?: number
  budgetMs?: number
}

/**
 * Run exactly one debate turn, independent of scheduling state.
 *
 * Shared by the scheduled runner and the manual "next speaker" action, so both
 * paths go through the same orchestration and validation.
 */
export async function runTurn(chatId: string): Promise<TurnResult> {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { participants: { include: { persona: true }, orderBy: { sortOrder: 'asc' } } },
  })

  if (!chat) return { ok: false, error: 'Chat not found' }

  const participants = chat.participants.map((entry) => entry.persona)
  if (participants.length === 0) return { ok: false, error: 'No participants in chat' }

  const result = await orchestrateMessage(
    {
      chatId,
      topic: chat.topic,
      isAutoMode: chat.isAutoMode,
      lastSpeakerId: chat.lastSpeakerId,
      brief: chat,
    },
    '',
    false,
    participants,
    chat.creatorId
  )

  if (result.error) return { ok: false, error: result.error }
  return { ok: true, speakerId: result.speakerId }
}

/**
 * Atomically take ownership of chats that are due for a turn.
 *
 * The UPDATE both selects and claims: it pushes autoAdvanceAt forward in the
 * same statement that reads it, and FOR UPDATE SKIP LOCKED means two overlapping
 * ticks can never claim the same chat. If the process dies after claiming, the
 * chat is simply retried once the pushed-forward time arrives.
 */
export async function claimDueChats(limit: number = DEFAULT_TICK_BATCH): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    UPDATE "Chat"
    SET "autoAdvanceAt" = NOW() + (${TURN_INTERVAL_MS} * interval '1 millisecond')
    WHERE "id" IN (
      SELECT "id" FROM "Chat"
      WHERE "isAutoMode" = true
        AND "autoAdvanceAt" IS NOT NULL
        AND "autoAdvanceAt" <= NOW()
      ORDER BY "autoAdvanceAt" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING "id"
  `)

  return rows.map((row) => row.id)
}

/** Take a chat out of the running state. */
export async function stopChat(chatId: string): Promise<void> {
  await prisma.chat.update({
    where: { id: chatId },
    data: { isAutoMode: false, autoAdvanceAt: null },
  })
}

/**
 * Put a chat into the running state. `turns` bounds the run; omit it to run
 * until the debate is stopped or a turn fails.
 */
export async function startChat(chatId: string, turns?: number | null): Promise<void> {
  await prisma.chat.update({
    where: { id: chatId },
    data: {
      isAutoMode: true,
      autoAdvanceAt: new Date(),
      turnsRemaining: turns ?? null,
    },
  })
}

/**
 * Advance a scheduled chat by one turn, then reschedule it. Stops the run when a
 * turn fails so a broken provider is not retried on every subsequent tick.
 */
export async function advanceChat(chatId: string): Promise<ChatAdvanceResult> {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { isAutoMode: true, turnsRemaining: true },
  })

  if (!chat) {
    return { chatId, outcome: 'failed', error: 'Chat not found' }
  }

  if (!chat.isAutoMode) {
    return { chatId, outcome: 'stopped', error: 'Chat is not running' }
  }

  const turn = await runTurn(chatId)

  if (!turn.ok) {
    await stopChat(chatId)
    return { chatId, outcome: 'stopped', error: turn.error }
  }

  const turnsRemaining = chat.turnsRemaining === null ? null : chat.turnsRemaining - 1
  const finished = turnsRemaining !== null && turnsRemaining <= 0

  await prisma.chat.update({
    where: { id: chatId },
    data: {
      turnCount: { increment: 1 },
      turnsRemaining,
      isAutoMode: !finished,
      autoAdvanceAt: finished ? null : new Date(Date.now() + TURN_INTERVAL_MS),
    },
  })

  return { chatId, outcome: 'advanced', speakerId: turn.speakerId }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Advance every chat that is due, once per call unless maxTurnsPerChat allows
 * more. Safe to call concurrently: claiming is atomic, so overlapping ticks
 * divide the work instead of duplicating it.
 */
export async function tick(options: TickOptions = {}): Promise<TickResult> {
  const maxChats = options.maxChats ?? DEFAULT_TICK_BATCH
  const maxTurnsPerChat = Math.max(1, options.maxTurnsPerChat ?? DEFAULT_MAX_TURNS_PER_CHAT)
  const budgetMs = options.budgetMs ?? DEFAULT_TICK_BUDGET_MS
  const deadline = Date.now() + budgetMs

  const claimed = await claimDueChats(maxChats)
  const chats: ChatAdvanceResult[] = []

  for (const chatId of claimed) {
    for (let turn = 0; turn < maxTurnsPerChat; turn++) {
      if (turn > 0) {
        // Pace turns the way the old client-side loop did, but stop waiting if
        // the tick is nearly out of budget.
        if (Date.now() + TURN_INTERVAL_MS >= deadline) break
        await sleep(TURN_INTERVAL_MS)
      }

      const result = await advanceChat(chatId)
      chats.push(result)

      if (result.outcome !== 'advanced') break
      if (Date.now() >= deadline) break
    }
  }

  return {
    claimed: claimed.length,
    advanced: chats.filter((entry) => entry.outcome === 'advanced').length,
    stopped: chats.filter((entry) => entry.outcome === 'stopped').length,
    failed: chats.filter((entry) => entry.outcome === 'failed').length,
    chats,
  }
}
