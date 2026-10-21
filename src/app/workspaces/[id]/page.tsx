'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, PageHeader } from '@/components/ui/EmptyState'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { DecisionStatusBadge, ImpactBadge, RoleBadge } from '@/components/workspaces/badges'
import { formatDate } from '@/components/workspaces/format'
import { DECISION_IMPACTS, canEditDecisions } from '@/lib/workspace-roles'
import { DecisionSummary, WorkspaceDetail } from '@/types'

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [notFound, setNotFound] = useState(false)

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [impact, setImpact] = useState('MEDIUM')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')

  const loading = authLoading || (isAuthenticated && !loaded)

  useEffect(() => {
    if (authLoading || !isAuthenticated || !id) return

    let cancelled = false

    const loadWorkspace = async () => {
      setLoaded(false)
      setLoadError('')
      setNotFound(false)
      try {
        const res = await fetch(`/api/workspaces/${id}`, { cache: 'no-store' })
        const data = await res.json().catch(() => null)

        if (cancelled) return

        if (res.status === 404) {
          setNotFound(true)
          setWorkspace(null)
          return
        }

        if (!res.ok) {
          setLoadError(data?.error || 'Could not load this workspace.')
          return
        }

        setWorkspace(data as WorkspaceDetail)
      } catch (error) {
        console.error('Failed to fetch workspace', error)
        if (!cancelled) setLoadError('Could not load this workspace.')
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }

    loadWorkspace()
    return () => {
      cancelled = true
    }
  }, [authLoading, id, isAuthenticated])

  const handleCreateDecision = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!workspace) return

    setCreating(true)
    setFormError('')

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, summary, impact }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setFormError(data?.error || 'Could not add the decision.')
        return
      }

      const created = data as DecisionSummary
      setWorkspace((current) =>
        current
          ? {
              ...current,
              decisions: [created, ...current.decisions],
              _count: { decisions: current.decisions.length + 1 },
              updatedAt: new Date().toISOString(),
            }
          : current
      )
      setTitle('')
      setSummary('')
      setImpact('MEDIUM')
    } catch (error) {
      console.error('Failed to create decision', error)
      setFormError('Could not add the decision.')
    } finally {
      setCreating(false)
    }
  }

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
          title="Sign in to open this workspace"
          description="Workspace material is private to its members."
          action={
            <Link href={`/login?callbackUrl=${encodeURIComponent(`/workspaces/${id}`)}`}>
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
          description="It may have been removed, or you may not be a member of this room."
          action={
            <Link href="/workspaces">
              <Button variant="secondary">Back to workspaces</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-14">
        <p role="alert" className="rounded-[4px] border border-line bg-surface p-5 text-sm text-danger">
          {loadError || 'Could not load this workspace.'}
        </p>
      </div>
    )
  }

  const canEdit = canEditDecisions(workspace.role)
  const decisionCount = workspace.decisions.length
  const evidenceCount = workspace.decisions.reduce(
    (total, decision) => total + (decision._count?.evidence ?? 0),
    0
  )
  const memberCount = workspace.memberships.length

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <div className="mb-6">
        <Link
          href="/workspaces"
          className="font-mono text-xs uppercase tracking-[0.12em] text-subtle transition-colors hover:text-accent"
        >
          ← All workspaces
        </Link>
      </div>

      <PageHeader
        eyebrow="Decision workspace"
        title={workspace.name}
        lede={workspace.description || 'No workspace description yet.'}
        actions={<RoleBadge role={workspace.role} />}
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Decisions', value: decisionCount },
          { label: 'Evidence items', value: evidenceCount },
          { label: 'Members', value: memberCount },
        ].map((stat) => (
          <Card key={stat.label} className="py-4">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-subtle">
              {stat.label}
            </p>
            <p className="mt-1 font-display text-2xl text-text">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="decision-list-heading">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2
              id="decision-list-heading"
              className="font-mono text-xs uppercase tracking-[0.14em] text-subtle"
            >
              Decisions
            </h2>
            <span className="font-mono text-xs text-subtle">{decisionCount}</span>
          </div>

          {workspace.decisions.length === 0 ? (
            <EmptyState
              title="No decisions in this room"
              description={
                canEdit
                  ? 'Add the first decision under review. Evidence and approvals will hang off it.'
                  : 'A reviewer or owner will add the first decision.'
              }
            />
          ) : (
            <ul className="space-y-3">
              {workspace.decisions.map((decision) => (
                <li key={decision.id}>
                  <Link
                    href={`/decisions/${decision.id}`}
                    className="group flex h-full flex-col rounded-[4px] border border-line bg-surface p-5 transition-colors hover:border-accent-line"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <DecisionStatusBadge status={decision.status} />
                      <ImpactBadge impact={decision.impact} />
                      <span className="ml-auto font-mono text-xs text-subtle">
                        {formatDate(decision.updatedAt)}
                      </span>
                    </div>

                    <h3 className="mt-3 font-display text-lg leading-snug text-text transition-colors group-hover:text-accent">
                      {decision.title}
                    </h3>

                    {decision.summary && (
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
                        {decision.summary}
                      </p>
                    )}

                    <p className="mt-auto pt-4 font-mono text-xs uppercase tracking-[0.1em] text-subtle">
                      {decision._count?.evidence ?? 0} evidence items
                      <span className="mx-1.5">·</span>
                      {decision._count?.approvals ?? 0} approvals
                      <span className="mx-1.5">·</span>
                      Owner {decision.owner?.name || 'unassigned'}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          {canEdit ? (
            <Card className="space-y-4">
              <div>
                <p className="eyebrow">New decision</p>
                <h2 className="mt-2 font-display text-xl text-text">What is under review?</h2>
              </div>

              <form onSubmit={handleCreateDecision} className="space-y-4">
                <Field label="Decision">
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Proceed with the Kestrel acquisition"
                    maxLength={200}
                    required
                  />
                </Field>

                <Field label="Context" hint="Optional. State the question and the stakes.">
                  <Textarea
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                    placeholder="The board needs a recommendation before the exclusivity window closes."
                    rows={4}
                    maxLength={2000}
                  />
                </Field>

                <Field label="Impact">
                  <Select value={impact} onChange={(event) => setImpact(event.target.value)}>
                    {DECISION_IMPACTS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                </Field>

                {formError && (
                  <p role="alert" className="text-xs text-danger">
                    {formError}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={creating || title.trim().length === 0}
                >
                  {creating ? 'Adding…' : 'Add decision'}
                </Button>
              </form>
            </Card>
          ) : (
            <Card>
              <p className="eyebrow">View-only access</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                You can read this workspace, but only owners, admins, and reviewers can add
                decisions or evidence.
              </p>
            </Card>
          )}

          <Card className="space-y-3">
            <p className="eyebrow">Members</p>
            <ul className="space-y-3">
              {workspace.memberships.map((membership) => (
                <li key={membership.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-text">
                      {membership.user.name || membership.user.email || 'Unnamed member'}
                    </p>
                    {membership.user.name && membership.user.email && (
                      <p className="truncate font-mono text-xs text-subtle">
                        {membership.user.email}
                      </p>
                    )}
                  </div>
                  <RoleBadge role={membership.role} />
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  )
}
