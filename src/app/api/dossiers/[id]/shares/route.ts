import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import {
  DEFAULT_SHARE_DAYS,
  MAX_SHARE_DAYS,
  MIN_SHARE_DAYS,
  createShareToken,
} from '@/lib/report-share'
import { canEditDecisions, isWorkspaceRole } from '@/lib/workspaces'

async function getDossierAccess(dossierId: string, userId: string) {
  const dossier = await prisma.workspaceDossier.findUnique({
    where: { id: dossierId },
    select: {
      id: true,
      workspace: {
        select: {
          memberships: {
            where: { userId },
            select: { role: true },
          },
        },
      },
    },
  })

  const role = dossier?.workspace.memberships[0]?.role
  if (!dossier || !role || !isWorkspaceRole(role)) return null

  return { dossierId: dossier.id, role }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const access = await getDossierAccess(id, session.user.id)
    if (!access) {
      return NextResponse.json({ error: 'Dossier not found' }, { status: 404 })
    }
    if (!canEditDecisions(access.role)) {
      return NextResponse.json(
        { error: 'Viewers cannot manage dossier shares' },
        { status: 403 }
      )
    }

    const shares = await prisma.dossierShare.findMany({
      where: {
        dossierId: id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        expiresAt: true,
        redactSources: true,
        viewCount: true,
        lastViewedAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json(shares)
  } catch (error) {
    console.error('Error fetching dossier shares:', error)
    return NextResponse.json({ error: 'Failed to fetch share links' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const access = await getDossierAccess(id, session.user.id)
    if (!access) {
      return NextResponse.json({ error: 'Dossier not found' }, { status: 404 })
    }
    if (!canEditDecisions(access.role)) {
      return NextResponse.json(
        { error: 'Viewers cannot create dossier shares' },
        { status: 403 }
      )
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const days = body.expiresInDays === undefined ? DEFAULT_SHARE_DAYS : body.expiresInDays
    if (
      typeof days !== 'number' ||
      !Number.isInteger(days) ||
      days < MIN_SHARE_DAYS ||
      days > MAX_SHARE_DAYS
    ) {
      return NextResponse.json(
        { error: `Expiry must be between ${MIN_SHARE_DAYS} and ${MAX_SHARE_DAYS} days` },
        { status: 400 }
      )
    }

    if (body.redactSources !== undefined && typeof body.redactSources !== 'boolean') {
      return NextResponse.json(
        { error: 'redactSources must be a boolean' },
        { status: 400 }
      )
    }

    const { token, tokenHash } = createShareToken()
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)

    const share = await prisma.dossierShare.create({
      data: {
        dossierId: id,
        createdById: session.user.id,
        tokenHash,
        expiresAt,
        redactSources: body.redactSources === true,
      },
      select: {
        id: true,
        expiresAt: true,
        redactSources: true,
        viewCount: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        ...share,
        path: `/share/dossier/${token}`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating dossier share:', error)
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
  }
}
