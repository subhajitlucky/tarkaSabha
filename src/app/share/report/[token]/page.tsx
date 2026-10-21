import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { sha256 } from '@/lib/decision-report'
import { redactReportContent } from '@/lib/report-share'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { MarkdownDocument } from '@/components/reports/MarkdownDocument'
import { formatDate } from '@/components/workspaces/format'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Shared decision evidence report — Tarka Sabha',
  robots: { index: false, follow: false },
}

function isExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() <= Date.now()
}

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const tokenHash = sha256(token)

  const share = await prisma.reportShare.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      expiresAt: true,
      revokedAt: true,
      redactSources: true,
      viewCount: true,
      report: {
        select: {
          version: true,
          status: true,
          content: true,
          contentHash: true,
          createdAt: true,
          decision: {
            select: {
              title: true,
              workspace: { select: { name: true } },
            },
          },
        },
      },
    },
  })

  if (!share || share.revokedAt || isExpired(share.expiresAt) || !share.report.content) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16">
        <EmptyState
          title="This report link is unavailable"
          description="It may have expired or been revoked by the workspace. Ask the sender for a new link."
          action={
            <Link href="/">
              <Button variant="secondary">Go to Tarka Sabha</Button>
            </Link>
          }
        />
      </div>
    )
  }

  await prisma.reportShare.update({
    where: { id: share.id },
    data: {
      viewCount: { increment: 1 },
      lastViewedAt: new Date(),
    },
  })

  const content = share.redactSources
    ? redactReportContent(share.report.content)
    : share.report.content

  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-[3px] border border-accent-line bg-accent-soft font-display text-sm text-accent"
          >
            त
          </span>
          <span className="font-display text-[1.0625rem] tracking-tight text-text">
            Tarka Sabha
          </span>
        </Link>
        <Badge tone="accent">Shared evidence report</Badge>
      </div>

      <header className="mb-8">
        <p className="eyebrow">Decision evidence report</p>
        <h1 className="mt-2 text-3xl leading-tight text-text sm:text-4xl">
          {share.report.decision.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {share.report.decision.workspace.name}
          <span className="mx-2">·</span>
          Version {share.report.version}
          <span className="mx-2">·</span>
          Generated {formatDate(share.report.createdAt)}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone={share.report.status === 'PUBLISHED' ? 'success' : 'neutral'}>
            {share.report.status}
          </Badge>
          {share.redactSources && <Badge tone="outline">Sources redacted</Badge>}
          <Badge tone="outline">Expires {formatDate(share.expiresAt)}</Badge>
        </div>

        <span className="draw-rule mt-6 block h-px bg-line" />
      </header>

      <Card className="p-6 sm:p-9">
        <MarkdownDocument content={content} />
      </Card>

      <div className="mt-6 space-y-1 text-xs leading-relaxed text-subtle">
        <p>
          Shared via Tarka Sabha. This link expires on {formatDate(share.expiresAt)} and can be
          revoked by the workspace.
        </p>
        {share.report.contentHash && (
          <p className="break-all font-mono">
            Report SHA-256: {share.redactSources ? '[redacted]' : share.report.contentHash}
          </p>
        )}
      </div>
    </div>
  )
}
