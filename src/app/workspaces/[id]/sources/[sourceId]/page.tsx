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
import { SourceSnapshotRecord, WorkspaceSourceDetail } from '@/types'

function metadataValue(metadata: unknown, key: string): string | null {
  if (!metadata || typeof metadata !== 'object') return null
  const value = (metadata as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : null
}

function formatBytes(value?: number | null): string {
  if (!value || value < 0) return '—'
  if (value < 1024) return `${value} B`
  return `${(value / 1024).toFixed(1)} KB`
}

function SnapshotMeta({ snapshot }: { snapshot: SourceSnapshotRecord }) {
  const author = metadataValue(snapshot.metadata, 'author')
  const state = metadataValue(snapshot.metadata, 'state')
  const date =
    metadataValue(snapshot.metadata, 'date') ||
    metadataValue(snapshot.metadata, 'updatedAt') ||
    metadataValue(snapshot.metadata, 'createdAt')

  return (
    <p className="font-mono text-xs uppercase tracking-[0.1em] text-subtle">
      {state && (
        <>
          {state}
          <span className="mx-1.5">·</span>
        </>
      )}
      {author && (
        <>
          {author}
          <span className="mx-1.5">·</span>
        </>
      )}
      {snapshot.sha256 ? `sha256 ${snapshot.sha256.slice(0, 12)}…` : snapshot.sha?.slice(0, 12) || ''}
      {date && (
        <>
          <span className="mx-1.5">·</span>
          {formatDate(date)}
        </>
      )}
    </p>
  )
}

export default function SourcePage() {
  const { id, sourceId } = useParams<{ id: string; sourceId: string }>()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [source, setSource] = useState<WorkspaceSourceDetail | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  const loading = authLoading || (isAuthenticated && !loaded)

  useEffect(() => {
    if (authLoading || !isAuthenticated || !id || !sourceId) return

    let cancelled = false

    const loadSource = async () => {
      setLoaded(false)
      setError('')
      setNotFound(false)

      try {
        const res = await fetch(`/api/workspaces/${id}/sources/${sourceId}`, {
          cache: 'no-store',
        })
        const data = await res.json().catch(() => null)

        if (cancelled) return

        if (res.status === 404) {
          setNotFound(true)
          return
        }

        if (!res.ok) {
          setError(data?.error || 'Could not load this source.')
          return
        }

        setSource(data as WorkspaceSourceDetail)
      } catch (err) {
        console.error('Failed to load source', err)
        if (!cancelled) setError('Could not load this source.')
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }

    loadSource()
    return () => {
      cancelled = true
    }
  }, [authLoading, id, isAuthenticated, sourceId])

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
          title="Sign in to view this source"
          description="Source snapshots are private to their workspace."
          action={
            <Link href={`/login?callbackUrl=${encodeURIComponent(`/workspaces/${id}/sources/${sourceId}`)}`}>
              <Button variant="primary">Sign in</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (notFound || !source) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-14">
        <EmptyState
          title={notFound ? 'Source not found' : 'Could not load this source'}
          description={error || 'It may have been removed, or you may not be a member of this workspace.'}
          action={
            <Link href={`/workspaces/${id}`}>
              <Button variant="secondary">Back to workspace</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const files = source.snapshots.filter((snapshot) => snapshot.kind === 'FILE')
  const commits = source.snapshots.filter((snapshot) => snapshot.kind === 'COMMIT')
  const pullRequests = source.snapshots.filter(
    (snapshot) => snapshot.kind === 'PULL_REQUEST'
  )
  const issues = source.snapshots.filter((snapshot) => snapshot.kind === 'ISSUE')

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
        eyebrow="Source snapshot"
        title={`${source.owner}/${source.name}`}
        lede={`${source.ref}${source.commitSha ? ` @ ${source.commitSha.slice(0, 12)}` : ''} · ingested ${formatDate(source.updatedAt)}`}
        actions={
          <a href={source.repoUrl} target="_blank" rel="noreferrer">
            <Button variant="secondary" size="sm">
              View on GitHub
            </Button>
          </a>
        }
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Files', value: files.length },
          { label: 'Commits', value: commits.length },
          { label: 'Pull requests', value: pullRequests.length },
          { label: 'Issues', value: issues.length },
        ].map((stat) => (
          <Card key={stat.label} className="py-4">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-subtle">
              {stat.label}
            </p>
            <p className="mt-1 font-display text-2xl text-text">{stat.value}</p>
          </Card>
        ))}
      </div>

      <section aria-labelledby="files-heading" className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2
            id="files-heading"
            className="font-mono text-xs uppercase tracking-[0.14em] text-subtle"
          >
            Files
          </h2>
          <span className="font-mono text-xs text-subtle">{files.length}</span>
        </div>

        {files.length === 0 ? (
          <EmptyState
            title="No file snapshots"
            description="No text files matched the ingestion filter for this repository."
          />
        ) : (
          <ul className="space-y-2">
            {files.map((snapshot) => (
              <li key={snapshot.id}>
                <Card className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="break-all font-mono text-xs text-text">{snapshot.path}</p>
                    <Badge tone="outline">{formatBytes(snapshot.size)}</Badge>
                    {snapshot.url && (
                      <a
                        href={snapshot.url}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto font-mono text-xs text-accent hover:underline"
                      >
                        Source
                      </a>
                    )}
                  </div>
                  <SnapshotMeta snapshot={snapshot} />
                  {snapshot.content && (
                    <details>
                      <summary className="cursor-pointer font-mono text-xs text-muted">
                        Preview
                      </summary>
                      <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-[3px] border border-line bg-surface-2 p-3 font-mono text-xs leading-relaxed text-muted">
                        {snapshot.content}
                      </pre>
                    </details>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-labelledby="commits-heading">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2
              id="commits-heading"
              className="font-mono text-xs uppercase tracking-[0.14em] text-subtle"
            >
              Commits
            </h2>
            <span className="font-mono text-xs text-subtle">{commits.length}</span>
          </div>
          {commits.length === 0 ? (
            <p className="text-sm text-muted">No commits captured.</p>
          ) : (
            <ul className="space-y-2">
              {commits.map((snapshot) => (
                <li key={snapshot.id}>
                  <Card className="space-y-1.5">
                    <p className="text-sm leading-snug text-text">{snapshot.title}</p>
                    <SnapshotMeta snapshot={snapshot} />
                    {snapshot.url && (
                      <a
                        href={snapshot.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block font-mono text-xs text-accent hover:underline"
                      >
                        Commit
                      </a>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="prs-heading">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2
              id="prs-heading"
              className="font-mono text-xs uppercase tracking-[0.14em] text-subtle"
            >
              Pull requests
            </h2>
            <span className="font-mono text-xs text-subtle">{pullRequests.length}</span>
          </div>
          {pullRequests.length === 0 ? (
            <p className="text-sm text-muted">No pull requests captured.</p>
          ) : (
            <ul className="space-y-2">
              {pullRequests.map((snapshot) => (
                <li key={snapshot.id}>
                  <Card className="space-y-1.5">
                    <p className="text-sm leading-snug text-text">{snapshot.title}</p>
                    <SnapshotMeta snapshot={snapshot} />
                    {snapshot.content && (
                      <details>
                        <summary className="cursor-pointer font-mono text-xs text-muted">
                          Body
                        </summary>
                        <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted">
                          {snapshot.content}
                        </p>
                      </details>
                    )}
                    {snapshot.url && (
                      <a
                        href={snapshot.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block font-mono text-xs text-accent hover:underline"
                      >
                        Pull request
                      </a>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="issues-heading">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2
              id="issues-heading"
              className="font-mono text-xs uppercase tracking-[0.14em] text-subtle"
            >
              Issues
            </h2>
            <span className="font-mono text-xs text-subtle">{issues.length}</span>
          </div>
          {issues.length === 0 ? (
            <p className="text-sm text-muted">No issues captured.</p>
          ) : (
            <ul className="space-y-2">
              {issues.map((snapshot) => (
                <li key={snapshot.id}>
                  <Card className="space-y-1.5">
                    <p className="text-sm leading-snug text-text">{snapshot.title}</p>
                    <SnapshotMeta snapshot={snapshot} />
                    {snapshot.content && (
                      <details>
                        <summary className="cursor-pointer font-mono text-xs text-muted">
                          Body
                        </summary>
                        <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted">
                          {snapshot.content}
                        </p>
                      </details>
                    )}
                    {snapshot.url && (
                      <a
                        href={snapshot.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block font-mono text-xs text-accent hover:underline"
                      >
                        Issue
                      </a>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
