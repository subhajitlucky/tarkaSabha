'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
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
                New workspace
              </Button>
            </Link>
          ) : (
            <Link href="/login?callbackUrl=/workspaces">
              <Button variant="primary" size="sm">
                Sign in
              </Button>
            </Link>
          )
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
          <div className="mb-8 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Rooms', value: workspaces.length },
              { label: 'Decisions', value: totalDecisions },
              { label: 'Members', value: totalMembers },
            ].map((stat) => (
              <Card key={stat.label} className="py-4">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-subtle">
                  {stat.label}
                </p>
                <p className="mt-1 font-display text-3xl text-text">{stat.value}</p>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <section aria-labelledby="workspace-list-heading">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2
                  id="workspace-list-heading"
                  className="font-mono text-xs uppercase tracking-[0.14em] text-subtle"
                >
                  All rooms
                </h2>
                <span className="font-mono text-xs text-subtle">{workspaces.length}</span>
              </div>

              {loadError ? (
                <p role="alert" className="rounded-[2px] border border-line bg-surface p-5 text-sm text-danger">
                  {loadError}
                </p>
              ) : workspaces.length === 0 ? (
                <EmptyState
                  title="No workspaces yet"
                  description="Create a room for the next decision you need to defend. Decisions, evidence, and approvals stay together."
                />
              ) : (
                <ul className="grid gap-3 md:grid-cols-2">
                  {workspaces.map((workspace, index) => (
                    <li key={workspace.id}>
                      <Link
                        href={`/workspaces/${workspace.id}`}
                        className="group flex h-full flex-col border border-line bg-surface p-5 transition-colors hover:border-accent-line"
                      >
                        <div className="flex items-center justify-between gap-3 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-subtle">
                          <span>Room {String(index + 1).padStart(2, '0')}</span>
                          <span>
                            {workspace._count?.decisions ?? 0}{' '}
                            {(workspace._count?.decisions ?? 0) === 1 ? 'decision' : 'decisions'}
                          </span>
                        </div>

                        <h3 className="mt-6 font-display text-2xl leading-[1.05] text-text transition-colors group-hover:text-accent">
                          {workspace.name}
                        </h3>

                        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">
                          {workspace.description || 'No description yet.'}
                        </p>

                        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
                          <p className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-subtle">
                            {workspace._count?.memberships ?? 1}{' '}
                            {(workspace._count?.memberships ?? 1) === 1 ? 'member' : 'members'}
                            <span className="mx-1.5">·</span>
                            {formatDate(workspace.updatedAt)}
                          </p>
                          <span className="font-mono text-xs text-accent opacity-0 transition-opacity group-hover:opacity-100">
                            Open →
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <aside>
              <Card id="new-workspace" className="scroll-mt-24 space-y-4">
                <div>
                  <p className="eyebrow">New workspace</p>
                  <h2 className="mt-3 font-display text-2xl text-text">Start a case file</h2>
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
                    {creating ? 'Creating…' : 'Create workspace'}
                  </Button>
                </form>
              </Card>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
