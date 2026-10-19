'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Persona, Provider } from '@/types'
import { useAuth } from '@/components/AuthProvider'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
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

  if (authLoading) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-14">
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
    <div className="mx-auto max-w-5xl px-5 py-14">
      <PageHeader
        eyebrow="Agents"
        title="Your council members"
        lede="Each agent has a job and, optionally, tools to check its own claims. Define them once and reuse them in any council."
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
            You have no provider yet, so agents cannot be given a model. You can still
            create them — they will fall back to the default provider when one exists.{' '}
            <Link href="/providers" className="text-accent hover:text-accent-hover">
              Add a provider
            </Link>
          </p>
        </Card>
      )}

      {loading ? (
        <p className="py-16 text-center font-mono text-xs uppercase tracking-[0.14em] text-subtle">
          Loading…
        </p>
      ) : personas.length === 0 ? (
        <EmptyState
          title="No agents yet"
          description="A researcher gathers evidence, a critic attacks the weakest reasoning, a synthesizer pulls the threads together."
          action={
            <Button variant="primary" onClick={openCreate}>
              Create the first agent
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {personas.map((persona) => (
            <li key={persona.id}>
              <Card className="flex h-full flex-col">
                <div className="flex items-start gap-3">
                  <Avatar name={persona.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-display text-base text-text">
                      {persona.name}
                    </h2>
                    <p className="mt-0.5 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-accent">
                      {roleLabel(persona.role)}
                    </p>
                  </div>
                </div>

                <p className="mt-3 line-clamp-3 text-[0.8125rem] leading-relaxed text-muted">
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

                <p className="mt-3 font-mono text-[0.625rem] text-subtle">
                  {persona.provider?.name
                    ? `via ${persona.provider.name}`
                    : 'default provider'}
                </p>

                <div className="mt-auto flex gap-2 pt-4">
                  <Button size="sm" onClick={() => openEdit(persona)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPendingDelete(persona)}>
                    Delete
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
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
