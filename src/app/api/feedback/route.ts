import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { rateLimitService } from '@/lib/rate-limit'
import type { Prisma } from '@/generated/prisma/client'

const MAX_MESSAGE_LENGTH = 2000
const MAX_NAME_LENGTH = 100
const MAX_EMAIL_LENGTH = 254

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    const body = await req.json()
    const { message, type, name, email } = body

    if (typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must be at most ${MAX_MESSAGE_LENGTH} characters` },
        { status: 400 }
      )
    }
    if (type !== undefined && type !== null && typeof type !== 'string') {
      return NextResponse.json({ error: 'Type must be a string' }, { status: 400 })
    }
    if (name !== undefined && name !== null && typeof name !== 'string') {
      return NextResponse.json({ error: 'Name must be a string' }, { status: 400 })
    }
    if (typeof name === 'string' && name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Name must be at most ${MAX_NAME_LENGTH} characters` },
        { status: 400 }
      )
    }
    if (email !== undefined && email !== null && typeof email !== 'string') {
      return NextResponse.json({ error: 'Email must be a string' }, { status: 400 })
    }
    if (typeof email === 'string' && email.trim().length > 0) {
      if (email.length > MAX_EMAIL_LENGTH) {
        return NextResponse.json(
          { error: `Email must be at most ${MAX_EMAIL_LENGTH} characters` },
          { status: 400 }
        )
      }
      if (!isValidEmail(email.trim())) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
      }
    }

    const ip = getClientIp(req)
    const rateLimit = await rateLimitService.limitFeedback(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many feedback submissions. Please try again later.' },
        { status: 429 }
      )
    }

    const feedback = await prisma.feedback.create({
      data: {
        message: message.trim(),
        type: type || 'general',
        name: name || session?.user?.name,
        email: email || session?.user?.email,
        userId: session?.user?.id,
      },
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Error creating feedback:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminEmail = process.env.ADMIN_EMAIL
    const userEmail = session.user.email
    const userId = session.user.id

    // Check if user is admin
    const isAdmin = adminEmail && userEmail && 
                    userEmail.toLowerCase().trim() === adminEmail.toLowerCase().trim()

    // If admin, fetch all feedback. If not, fetch only their own.
    const where: Prisma.FeedbackWhereInput = {}
    if (!isAdmin) {
      where.OR = []
      if (userId) where.OR.push({ userId })
      if (userEmail) where.OR.push({ email: userEmail })
      
      if (where.OR.length === 0) {
        return NextResponse.json([])
      }
    }

    const feedback = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { 
        user: { 
          select: { 
            name: true, 
            email: true,
            image: true
          } 
        } 
      }
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
