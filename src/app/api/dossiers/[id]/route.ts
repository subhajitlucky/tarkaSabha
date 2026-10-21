import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { isWorkspaceRole } from '@/lib/workspaces'

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

    const dossier = await prisma.workspaceDossier.findUnique({
      where: { id },
      select: {
        id: true,
        workspaceId: true,
        version: true,
        status: true,
        content: true,
        contentHash: true,
        createdAt: true,
        publishedAt: true,
        createdBy: { select: { name: true, email: true } },
        workspace: {
          select: {
            name: true,
            memberships: {
              where: { userId: session.user.id },
              select: { role: true },
            },
          },
        },
      },
    })

    const role = dossier?.workspace.memberships[0]?.role
    if (!dossier || !role || !isWorkspaceRole(role)) {
      return NextResponse.json({ error: 'Dossier not found' }, { status: 404 })
    }

    const download = new URL(request.url).searchParams.get('download') === '1'
    if (download) {
      return new NextResponse(dossier.content, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="dossier-${dossier.workspaceId}-v${dossier.version}.md"`,
          'Cache-Control': 'private, no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      })
    }

    return NextResponse.json({
      id: dossier.id,
      workspaceId: dossier.workspaceId,
      workspaceName: dossier.workspace.name,
      version: dossier.version,
      status: dossier.status,
      content: dossier.content,
      contentHash: dossier.contentHash,
      createdAt: dossier.createdAt,
      publishedAt: dossier.publishedAt,
      generatedBy: dossier.createdBy,
      role,
    })
  } catch (error) {
    console.error('Error fetching workspace dossier:', error)
    return NextResponse.json({ error: 'Failed to fetch dossier' }, { status: 500 })
  }
}
