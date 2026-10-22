'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, PageHeader } from '@/components/ui/EmptyState'
import { formatDate } from '@/components/workspaces/format'
import { WorkspaceInsights } from '@/lib/workspace-insights'

type Tone = 'success' | 'accent' | 'danger' | 'neutral' | 'outline'

const DEBT_ORDER = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
const DEBT_TONES: Record<string, Tone> = {
  LOW: 'success',
  MEDIUM: 'neutral',
  HIGH: 'accent',
  CRITICAL: 'danger',
}

const OUTCOME_ORDER = ['VALIDATED', 'PARTIAL', 'PENDING', 'INVALIDATED', 'NOT_RECORDED']
const OUTCOME_TONES: Record<string, Tone> = {
  VALIDATED: 'success',
  PARTIAL: 'accent',
  PENDING: 'neutral',
  INVALIDATED: 'danger',
  NOT_RECORDED: 'outline',
}

const EVIDENCE_ORDER = ['VERIFIED', 'INFERRED', 'OPEN', 'DISPUTED', 'UNSUPPORTED']
const EVIDENCE_TONES: Record<string, Tone> = {
  VERIFIED: 'success',
  INFERRED: 'accent',
  OPEN: 'neutral',
  DISPUTED: 'danger',
  UNSUPPORTED: 'danger',
}

