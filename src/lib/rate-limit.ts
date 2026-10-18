import crypto from 'crypto'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from './prisma'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  limit: number
}

interface RateLimitRow {
  requests: number
  limit: number
  resetAt: Date
}

export class RateLimitService {
  private static instance: RateLimitService

  private constructor() {}

  static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService()
    }
    return RateLimitService.instance
  }

  /**
   * Atomically consume one request for a key, resetting the window when needed.
   * The allow/deny decision and the counter update happen in a single SQL statement
   * so concurrent requests cannot overshoot the configured limit.
   */
  private async consume(
    key: string,
    limit: number,
    resetAt: Date
  ): Promise<RateLimitResult> {
    try {
      const rows = await prisma.$queryRaw<RateLimitRow[]>(Prisma.sql`
        INSERT INTO "RateLimit" ("id", "key", "requests", "limit", "resetAt", "createdAt", "updatedAt")
        VALUES (${crypto.randomUUID()}, ${key}, 1, ${limit}, ${resetAt}, NOW(), NOW())
        ON CONFLICT ("key") DO UPDATE SET
          "requests" = CASE
            WHEN "RateLimit"."resetAt" <= NOW() THEN 1
            ELSE "RateLimit"."requests" + 1
          END,
          "limit" = CASE
            WHEN "RateLimit"."resetAt" <= NOW() THEN ${limit}
            ELSE "RateLimit"."limit"
          END,
          "resetAt" = CASE
            WHEN "RateLimit"."resetAt" <= NOW() THEN ${resetAt}
            ELSE "RateLimit"."resetAt"
          END,
          "updatedAt" = NOW()
        RETURNING "requests", "limit", "resetAt"
      `)

      const row = rows[0]
      if (!row) {
        return { allowed: false, remaining: 0, resetAt, limit }
      }

      return {
        allowed: row.requests <= row.limit,
        remaining: Math.max(0, row.limit - row.requests),
        resetAt: row.resetAt,
        limit: row.limit,
      }
    } catch (error) {
      console.error('Rate limit check failed:', error)
      return { allowed: false, remaining: 0, resetAt, limit }
    }
  }

  /**
   * Check and increment rate limit for a provider
   * Returns whether the request is allowed
   */
  async checkLimit(
    providerId: string,
    limit: number = 100
  ): Promise<RateLimitResult> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const key = `${providerId}:${today.toISOString().split('T')[0]}`

    return this.consume(key, limit, tomorrow)
  }

  /**
   * Check and increment the feedback rate limit for a client IP (5 per hour)
   */
  async limitFeedback(ip: string, limit: number = 5): Promise<RateLimitResult> {
    const hourStart = new Date()
    hourStart.setMinutes(0, 0, 0)
    const nextHour = new Date(hourStart.getTime() + 60 * 60 * 1000)

    const key = `feedback:${ip}:${hourStart.toISOString().slice(0, 13)}`

    return this.consume(key, limit, nextHour)
  }

  /**
   * Get current usage for a provider
   */
  async getUsage(providerId: string): Promise<{
    used: number
    limit: number
    remaining: number
    resetAt: Date | null
  }> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const key = `${providerId}:${today.toISOString().split('T')[0]}`

    const record = await prisma.rateLimit.findUnique({
      where: { key },
    })

    if (!record) {
      return {
        used: 0,
        limit: 100,
        remaining: 100,
        resetAt: null,
      }
    }

    return {
      used: record.requests,
      limit: record.limit,
      remaining: record.limit - record.requests,
      resetAt: record.resetAt,
    }
  }

  /**
   * Set custom rate limit for a provider
   */
  async setLimit(providerId: string, limit: number): Promise<void> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const key = `${providerId}:${today.toISOString().split('T')[0]}`

    await prisma.rateLimit.upsert({
      where: { key },
      update: { limit },
      create: {
        key,
        requests: 0,
        limit,
        resetAt: tomorrow,
      },
    })
  }

  /**
   * Reset rate limit for a provider (admin only)
   */
  async resetLimit(providerId: string): Promise<void> {
    await prisma.rateLimit.deleteMany({
      where: {
        key: { startsWith: `${providerId}:` },
      },
    })
  }
}

export const rateLimitService = RateLimitService.getInstance()
