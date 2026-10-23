'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { MetricCard } from '@/components/ui/DataViz'
import { EmptyState, PageHeader } from '@/components/ui/EmptyState'
import { formatDate, formatDateTime } from '@/components/workspaces/format'
import { AuditEventRecord } from '@/types'

function metadataEntries(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) return []
  return Object.entries(metadata).filter(([, value]) =>
    ['string', 'number', 'boolean'].includes(typeof value)
  )
}

export default function ActivityPage() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [events, setEvents] = useState<AuditEventRecord[]>([])
  const [loaded, setLoaded] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  const loading = authLoading || (isAuthenticated && !loaded)

  useEffect(() => {
    if (authLoading || !isAuthenticated || !id) return

    let cancelled = false

    const loadEvents = async () => {
      setLoaded(false)
      setError('')
      setNotFound(false)

      try {
        const res = await fetch(`/api/workspaces/${id}/audit`, { cache: 'no-store' })
        const data = await res.json().catch(() => null)

        if (cancelled) return

        if (res.status === 404) {
          setNotFound(true)
          return
        }

        if (!res.ok) {
          setError(data?.error || 'Could not load workspace activity.')
          return
        }

        setEvents(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Failed to load activity', err)
        if (!cancelled) setError('Could not load workspace activity.')
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }

    loadEvents()
    return () => {
      cancelled = true
    }
  }, [authLoading, id, isAuthenticated])

  if (loading) {
    return (
      <div className="mx-auto max-w-[90rem] px-5 py-14">
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
          title="Sign in to view this activity"
          description="Workspace activity is private to its members."
          action={
            <Link href={`/login?callbackUrl=${encodeURIComponent(`/workspaces/${id}/activity`)}`}>
              <Button variant="primary">Sign in</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-14">
        <EmptyState
          title="Workspace not found"
          description="You may not be a member of this workspace."
          action={
            <Link href="/workspaces">
              <Button variant="secondary">Back to workspaces</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const actorCount = new Set(
    events.map((event) => event.actor?.email || event.actor?.name || 'system')
  ).size
  const decisionCount = new Set(events.map((event) => event.decision?.id).filter(Boolean)).size
  const latest = events.reduce<string | null>((value, event) => {
    if (!value) return event.createdAt
    return new Date(event.createdAt) > new Date(value) ? event.createdAt : value
  }, null)
  const actionTone = (action: string) => {
    if (action.includes('approved') || action.includes('published')) return 'success' as const
    if (action.includes('created') || action.includes('added')) return 'info' as const
    if (action.includes('updated') || action.includes('changed')) return 'warning' as const
    return 'outline' as const
  }

  return (
    <div className="mx-auto max-w-[90rem] px-5 py-14">
      <div className="mb-6">
        <Link
          href={`/workspaces/${id}`}
          className="font-mono text-xs uppercase tracking-[0.12em] text-subtle transition-colors hover:text-accent"
        >
          ← Back to workspace
        </Link>
      </div>

      <PageHeader
        eyebrow="Audit trail"
        title="Activity"
        lede="An append-only record of workspace actions. Events are read-only and are not edited or deleted in the app."
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Events"
          value={events.length}
          detail="Append-only workspace actions"
          accent="var(--chart-1)"
        />
        <MetricCard
          label="Actors"
          value={actorCount}
          detail="People or system actions"
          accent="var(--chart-2)"
        />
        <MetricCard
          label="Decisions touched"
          value={decisionCount}
          detail="Linked decision records"
          accent="var(--chart-3)"
        />
        <MetricCard
          label="Latest activity"
          value={latest ? formatDate(latest) : '—'}
          detail={latest ? formatDateTime(latest) : 'No activity recorded'}
          accent="var(--chart-4)"
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-[4px] border border-line bg-surface p-5 text-sm text-danger">
          {error}
        </p>
      ) : events.length === 0 ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <EmptyState
            title="No activity recorded yet"
            description="Actions such as decisions, evidence, approvals, reports, and dossiers will appear here."
          />
          <Card>
            <p className="eyebrow">What gets recorded</p>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
              <li>Workspace, member, and role changes.</li>
              <li>Decisions, evidence, approvals, and outcomes.</li>
              <li>Source ingestion, dossier generation, and share links.</li>
            </ul>
            <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-subtle">
              The audit trail is append-only. It is the history of the record, not a reversible
              edit log.
            </p>
          </Card>
        </div>
      ) : (
        <Card flush className="overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line p-5">
            <div>
              <p className="eyebrow">Event register</p>
              <h2 className="mt-2 font-display text-2xl text-text">What happened</h2>
            </div>
            <span className="font-mono text-xs text-subtle">{events.length} events</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line font-mono text-[0.6rem] uppercase tracking-[0.14em] text-subtle">
                  <th className="px-5 py-3 font-normal">Event</th>
                  <th className="px-3 py-3 font-normal">Action</th>
                  <th className="px-3 py-3 font-normal">Actor</th>
                  <th className="px-3 py-3 font-normal">Decision</th>
                  <th className="px-5 py-3 font-normal">When</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-line last:border-b-0 hover:bg-surface-2">
                    <td className="max-w-[34rem] px-5 py-4">
                      <p className="text-sm leading-relaxed text-text">{event.summary}</p>
                      {metadataEntries(event.metadata).length > 0 && (
                        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.62rem] text-subtle">
                          {metadataEntries(event.metadata).map(([key, value]) => (
                            <span key={key}>
                              {key}: {String(value)}
                            </span>
                          ))}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <Badge tone={actionTone(event.action)}>
                        {event.action.replaceAll('.', ' · ')}
                      </Badge>
                    </td>
                    <td className="px-3 py-4 text-sm text-muted">
                      {event.actor?.name || event.actor?.email || 'System'}
                    </td>
                    <td className="px-3 py-4">
                      {event.decision ? (
                        <Link
                          href={`/decisions/${event.decision.id}`}
                          className="text-sm text-text transition-colors hover:text-accent"
                        >
                          {event.decision.title}
                        </Link>
                      ) : (
                        <span className="text-sm text-subtle">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-[0.62rem] uppercase tracking-[0.08em] text-subtle">
                      {formatDateTime(event.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