function Distribution({
  title,
  counts,
  order,
  tones,
}: {
  title: string
  counts: Record<string, number>
  order: readonly string[]
  tones: Record<string, Tone>
}) {
  const total = order.reduce((sum, key) => sum + (counts[key] ?? 0), 0)

  return (
    <Card className="space-y-3">
      <p className="eyebrow">{title}</p>
      <ul className="space-y-2.5">
        {order.map((key) => {
          const count = counts[key] ?? 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          const bar =
            tones[key] === 'success'
              ? 'bg-success'
              : tones[key] === 'danger'
                ? 'bg-danger'
                : tones[key] === 'accent'
                  ? 'bg-accent'
                  : 'bg-line-strong'

          return (
            <li key={key}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-mono uppercase tracking-[0.08em] text-muted">
                  {key.replaceAll('_', ' ')}
                </span>
                <span className="text-subtle">{count}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export default function InsightsPage() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [insights, setInsights] = useState<WorkspaceInsights | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  const loading = authLoading || (isAuthenticated && !loaded)

  useEffect(() => {
    if (authLoading || !isAuthenticated || !id) return

    let cancelled = false

    const loadInsights = async () => {
      setLoaded(false)
      setError('')
      setNotFound(false)

      try {
        const res = await fetch(`/api/workspaces/${id}/insights`, { cache: 'no-store' })
        const data = await res.json().catch(() => null)

        if (cancelled) return

        if (res.status === 404) {
          setNotFound(true)
          return
        }

        if (!res.ok) {
          setError(data?.error || 'Could not load workspace insights.')
          return
        }

        setInsights(data as WorkspaceInsights)
      } catch (err) {
        console.error('Failed to load insights', err)
        if (!cancelled) setError('Could not load workspace insights.')
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }

    loadInsights()
    return () => {
      cancelled = true
    }
  }, [authLoading, id, isAuthenticated])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-14">
        <p className="py-20 text-center font-mono text-xs uppercase tracking-[0.14em] text-subtle">
          Loading…
        </p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-14">
        <EmptyState
          title="Sign in to view insights"
          description="Workspace health is private to its members."
          action={
            <Link href={`/login?callbackUrl=${encodeURIComponent(`/workspaces/${id}/insights`)}`}>
              <Button variant="primary">Sign in</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (notFound || !insights) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-14">
        <EmptyState
          title={notFound ? 'Workspace not found' : 'Could not load insights'}
          description={error || 'You may not be a member of this workspace.'}
          action={
            <Link href={`/workspaces/${id}`}>
              <Button variant="secondary">Back to workspace</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <div className="mb-6">
        <Link
          href={`/workspaces/${id}`}
          className="font-mono text-xs uppercase tracking-[0.12em] text-subtle transition-colors hover:text-accent"
        >
          ← Back to workspace
        </Link>
      </div>

      <PageHeader
        eyebrow="Decision health"
        title="Insights"
        lede="Portfolio-level view of decision debt, evidence coverage, outcomes, and revisit obligations."
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Decisions', value: insights.totalDecisions },
          { label: 'Average debt', value: `${insights.averageDebt}/100` },
          { label: 'Evidence coverage', value: `${insights.evidenceCoverage}%` },
          { label: 'Overdue revisits', value: insights.overdueRevisits },
        ].map((stat) => (
          <Card key={stat.label} className="py-4">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-subtle">
              {stat.label}
            </p>
            <p className="mt-1 font-display text-2xl text-text">{stat.value}</p>
          </Card>
        ))}
      </div>

      {insights.totalDecisions === 0 ? (
        <EmptyState
          title="No decisions to analyze"
          description="Add decisions and evidence to populate debt, outcome, and coverage insights."
          action={
            <Link href={`/workspaces/${id}`}>
              <Button variant="primary">Open workspace</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Distribution
              title="Decision debt"
              counts={insights.debtBands}
              order={DEBT_ORDER}
              tones={DEBT_TONES}
            />
            <Distribution
              title="Outcomes"
              counts={insights.outcomes}
              order={OUTCOME_ORDER}
              tones={OUTCOME_TONES}
            />
            <Distribution
              title="Evidence status"
              counts={insights.evidenceStatuses}
              order={EVIDENCE_ORDER}
              tones={EVIDENCE_TONES}
            />
            <Card className="space-y-3">
              <p className="eyebrow">Coverage and sources</p>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Evidence items</dt>
                  <dd className="text-text">{insights.totalEvidence}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Approvals</dt>
                  <dd className="text-text">{insights.totalApprovals}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">No evidence</dt>
                  <dd className="text-text">{insights.decisionsWithoutEvidence}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">No approval</dt>
                  <dd className="text-text">{insights.decisionsWithoutApproval}</dd>
                </div>
              </dl>
              <div className="border-t border-line pt-3">
                <p className="eyebrow mb-2">Ingested sources</p>
                <p className="font-mono text-xs text-muted">
                  {insights.sourceTotals.files} files · {insights.sourceTotals.commits} commits ·{' '}
                  {insights.sourceTotals.pullRequests}{' '}
                  {insights.sourceTotals.pullRequests === 1 ? 'PR' : 'PRs'} ·{' '}
                  {insights.sourceTotals.issues}{' '}
                  {insights.sourceTotals.issues === 1 ? 'issue' : 'issues'}
                </p>
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section aria-labelledby="top-debt-heading">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2
                  id="top-debt-heading"
                  className="font-mono text-xs uppercase tracking-[0.14em] text-subtle"
                >
                  Highest-debt decisions
                </h2>
                <span className="font-mono text-xs text-subtle">
                  {insights.topDebtDecisions.length}
                </span>
              </div>
              <ul className="space-y-2">
                {insights.topDebtDecisions.map((decision) => (
                  <li key={decision.id}>
                    <Link
                      href={`/decisions/${decision.id}`}
                      className="flex items-center justify-between gap-3 rounded-[4px] border border-line bg-surface p-4 transition-colors hover:border-accent-line"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-text">{decision.title}</p>
                        <p className="mt-1 font-mono text-xs text-subtle">
                          {decision.status} · {decision.impact}
                          {decision.outcome ? ` · ${decision.outcome}` : ''}
                        </p>
                      </div>
                      <Badge
                        tone={
                          decision.debtScore >= 70
                            ? 'danger'
                            : decision.debtScore >= 45
                              ? 'accent'
                              : decision.debtScore >= 20
                                ? 'neutral'
                                : 'success'
                        }
                      >
                        Debt {decision.debtScore}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="overdue-heading">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2
                  id="overdue-heading"
                  className="font-mono text-xs uppercase tracking-[0.14em] text-subtle"
                >
                  Overdue revisits
                </h2>
                <span className="font-mono text-xs text-subtle">{insights.overdue.length}</span>
              </div>
              {insights.overdue.length === 0 ? (
                <Card>
                  <p className="text-sm text-muted">No overdue revisits.</p>
                </Card>
              ) : (
                <ul className="space-y-2">
                  {insights.overdue.map((decision) => (
                    <li key={decision.id}>
                      <Link
                        href={`/decisions/${decision.id}`}
                        className="flex items-center justify-between gap-3 rounded-[4px] border border-line bg-surface p-4 transition-colors hover:border-accent-line"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-text">{decision.title}</p>
                          <p className="mt-1 font-mono text-xs text-subtle">
                            Revisit {formatDate(decision.revisitAt)}
                          </p>
                        </div>
                        <Badge tone="danger">Debt {decision.debtScore}</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
