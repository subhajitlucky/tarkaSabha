import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sha256 } from '@/lib/decision-report'
import { AcceptInviteButton } from '@/components/workspaces/AcceptInviteButton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/components/workspaces/format'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Workspace invitation — Tarka Sabha',
  robots: { index: false, follow: false },
}

function isExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() <= Date.now()
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const session = await auth()

  const invite = await prisma.workspaceInvite.findUnique({
    where: { tokenHash: sha256(token) },
    select: {
      email: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
      revokedAt: true,
      workspaceId: true,
      workspace: { select: { name: true, description: true } },
      createdBy: { select: { name: true, email: true } },
    },
  })

  const unavailable =
    !invite ||
    invite.revokedAt ||
    isExpired(invite.expiresAt) ||
    (invite.acceptedAt !== null &&
      (!session?.user?.email ||
        session.user.email.toLowerCase() !== invite.email.toLowerCase()))

  if (unavailable) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16">
        <EmptyState
          title="This invitation is no longer available"
          description="It may have expired, been revoked, or already been accepted. Ask the workspace owner for a new link."
          action={
            <Link href="/">
              <Button variant="secondary">Go to Tarka Sabha</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const inviter = invite.createdBy.name || invite.createdBy.email || 'A workspace owner'
  const signedInEmail = session?.user?.email
  const emailMatches =
    signedInEmail?.toLowerCase() === invite.email.toLowerCase()
  const alreadyAccepted = Boolean(invite.acceptedAt) && emailMatches

  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <p className="eyebrow">Workspace invitation</p>
      <h1 className="mt-2 font-display text-3xl leading-tight text-text sm:text-4xl">
        Join {invite.workspace.name}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {inviter} invited <span className="text-text">{invite.email}</span> to review decisions
        in this workspace.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="accent">{invite.role}</Badge>
        <Badge tone="outline">Expires {formatDate(invite.expiresAt)}</Badge>
      </div>

      <Card className="mt-8 space-y-4">
        {invite.workspace.description && (
          <p className="text-sm leading-relaxed text-muted">{invite.workspace.description}</p>
        )}

        {!session?.user ? (
          <>
            <p className="text-sm leading-relaxed text-text">
              Sign in with {invite.email} to accept this invitation.
            </p>
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}
              className="block"
            >
              <Button variant="primary" className="w-full">
                Sign in to join
              </Button>
            </Link>
          </>
        ) : alreadyAccepted ? (
          <>
            <p className="text-sm leading-relaxed text-text">
              You have already joined this workspace.
            </p>
            <Link href={`/workspaces/${invite.workspaceId}`} className="block">
              <Button variant="primary" className="w-full">
                Open workspace
              </Button>
            </Link>
          </>
        ) : emailMatches ? (
          <>
            <p className="text-sm leading-relaxed text-muted">
              You are signed in as <span className="text-text">{signedInEmail}</span>. Joining
              gives you the {invite.role.toLowerCase()} role in this workspace.
            </p>
            <AcceptInviteButton token={token} workspaceId={invite.workspaceId} />
          </>
        ) : (
          <>
            <p role="alert" className="text-sm leading-relaxed text-danger">
              This invitation was sent to {invite.email}. You are signed in as{' '}
              {signedInEmail || 'another account'}.
            </p>
            <p className="text-sm leading-relaxed text-muted">
              Sign out from the navigation bar, then sign in with the invited address.
            </p>
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}
              className="block"
            >
              <Button variant="secondary" className="w-full">
                Go to sign in
              </Button>
            </Link>
          </>
        )}
      </Card>
    </div>
  )
}
