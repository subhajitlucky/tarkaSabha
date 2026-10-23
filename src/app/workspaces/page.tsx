'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { BarList, MetricCard } from '@/components/ui/DataViz'
import { EmptyState, PageHeader } from '@/components/ui/EmptyState'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { formatDate } from '@/components/workspaces/format'
import { WorkspaceSummary } from '@/types'

const DAY = 86_400_000

function activitySignal(updatedAt: string, now: number) {
  const days = (now - new Date(updatedAt).getTime()) / DAY
  if (days <= 14) return { label: 'Active', tone: 'success' as const }
  if (days <= 45) return { label: 'Review', tone: 'accent' as const }
  return { label: 'Quiet', tone: 'outline' as const }
}

export default function WorkspacesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [now] = useState(() => Date.now())
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')

  const loading = authLoading || (isAuthenticated && !loaded)

  useEffect(() => {
    if (authLoading || !isAuthenticated) return

    let cancelled = false

    const loadWorkspaces = async () => {
      setLoaded(false)
      setLoadError('')
      try {
        const res = await fetch('/api/workspaces', { cache: 'no-store' })
        const data = await res.json().catch(() => null)

        if (cancelled) return

        if (!res.ok) {
          setLoadError(data?.error || 'Could not load your workspaces.')
          setWorkspaces([])
          return
        }

        setWorkspaces(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Failed to fetch workspaces', error)
        if (!cancelled) setLoadError('Could not load your workspaces.')
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }

    loadWorkspaces()
    return () => {
      cancelled = true
    }
  }, [authLoading, isAuthenticated])

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreating(true)
    setFormError('')

    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setFormError(data?.error || 'Could not create the workspace.')
        return
      }

      setWorkspaces((current) => [data as WorkspaceSummary, ...current])
      setName('')
      setDescription('')
    } catch (error) {
      console.error('Failed to create workspace', error)
      setFormError('Could not create the workspace.')
    } finally {
      setCreating(false)
    }
  }

  const totalDecisions = workspaces.reduce(
    (total, workspace) => total + (workspace._count?.decisions ?? 0),
    0
  )
  const totalMembers = workspaces.reduce(
    (total, workspace) => total + (workspace._count?.memberships ?? 0),
    0
  )
  const activeMatters = workspaces.filter(
    (workspace) => (now - new Date(workspace.updatedAt).getTime()) / DAY <= 14
  ).length
  const latestActivity = workspaces.reduce<string | null>((latest, workspace) => {
    if (!latest) return workspace.updatedAt
    return new Date(workspace.updatedAt) > new Date(latest) ? workspace.updatedAt : latest
  }, null)
  const busiest = [...workspaces].sort(
    (a, b) => (b._count?.decisions ?? 0) - (a._count?.decisions ?? 0)
  )[0]
  const chartItems = [...workspaces]
    .sort((a, b) => (b._count?.decisions ?? 0) - (a._count?.decisions ?? 0))
    .slice(0, 6)
    .map((workspace, index) => ({
      label: workspace.name,
      value: workspace._count?.decisions ?? 0,
      meta: `${workspace._count?.decisions ?? 0} decision${(workspace._count?.decisions ?? 0) === 1 ? '' : 's'}`,
      color: `var(--chart-${(index % 5) + 1})`,
    }))

  return (
    <div className="mx-auto max-w-[90rem] px-5 py-10">
      <PageHeader
        eyebrow="Decision workspace"
        title="Workspaces"
        lede="One room per deal, with evidence, open questions, and an approval record."
        actions={
          isAuthenticated ? (
            <Link href="#new-workspace">
              <Button variant="primary" size="sm">
                New matter
              </Button>
            </Link>
          ) : undefined
        }
      />

      {loading ? (
        <p className="py-20 text-center font-mono text-xs uppercase tracking-[0.14em] text-subtle">
          Loading…
        </p>
      ) : !isAuthenticated ? (
        <EmptyState
          title="Sign in to open your workspaces"
          description="Workspaces hold private diligence material. Sign in to create a deal room, or look at the public sample first."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link href="/login?callbackUrl=/workspaces">
                <Button variant="primary">Sign in</Button>
              </Link>
              <Link href="/demo">
                <Button variant="secondary">See a sample</Button>
              </Link>
            </div>
          }
        />
      ) : (
        <>
          <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Matters"
              value={workspaces.length}
              accent="var(--chart-1)"
              detail={`${activeMatters} active in the last 14 days`}
            />
            <MetricCard
              label="Decisions"
              value={totalDecisions}
              accent="var(--chart-2)"
              detail={
                workspaces.length
                  ? `${(totalDecisions / workspaces.length).toFixed(1)} per matter`
                  : 'No decisions recorded yet'
              }
            />
            <MetricCard
              label="Team seats"
              value={totalMembers}
              accent="var(--chart-3)"
              detail={`Across ${workspaces.length} matter${workspaces.length === 1 ? '' : 's'}`}
            />
            <MetricCard
              label="Latest activity"
              value={latestActivity ? formatDate(latestActivity) : '—'}
              accent="var(--chart-4)"
              detail={busiest ? `Busiest: ${busiest.name}` : 'No matter activity yet'}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
            <div className="min-w-0 space-y-6">
              <Card>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow">Portfolio pulse</p>
                    <h2 className="mt-2 text-2xl text-text">
                      Decision volume by matter
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-subtle">{totalDecisions} total</span>
                </div>

                {chartItems.length > 0 ? (
                  <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(14rem,0.7fr)]">
                    <BarList items={chartItems} />
                    <div className="border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                      <p className="eyebrow">Reading the desk</p>
                      <div className="mt-3 space-y-4 text-sm">
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-muted">Active matters</span>
                          <span className="text-xl text-text">
                            {activeMatters}/{workspaces.length}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-muted">Decisions per matter</span>
                          <span className="text-xl text-text">
                            {(totalDecisions / Math.max(1, workspaces.length)).toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-muted">Team seats</span>
                          <span className="text-xl text-text">{totalMembers}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                      ['01', 'Open a matter', 'Name the deal or decision under review.'],
                      ['02', 'Add a decision', 'Capture the choice and its deal impact.'],
                      ['03', 'Attach evidence', 'Tie each claim to a path, quote, and hash.'],
                    ].map(([number, title, body]) => (
                      <div key={number} className="border border-line bg-surface-2/40 p-4">
                        <p className="font-mono text-[0.62rem] text-accent">{number}</p>
                        <p className="mt-3 text-sm font-semibold text-text">{title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted">{body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card flush className="overflow-hidden">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line p-5">
                  <div>
                    <p className="eyebrow">Matter register</p>
                    <h2 className="mt-2 text-2xl text-text">
                      Open diligence rooms
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-subtle">{workspaces.length} matter{workspaces.length === 1 ? '' : 's'}</span>
                </div>

                {loadError ? (
                  <p role="alert" className="p-5 text-sm text-danger">
                    {loadError}
                  </p>
                ) : workspaces.length === 0 ? (
                  <div className="p-5">
                    <EmptyState
                      title="No matters opened"
                      description="Open a case file for the next decision you need to defend. Decisions, evidence, and approvals stay together."
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-line font-mono text-[0.6rem] uppercase tracking-[0.14em] text-subtle">
                          <th className="px-5 py-3 font-normal">Matter</th>
                          <th className="px-4 py-3 font-normal">Decisions</th>
                          <th className="px-4 py-3 font-normal">Members</th>
                          <th className="px-4 py-3 font-normal">Updated</th>
                          <th className="px-5 py-3 font-normal">Signal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workspaces.map((workspace, index) => {
                          const signal = activitySignal(workspace.updatedAt, now)
                          return (
                            <tr
                              key={workspace.id}
                              className="group border-b border-line transition-colors last:border-b-0 hover:bg-surface-2"
                            >
                              <td className="max-w-[28rem] px-5 py-4">
                                <div className="flex items-baseline gap-3">
                                  <span className="font-mono text-[0.62rem] text-accent">
                                    {String(index + 1).padStart(2, '0')}
                                  </span>
                                  <div className="min-w-0">
                                    <Link
                                      href={`/workspaces/${workspace.id}`}
                                      className="break-words text-xl leading-tight text-text transition-colors group-hover:text-accent"
                                    >
                                      {workspace.name}
                                    </Link>
                                    <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
                                      {workspace.description || 'No description recorded.'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 font-mono text-sm text-text">
                                {workspace._count?.decisions ?? 0}
                              </td>
                              <td className="px-4 py-4 font-mono text-sm text-text">
                                {workspace._count?.memberships ?? 1}
                              </td>
                              <td className="whitespace-nowrap px-4 py-4 font-mono text-[0.62rem] uppercase tracking-[0.08em] text-subtle">
                                {formatDate(workspace.updatedAt)}
                              </td>
                              <td className="px-5 py-4">
                                <Badge tone={signal.tone}>{signal.label}</Badge>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>

            <aside className="space-y-6">
              <Card id="new-workspace" className="scroll-mt-24">
                <p className="eyebrow">New matter</p>
                <h2 className="mt-2 text-2xl text-text">Open a case file</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Name it after the decision under review. Evidence and approvals are scoped to
                  this room.
                </p>

                <form onSubmit={handleCreate} className="mt-5 space-y-4">
                  <Field label="Name">
                    <Input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Project Kestrel"
                      maxLength={120}
                      required
                    />
                  </Field>

                  <Field
                    label="Description"
                    hint="Optional. The decision, the counterparty, or the question."
                  >
                    <Textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Should we proceed with the acquisition?"
                      rows={4}
                      maxLength={500}
                    />
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
                    disabled={creating || name.trim().length === 0}
                  >
                    {creating ? 'Creating…' : 'Open case file'}
                  </Button>
                </form>
              </Card>

              <Card>
                <p className="eyebrow">What a matter holds</p>
                <ul className="mt-4 space-y-3 text-xs leading-relaxed text-muted">
                  <li className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent" />
                    Decisions, owners, and deal impact.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent" />
                    Evidence with paths, commits, quotes, and hashes.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent" />
                    Approvals, pins, and versioned dossiers.
                  </li>
                </ul>
              </Card>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
