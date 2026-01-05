import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await auth()
    const body = await req.json()
    const { message, type, name, email } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const feedback = await prisma.feedback.create({
      data: {
        message,
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

export async function GET(req: Request) {
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
    const where: any = {}
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
