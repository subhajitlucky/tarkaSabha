import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Add it to your .env file before using the database.'
    )
  }

  // Prisma 7 requires a driver adapter instead of the bundled Rust engine.
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  })
}

function getPrismaClient(): PrismaClient {
  const existing = globalForPrisma.prisma
  if (existing) return existing

  const client = createPrismaClient()
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }
  return client
}

// Constructed lazily so that merely importing this module never requires
// DATABASE_URL — Next.js evaluates route modules while building.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient()
    const value = Reflect.get(client, property, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
