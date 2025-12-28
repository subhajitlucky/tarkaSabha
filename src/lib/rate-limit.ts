import { prisma } from './prisma'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  limit: number
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

    // Try to find existing record
    let record = await prisma.rateLimit.findUnique({
      where: { key },
    })

    if (!record) {
      // Create new record
      record = await prisma.rateLimit.create({
        data: {
          key,
          requests: 1,
          limit,
          resetAt: tomorrow,
        },
      })
      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: tomorrow,
        limit,
      }
    }

    // Check if limit exceeded
    if (record.requests >= record.limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: record.resetAt,
        limit: record.limit,
      }
    }

    // Increment counter
    await prisma.rateLimit.update({
      where: { key },
      data: {
        requests: { increment: 1 },
      },
    })

    return {
      allowed: true,
      remaining: record.limit - record.requests - 1,
      resetAt: record.resetAt,
      limit: record.limit,
    }
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
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const key = `${providerId}:${today.toISOString().split('T')[0]}`

    await prisma.rateLimit.deleteMany({
      where: {
        key: { startsWith: providerId },
      },
    })
  }
}

export const rateLimitService = RateLimitService.getInstance()
