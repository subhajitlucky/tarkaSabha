'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/Button'
import { EmptyState, PageHeader } from '@/components/ui/EmptyState'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { formatDate } from '@/components/workspaces/format'
import { WorkspaceSummary } from '@/types'

export default function WorkspacesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
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

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <PageHeader
        eyebrow="Decision workspace"
        title="Workspaces"
        lede="One room per deal or decision. Collect source-backed evidence, keep the open questions visible, and leave an approval record."
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
          <div className="mb-8 grid grid-cols-3 border-y border-line">
            {[
              { label: 'Matters', value: workspaces.length },
              { label: 'Decisions', value: totalDecisions },
              { label: 'Members', value: totalMembers },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className={index === 0 ? 'py-5' : 'border-l border-line py-5 pl-5'}
              >
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-subtle">
                  {stat.label}
                </p>
                <p className="mt-1 font-display text-4xl text-text">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
            <section aria-labelledby="workspace-list-heading">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2
                  id="workspace-list-heading"
                  className="font-mono text-xs uppercase tracking-[0.14em] text-subtle"
                >
                  Matters
                </h2>
                <span className="font-mono text-xs text-subtle">{workspaces.length}</span>
              </div>

              {loadError ? (
                <p role="alert" className="border border-line bg-surface p-5 text-sm text-danger">
                  {loadError}
                </p>
              ) : workspaces.length === 0 ? (
                <EmptyState
                  title="No matters opened"
                  description="Open a case file for the next decision you need to defend. Decisions, evidence, and approvals stay together."
                />
              ) : (
                <div className="border-y border-line">
                  <div className="hidden grid-cols-[minmax(0,1fr)_4rem_4rem_7rem_1.25rem] gap-4 border-b border-line py-2 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-subtle sm:grid">
                    <span>Matter</span>
                    <span>Decisions</span>
                    <span>Members</span>
                    <span>Updated</span>
                    <span />
                  </div>
                  {workspaces.map((workspace, index) => (
                    <Link
                      key={workspace.id}
                      href={`/workspaces/${workspace.id}`}
                      className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-line px-1 py-4 transition-colors last:border-b-0 hover:bg-surface-2 sm:grid-cols-[minmax(0,1fr)_4rem_4rem_7rem_1.25rem]"
                    >
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-3">
                          <span className="font-mono text-[0.62rem] text-accent">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <h3 className="truncate font-display text-xl leading-tight text-text transition-colors group-hover:text-accent">
                            {workspace.name}
                          </h3>
                        </div>
                        <p className="mt-1 line-clamp-1 pl-7 text-sm leading-relaxed text-muted">
                          {workspace.description || 'No description recorded.'}
                        </p>
                      </div>
                      <span className="hidden font-mono text-xs text-muted sm:block">
                        {workspace._count?.decisions ?? 0}
                      </span>
                      <span className="hidden font-mono text-xs text-muted sm:block">
                        {workspace._count?.memberships ?? 1}
                      </span>
                      <span className="hidden font-mono text-[0.62rem] uppercase tracking-[0.08em] text-subtle sm:block">
                        {formatDate(workspace.updatedAt)}
                      </span>
                      <span className="font-mono text-sm text-accent opacity-0 transition-opacity group-hover:opacity-100">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <aside>
              <div id="new-workspace" className="scroll-mt-24 border-t border-line pt-4">
                <div>
                  <p className="eyebrow">New matter</p>
                  <h2 className="mt-3 font-display text-2xl text-text">Open a case file</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Name it after the decision under review. Evidence and approvals are scoped
                    to this room.
                  </p>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                  <Field label="Name">
                    <Input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Project Kestrel — acquisition review"
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
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
