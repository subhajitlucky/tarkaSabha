import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import {
  DOSSIER_EXPORT_SCHEMA,
  signDossierExport,
} from '@/lib/dossier-signature'
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
        content: true,
        contentHash: true,
        createdAt: true,
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

    const signingKey = process.env.EXPORT_SIGNING_KEY
    if (!signingKey) {
      return NextResponse.json(
        {
          error:
            'Signed export is not configured. Set EXPORT_SIGNING_KEY to enable it.',
        },
        { status: 503 }
      )
    }

    const signable = {
      id: dossier.id,
      workspaceId: dossier.workspaceId,
      workspaceName: dossier.workspace.name,
      version: dossier.version,
      contentHash: dossier.contentHash,
      createdAt: dossier.createdAt.toISOString(),
      content: dossier.content,
    }
    const signature = signDossierExport(signable, signingKey)

    const body = {
      schema: DOSSIER_EXPORT_SCHEMA,
      exportedAt: new Date().toISOString(),
      dossier: {
        id: signable.id,
        workspaceId: signable.workspaceId,
        workspaceName: signable.workspaceName,
        version: signable.version,
        contentHash: signable.contentHash,
        createdAt: signable.createdAt,
      },
      content: signable.content,
      signature,
      verification: {
        canonical:
          'schema\nid\nworkspaceId\nworkspaceName\nversion\ncontentHash\ncreatedAt\ncontent',
        note: 'Recompute HMAC-SHA256 over the canonical fields using the shared export key. The key id identifies the key without exposing it.',
      },
    }

    return new NextResponse(JSON.stringify(body, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="dossier-${dossier.workspaceId}-v${dossier.version}-signed.json"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Error exporting signed dossier:', error)
    return NextResponse.json({ error: 'Failed to export dossier' }, { status: 500 })
  }
}
