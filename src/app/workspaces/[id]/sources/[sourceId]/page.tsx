'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, PageHeader } from '@/components/ui/EmptyState'
import { ConfidenceBadge } from '@/components/workspaces/badges'
import { formatDate } from '@/components/workspaces/format'
import { canEditDecisions } from '@/lib/workspace-roles'
import {
  DecisionCandidateRecord,
  SourceSnapshotRecord,
  WorkspaceSourceDetail,
} from '@/types'

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
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [source, setSource] = useState<WorkspaceSourceDetail | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [candidateError, setCandidateError] = useState('')
  const [candidateNotice, setCandidateNotice] = useState('')
  const [reviewingCandidate, setReviewingCandidate] = useState<string | null>(null)

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

  const extractCandidates = async () => {
    if (!source) return
    setExtracting(true)
    setCandidateError('')
    setCandidateNotice('')

    try {
      const res = await fetch(
        `/api/workspaces/${id}/sources/${sourceId}/extract`,
        { method: 'POST' }
      )
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setCandidateError(data?.error || 'Could not extract candidate decisions.')
        return
      }

      const created = Array.isArray(data?.candidates)
        ? (data.candidates as DecisionCandidateRecord[])
        : []
      if (created.length === 0) {
        setCandidateNotice('No clear candidate decisions were found in this source.')
      }
      setSource((current) =>
        current
          ? { ...current, candidates: [...created, ...current.candidates] }
          : current
      )
    } catch (err) {
      console.error('Failed to extract candidates', err)
      setCandidateError('Could not extract candidate decisions.')
    } finally {
      setExtracting(false)
    }
  }

  const reviewCandidate = async (candidateId: string, status: 'CONFIRMED' | 'REJECTED') => {
    setReviewingCandidate(candidateId)
    setCandidateError('')

    try {
      const res = await fetch(`/api/decision-candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setCandidateError(data?.error || 'Could not review the candidate.')
        return
      }

      setSource((current) =>
        current
          ? {
              ...current,
              candidates: current.candidates.map((candidate) =>
                candidate.id === candidateId
                  ? {
                      ...candidate,
                      status: data.candidate?.status ?? status,
                      decisionId: data.candidate?.decisionId ?? candidate.decisionId,
                    }
                  : candidate
              ),
            }
          : current
      )
    } catch (err) {
      console.error('Failed to review candidate', err)
      setCandidateError('Could not review the candidate.')
    } finally {
      setReviewingCandidate(null)
    }
  }

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

  const canEdit = canEditDecisions(source.role)
  const pendingCandidates = source.candidates.filter(
    (candidate) => candidate.status === 'PENDING'
  )
  const files = source.snapshots.filter((snapshot) => snapshot.kind === 'FILE')
  const commits = source.snapshots.filter((snapshot) => snapshot.kind === 'COMMIT')
  const pullRequests = source.snapshots.filter(
    (snapshot) => snapshot.kind === 'PULL_REQUEST'
  )
  const issues = source.snapshots.filter((snapshot) => snapshot.kind === 'ISSUE')

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

      <section aria-labelledby="candidates-heading" className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2
            id="candidates-heading"
            className="font-mono text-xs uppercase tracking-[0.14em] text-subtle"
          >
            Candidate decisions
          </h2>
          <span className="font-mono text-xs text-subtle">
            {pendingCandidates.length} pending · {source.candidates.length} total
          </span>
        </div>

        {canEdit && (
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={extractCandidates}
              disabled={extracting || pendingCandidates.length > 0}
            >
              {extracting
                ? 'Extracting…'
                : pendingCandidates.length > 0
                  ? 'Review pending first'
                  : 'Extract candidate decisions'}
            </Button>
            <p className="text-xs leading-relaxed text-subtle">
              Uses your default provider. The model proposes; you confirm before anything
              becomes a decision.
            </p>
          </div>
        )}

        {candidateError && (
          <p role="alert" className="mb-3 text-xs text-danger">
            {candidateError}
          </p>
        )}
        {candidateNotice && <p className="mb-3 text-xs text-muted">{candidateNotice}</p>}

        {source.candidates.length === 0 ? (
          <EmptyState
            title="No candidate decisions yet"
            description={
              canEdit
                ? 'Extract candidates from this source. Nothing enters the decision log until you confirm it.'
                : 'A reviewer or owner can extract candidate decisions from this source.'
            }
          />
        ) : (
          <ul className="space-y-3">
            {source.candidates.map((candidate) => (
              <li key={candidate.id}>
                <Card className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base leading-snug text-text">
                      {candidate.title}
                    </h3>
                    <ConfidenceBadge confidence={candidate.confidence} />
                    <Badge
                      tone={
                        candidate.status === 'CONFIRMED'
                          ? 'success'
                          : candidate.status === 'REJECTED'
                            ? 'danger'
                            : 'accent'
                      }
                    >
                      {candidate.status}
                    </Badge>
                    <span className="ml-auto font-mono text-xs text-subtle">
                      {formatDate(candidate.createdAt)}
                    </span>
                  </div>

                  {candidate.context && (
                    <div>
                      <p className="eyebrow">Context</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted">
                        {candidate.context}
                      </p>
                    </div>
                  )}
                  {candidate.proposal && (
                    <div>
                      <p className="eyebrow">Proposed decision</p>
                      <p className="mt-1 text-sm leading-relaxed text-text">
                        {candidate.proposal}
                      </p>
                    </div>
                  )}
                  {candidate.rationale && (
                    <div>
                      <p className="eyebrow">Why</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted">
                        {candidate.rationale}
                      </p>
                    </div>
                  )}

                  {candidate.evidence.length > 0 && (
                    <div className="space-y-2 border-t border-line pt-3">
                      <p className="eyebrow">Evidence</p>
                      {candidate.evidence.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-[3px] border border-line bg-surface-2 p-2"
                        >
                          <p className="break-all font-mono text-xs text-muted">
                            {entry.snapshot.path}
                          </p>
                          {entry.quote && (
                            <blockquote className="mt-1 border-l-2 border-accent-line pl-2 text-xs leading-relaxed text-muted">
                              {entry.quote}
                            </blockquote>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {candidate.status === 'PENDING' && canEdit && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={() => reviewCandidate(candidate.id, 'CONFIRMED')}
                        disabled={reviewingCandidate !== null}
                      >
                        {reviewingCandidate === candidate.id ? 'Reviewing…' : 'Confirm as decision'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() => reviewCandidate(candidate.id, 'REJECTED')}
                        disabled={reviewingCandidate !== null}
                      >
                        Reject
                      </Button>
                    </div>
                  )}

                  {candidate.status === 'CONFIRMED' && candidate.decisionId && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => router.push(`/decisions/${candidate.decisionId}`)}
                    >
                      Open decision
                    </Button>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

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
