'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Persona, Provider } from '@/types'
import { useAuth } from '@/components/AuthProvider'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { BarList, MetricCard } from '@/components/ui/DataViz'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { EmptyState, PageHeader } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { ROLE_OPTIONS, TOOL_OPTIONS } from '@/lib/provider-catalog'

interface Draft {
  name: string
  bio: string
  personality: string
  role: string
  tools: string[]
  providerId: string
}

const EMPTY_DRAFT: Draft = {
  name: '',
  bio: '',
  personality: '',
  role: 'contributor',
  tools: [],
  providerId: '',
}

const roleLabel = (role?: string | null) =>
  ROLE_OPTIONS.find((r) => r.value === role)?.label ?? 'Contributor'

export default function PersonasPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [personas, setPersonas] = useState<Persona[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState<Persona | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Persona | null>(null)

  const load = useCallback(async () => {
    try {
      const [personaRes, providerRes] = await Promise.all([
        fetch('/api/personas'),
        fetch('/api/providers'),
      ])
      if (personaRes.ok) setPersonas(await personaRes.json())
      if (providerRes.ok) setProviders(await providerRes.json())
    } catch {
      setError('Could not load your agents.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      const run = async () => {
        await load()
      }
      run()
    }
  }, [isAuthenticated, load])

  const openCreate = () => {
    setEditing(null)
    setDraft({
      ...EMPTY_DRAFT,
      providerId: providers.find((p) => p.isDefault)?.id ?? providers[0]?.id ?? '',
    })
    setFormError(null)
    setShowForm(true)
  }

  const openEdit = (persona: Persona) => {
    setEditing(persona)
    setDraft({
      name: persona.name,
      bio: persona.bio,
      personality: persona.personality ?? '',
      role: (persona.role as string) ?? 'contributor',
      tools: persona.tools ?? [],
      providerId: persona.providerId ?? '',
    })
    setFormError(null)
    setShowForm(true)
  }

  const save = async () => {
    setSaving(true)
    setFormError(null)
    try {
      const body = {
        name: draft.name.trim(),
        bio: draft.bio.trim(),
        personality: draft.personality.trim(),
        role: draft.role,
        tools: draft.tools,
        // An empty selection must clear the override, not send an empty string.
        providerId: draft.providerId || null,
      }

      const res = await fetch(
        editing ? `/api/personas/${editing.id}` : '/api/personas',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Could not save the agent')
      }

      setShowForm(false)
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save the agent')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const target = pendingDelete
    setPendingDelete(null)
    try {
      const res = await fetch(`/api/personas/${target.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setPersonas((current) => current.filter((p) => p.id !== target.id))
    } catch {
      setError(`Could not delete ${target.name}.`)
    }
  }

  const toggleTool = (name: string) =>
    setDraft((d) => ({
      ...d,
      tools: d.tools.includes(name)
        ? d.tools.filter((t) => t !== name)
        : [...d.tools, name],
    }))

  const roleCounts = ROLE_OPTIONS.map((role) => ({
    ...role,
    count: personas.filter((persona) => persona.role === role.value).length,
  }))
  const maxRoleCount = Math.max(1, ...roleCounts.map((role) => role.count))
  const coveredRoles = roleCounts.filter((role) => role.count > 0).length
  const toolItems = TOOL_OPTIONS.map((tool) => {
    const count = personas.filter((persona) => persona.tools?.includes(tool.value)).length
    return { label: tool.label, value: count, meta: `${count} agent${count === 1 ? '' : 's'}` }
  })
  const totalTools = toolItems.reduce((total, tool) => total + tool.value, 0)
  const providerOverrides = personas.filter((persona) => persona.providerId).length

  if (authLoading) {
    return (
      <div className="mx-auto max-w-[90rem] px-5 py-14">
        <p className="eyebrow">Loading…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-14">
        <EmptyState
          title="Sign in to manage agents"
          description="Agents are stored against your account."
          action={
            <Link href="/login">
              <Button variant="primary">Sign in</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[90rem] px-5 py-14">
      <PageHeader
        eyebrow="Agents"
        title="Review-room agents"
        lede="Each agent has a job and, optionally, tools to check its own claims. Define them once and reuse them inside a decision review room."
        actions={
          <Button variant="primary" onClick={openCreate}>
            New agent
          </Button>
        }
      />

      {error && (
        <p
          role="alert"
          className="mb-6 rounded-[3px] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}

      {providers.length === 0 && !loading && (
        <Card className="mb-6">
          <p className="text-sm text-muted">
            You have no provider yet, so agents cannot be given a model. You can still create
            them — they will fall back to the default provider when one exists.{' '}
            <Link href="/providers" className="text-accent hover:text-accent-hover">
              Add a provider
            </Link>
          </p>
        </Card>
      )}

      {loading ? (
        <p className="py-20 text-center font-mono text-xs uppercase tracking-[0.14em] text-subtle">
          Loading…
        </p>
      ) : (
        <>
          <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Agents"
              value={personas.length}
              detail="Reusable across review rooms"
            />
            <MetricCard
              label="Roles covered"
              value={`${coveredRoles}/${ROLE_OPTIONS.length}`}
              detail={coveredRoles === ROLE_OPTIONS.length ? 'Full council shape' : 'Coverage gaps remain'}
            />
            <MetricCard
              label="Tool grants"
              value={totalTools}
              detail={`${toolItems.filter((tool) => tool.value > 0).length} tools in use`}
            />
            <MetricCard
              label="Provider overrides"
              value={providerOverrides}
              detail="Agents using an explicit model"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="min-w-0 space-y-6">
              <Card flush className="overflow-hidden">
                <div className="border-b border-line p-5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="eyebrow">Council coverage</p>
                      <h2 className="mt-2 font-display text-2xl text-text">
                        Roles and mandates
                      </h2>
                    </div>
                    <Badge tone={coveredRoles === ROLE_OPTIONS.length ? 'success' : 'outline'}>
                      {coveredRoles === ROLE_OPTIONS.length ? 'Complete' : 'Incomplete'}
                    </Badge>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                    A useful council is not five copies of the same analyst. Each role should
                    stress a different part of the decision.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-line font-mono text-[0.6rem] uppercase tracking-[0.14em] text-subtle">
                        <th className="px-5 py-3 font-normal">Role</th>
                        <th className="px-4 py-3 font-normal">Mandate</th>
                        <th className="px-4 py-3 font-normal">Agents</th>
                        <th className="px-5 py-3 font-normal">Coverage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roleCounts.map((role) => (
                        <tr key={role.value} className="border-b border-line last:border-b-0">
                          <td className="px-5 py-4">
                            <span className="font-display text-base text-text">{role.label}</span>
                          </td>
                          <td className="px-4 py-4 text-sm text-muted">{role.hint}</td>
                          <td className="px-4 py-4 font-mono text-sm text-text">{role.count}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-1.5 w-24 overflow-hidden bg-surface-2">
                                <div
                                  className="h-full bg-accent"
                                  style={{
                                    width: `${(role.count / maxRoleCount) * 100}%`,
                                  }}
                                />
                              </div>
                              <Badge tone={role.count > 0 ? 'success' : 'outline'}>
                                {role.count > 0 ? 'Covered' : 'Gap'}
                              </Badge>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card flush className="overflow-hidden">
                <div className="border-b border-line p-5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="eyebrow">Agent library</p>
                      <h2 className="mt-2 font-display text-2xl text-text">
                        Available to the council
                      </h2>
                    </div>
                    <span className="font-mono text-xs text-subtle">{personas.length} agents</span>
                  </div>
                </div>

                {personas.length === 0 ? (
                  <div className="p-6">
                    <div className="border border-dashed border-line bg-surface-2/40 px-6 py-10 text-center">
                      <p className="font-display text-2xl text-text">No agents configured</p>
                      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                        Start with a researcher and a critic. Add a synthesizer when the
                        council needs to turn disagreement into a recommendation.
                      </p>
                      <Button variant="primary" className="mt-5" onClick={openCreate}>
                        Create the first agent
                      </Button>
                    </div>
                  </div>
                ) : (
                  <ul className="grid gap-3 p-5 md:grid-cols-2">
                    {personas.map((persona) => (
                      <li key={persona.id}>
                        <Card className="flex h-full flex-col">
                          <div className="flex items-start gap-3">
                            <Avatar name={persona.name} size="md" />
                            <div className="min-w-0 flex-1">
                              <h3 className="break-words font-display text-base text-text">
                                {persona.name}
                              </h3>
                              <p className="mt-0.5 font-mono text-xs uppercase tracking-[0.1em] text-accent">
                                {roleLabel(persona.role)}
                              </p>
                            </div>
                          </div>

                          <p className="mt-3 text-sm leading-relaxed text-muted">
                            {persona.bio}
                          </p>

                          {(persona.tools?.length ?? 0) > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {persona.tools?.map((tool) => (
                                <Badge key={tool} tone="outline">
                                  {TOOL_OPTIONS.find((t) => t.value === tool)?.label ?? tool}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <p className="mt-3 font-mono text-xs text-subtle">
                            {persona.provider?.name
                              ? `via ${persona.provider.name}`
                              : 'default provider'}
                          </p>

                          <div className="mt-auto flex gap-2 pt-4">
                            <Button size="sm" onClick={() => openEdit(persona)}>
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setPendingDelete(persona)}
                            >
                              Delete
                            </Button>
                          </div>
                        </Card>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            <aside className="space-y-4">
              <Card>
                <div className="flex items-end justify-between gap-3">
                  <p className="eyebrow">Tool access</p>
                  <span className="font-mono text-xs text-subtle">{totalTools} grants</span>
                </div>
                <BarList items={toolItems} className="mt-4" />
                <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-subtle">
                  Tools are granted per agent. An agent without one answers from memory alone.
                </p>
              </Card>

              <Card>
                <p className="eyebrow">Design rules</p>
                <ul className="mt-4 space-y-3 text-xs leading-relaxed text-muted">
                  <li className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent" />
                    Give each agent a distinct job, not a different tone.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent" />
                    Grant tool access only where the agent must verify a claim.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent" />
                    Keep the transcript attached to the decision record.
                  </li>
                </ul>
              </Card>

              <Card>
                <p className="eyebrow">In the record</p>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  Agents argue inside a review room, but the decision, evidence, and approvals
                  remain the durable artifact. The transcript is attached to the record — not the
                  other way around.
                </p>
              </Card>
            </aside>
          </div>
        </>
      )}


      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        eyebrow={editing ? 'Edit agent' : 'New agent'}
        title={editing ? editing.name : 'Define an agent'}
        footer={
          <>
            <Button onClick={() => setShowForm(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={save}
              disabled={saving || draft.name.trim().length < 2}
            >
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create agent'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Name" hint="At least two characters.">
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g., Dr. Sharma"
            />
          </Field>

          <Field label="Bio" hint="What this agent knows and how it argues.">
            <Textarea
              rows={3}
              value={draft.bio}
              onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
              placeholder="A village doctor who has seen both sides of the trade."
            />
          </Field>

          <Field label="Personality" hint="Optional. Tone rather than job.">
            <Input
              value={draft.personality}
              onChange={(e) => setDraft({ ...draft, personality: e.target.value })}
              placeholder="Calm, evidence-first, sceptical of averages."
            />
          </Field>

          <Field
            label="Role in the task"
            hint={
              ROLE_OPTIONS.find((r) => r.value === draft.role)?.hint ??
              'Shapes what this agent is told to do.'
            }
          >
            <Select
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value })}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label} — {role.hint}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Tools"
            hint="Granted per agent. Without one an agent answers from memory alone."
          >
            <div className="flex flex-wrap gap-3 pt-1">
              {TOOL_OPTIONS.map((tool) => (
                <label
                  key={tool.value}
                  className="flex cursor-pointer items-center gap-2 text-sm text-muted"
                >
                  <input
                    type="checkbox"
                    checked={draft.tools.includes(tool.value)}
                    onChange={() => toggleTool(tool.value)}
                    className="h-3.5 w-3.5 accent-[var(--accent)]"
                  />
                  {tool.label}
                </label>
              ))}
            </div>
          </Field>

          <Field
            label="Provider"
            hint="Leave as default to inherit whichever provider is marked default."
          >
            <Select
              value={draft.providerId}
              onChange={(e) => setDraft({ ...draft, providerId: e.target.value })}
            >
              <option value="">Default provider</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.model})
                </option>
              ))}
            </Select>
          </Field>

          {formError && (
            <p
              role="alert"
              className="rounded-[3px] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger"
            >
              {formError}
            </p>
          )}
        </div>
      </Modal>

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        eyebrow="Delete"
        title={`Delete ${pendingDelete?.name ?? 'this agent'}?`}
        className="max-w-md"
        footer={
          <>
            <Button onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete agent
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted">
          The agent is removed from your library. Councils that already used it keep
          their transcripts, but the agent will no longer be selectable.
        </p>
      </Modal>
    </div>
  )
}
