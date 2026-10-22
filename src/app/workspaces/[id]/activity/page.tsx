'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState, PageHeader } from '@/components/ui/EmptyState'
import { formatDateTime } from '@/components/workspaces/format'
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

      {error ? (
        <p role="alert" className="rounded-[4px] border border-line bg-surface p-5 text-sm text-danger">
          {error}
        </p>
      ) : events.length === 0 ? (
        <EmptyState
          title="No activity recorded yet"
          description="Actions such as decisions, evidence, approvals, reports, and dossiers will appear here."
        />
      ) : (
        <ol className="space-y-2">
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-[4px] border border-line bg-surface p-4"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Badge tone="outline">{event.action.replaceAll('.', ' · ')}</Badge>
                <span className="text-sm text-text">{event.summary}</span>
                <time className="ml-auto font-mono text-xs text-subtle">
                  {formatDateTime(event.createdAt)}
                </time>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle">
                <span>
                  {event.actor?.name || event.actor?.email || 'System'}
                </span>
                {event.decision && (
                  <Link
                    href={`/decisions/${event.decision.id}`}
                    className="text-accent transition-colors hover:underline"
                  >
                    {event.decision.title}
                  </Link>
                )}
                {metadataEntries(event.metadata).map(([key, value]) => (
                  <span key={key} className="font-mono">
                    {key}: {String(value)}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
