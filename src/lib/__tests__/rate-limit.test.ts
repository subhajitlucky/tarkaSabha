import { beforeEach, describe, expect, it, vi } from 'vitest'

const queryRawMock = vi.fn()

vi.mock('../prisma', () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => queryRawMock(...args),
  },
}))

import { rateLimitService } from '../rate-limit'

describe('RateLimitService', () => {
  beforeEach(() => {
    queryRawMock.mockReset()
  })

  it('allows a request under the limit and reports remaining', async () => {
    queryRawMock.mockResolvedValueOnce([
      { requests: 3, limit: 5, resetAt: new Date('2026-01-02T00:00:00Z') },
    ])

    const result = await rateLimitService.checkLimit('provider-1', 5)

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(2)
    expect(result.limit).toBe(5)
  })

  it('denies a request once the counter exceeds the limit', async () => {
    queryRawMock.mockResolvedValueOnce([
      { requests: 6, limit: 5, resetAt: new Date('2026-01-02T00:00:00Z') },
    ])

    const result = await rateLimitService.checkLimit('provider-1', 5)

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('fails closed when the database query throws', async () => {
    queryRawMock.mockRejectedValueOnce(new Error('connection refused'))

    const result = await rateLimitService.limitFeedback('203.0.113.10')

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('uses an hourly feedback bucket keyed by ip', async () => {
    queryRawMock.mockResolvedValueOnce([
      { requests: 1, limit: 5, resetAt: new Date('2026-01-01T11:00:00Z') },
    ])

    await rateLimitService.limitFeedback('203.0.113.10')

    const sql = queryRawMock.mock.calls[0][0]
    expect(sql.sql).toContain('INSERT INTO "RateLimit"')
    expect(
      sql.values.some(
        (value: unknown) => typeof value === 'string' && value.startsWith('feedback:203.0.113.10:')
      )
    ).toBe(true)
  })
})
