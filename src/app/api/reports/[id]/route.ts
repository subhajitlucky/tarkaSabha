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

    const report = await prisma.report.findUnique({
      where: { id },
      select: {
        id: true,
        version: true,
        content: true,
        decision: {
          select: {
            id: true,
            workspace: {
              select: {
                memberships: {
                  where: { userId: session.user.id },
                  select: { role: true },
                },
              },
            },
          },
        },
      },
    })

    const role = report?.decision.workspace.memberships[0]?.role
    if (!report || !role || !isWorkspaceRole(role)) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return new NextResponse(report.content ?? '', {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="decision-${report.decision.id}-v${report.version}.md"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Error downloading report:', error)
    return NextResponse.json({ error: 'Failed to download report' }, { status: 500 })
  }
}
