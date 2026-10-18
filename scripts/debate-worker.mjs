#!/usr/bin/env node
/**
 * Self-hosted debate worker.
 *
 * Ticks the debate runner on an interval so debates keep advancing with no
 * browser attached. On Vercel you do not need this — a cron entry in vercel.json
 * hits the same endpoint. This script exists for self-hosted deployments and for
 * local development, where it is the easiest way to see server-side turns work.
 *
 * Usage:
 *   CRON_SECRET=<same secret as the server> npm run worker
 *
 * Environment:
 *   BASE_URL             default http://127.0.0.1:3000
 *   CRON_SECRET          required; must match the server's CRON_SECRET
 *   WORKER_INTERVAL_MS   default 3000
 *   WORKER_TURNS         turns per chat per tick, default 1 (smooth pacing)
 */
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000'
const SECRET = process.env.CRON_SECRET
const INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS || 3000)
const TURNS = process.env.WORKER_TURNS || '1'

if (!SECRET) {
  console.error('CRON_SECRET is required and must match the server.')
  process.exit(1)
}

let stopping = false
process.on('SIGINT', () => {
  stopping = true
  console.log('\nworker stopping')
})
process.on('SIGTERM', () => {
  stopping = true
})

async function tickOnce() {
  const url = `${BASE_URL}/api/debates/tick?turns=${encodeURIComponent(TURNS)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SECRET}` },
  })

  if (!res.ok) {
    console.error(`tick failed: HTTP ${res.status}`)
    return
  }

  const body = await res.json()
  if (body.claimed > 0) {
    console.log(
      `tick: claimed=${body.claimed} advanced=${body.advanced} ` +
        `stopped=${body.stopped} failed=${body.failed}`
    )
    for (const chat of body.chats || []) {
      if (chat.outcome !== 'advanced') {
        console.log(`  ${chat.chatId}: ${chat.outcome} — ${chat.error || ''}`)
      }
    }
  }
}

console.log(`debate worker -> ${BASE_URL} every ${INTERVAL_MS}ms (turns=${TURNS})`)

while (!stopping) {
  try {
    await tickOnce()
  } catch (error) {
    console.error('tick error:', error instanceof Error ? error.message : error)
  }
  await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS))
}
