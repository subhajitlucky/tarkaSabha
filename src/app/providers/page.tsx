'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Provider, ProviderType } from '@/types'
import { useAuth } from '@/components/AuthProvider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { EmptyState, PageHeader } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { DEFAULT_MODEL, MODEL_OPTIONS, PROVIDER_TYPES } from '@/lib/provider-catalog'

interface Draft {
  name: string
  provider: ProviderType
  apiUrl: string
  apiKey: string
  model: string
  temperature: number
  isDefault: boolean
}

const presetFor = (type: ProviderType) => PROVIDER_TYPES.find((p) => p.value === type)

const emptyDraft = (): Draft => ({
  name: 'OpenAI',
  provider: 'openai',
  apiUrl: presetFor('openai')?.defaultUrl ?? '',
  apiKey: '',
  model: DEFAULT_MODEL,
  temperature: 0.7,
  isDefault: false,
})

/** The API returns the key masked, so a round-trip must not be mistaken for a new one. */
const MASK = '********'

export default function ProvidersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState<Provider | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Provider | null>(null)
  const [testStatus, setTestStatus] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/providers')
      if (!res.ok) throw new Error()
      setProviders(await res.json())
    } catch {
      setError('Could not load your providers.')
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
    setDraft(emptyDraft())
    setFormError(null)
    setShowForm(true)
  }

  const openEdit = (provider: Provider) => {
    setEditing(provider)
    setDraft({
      name: provider.name,
      provider: provider.provider,
      apiUrl: provider.apiUrl,
      // Left masked: the API treats a value containing '*' as "keep the stored key".
      apiKey: MASK,
      model: provider.model,
      temperature: provider.temperature,
      isDefault: provider.isDefault,
    })
    setFormError(null)
    setShowForm(true)
  }

  const chooseType = (type: ProviderType) => {
    const preset = presetFor(type)
    setDraft((d) => ({
      ...d,
      provider: type,
      apiUrl: preset?.defaultUrl ?? '',
      // Only overwrite the model when it is still whatever the last preset set.
      model: MODEL_OPTIONS[type]?.[0]?.value ?? d.model,
      name: preset?.label ?? d.name,
    }))
  }

  const save = async () => {
    setSaving(true)
    setFormError(null)
    try {
      const preset = presetFor(draft.provider)
      const body: Record<string, unknown> = {
        name: draft.name.trim(),
        provider: draft.provider,
        apiUrl: draft.apiUrl.trim(),
        model: draft.model.trim(),
        temperature: draft.temperature,
        isDefault: draft.isDefault,
      }
      // Omit the key entirely when editing and it is still masked, so the stored
      // value is preserved rather than replaced with asterisks.
      if (!(editing && draft.apiKey === MASK)) {
        if (!draft.apiKey.trim() && preset?.requiresKey !== false) {
          throw new Error('This provider needs an API key.')
        }
        body.apiKey = draft.apiKey.trim()
      }

      const res = await fetch(
        editing ? `/api/providers/${editing.id}` : '/api/providers',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Could not save the provider')
      }

      setShowForm(false)
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save the provider')
    } finally {
      setSaving(false)
    }
  }

  const testProvider = async (provider: Provider) => {
    setTestStatus((current) => ({ ...current, [provider.id]: 'Testing…' }))
    try {
      const res = await fetch(`/api/providers/${provider.id}/test`, { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || 'The provider test failed')
      }
      setTestStatus((current) => ({
        ...current,
        [provider.id]: `Ready · ${data.latencyMs} ms${data.sample ? ` · “${data.sample}”` : ''}`,
      }))
    } catch (err) {
      setTestStatus((current) => ({
        ...current,
        [provider.id]: err instanceof Error ? err.message : 'The provider test failed',
      }))
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const target = pendingDelete
    setPendingDelete(null)
    try {
      const res = await fetch(`/api/providers/${target.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setProviders((current) => current.filter((p) => p.id !== target.id))
    } catch {
      setError(`Could not delete ${target.name}.`)
    }
  }

  const preset = presetFor(draft.provider)

  if (authLoading) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-14">
        <p className="eyebrow">Loading…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-14">
        <EmptyState
          title="Sign in to manage providers"
          description="Keys are encrypted against your account and never leave the server."
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
    <div className="mx-auto max-w-4xl px-5 py-14">
      <PageHeader
        eyebrow="Providers"
        title="Model providers"
        lede="Bring your own key from any of twelve providers. Keys are encrypted with AES-256-GCM before storage and are never sent to the browser."
        actions={
          <Button variant="primary" onClick={openCreate}>
            New provider
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

      {loading ? (
        <p className="py-16 text-center font-mono text-xs uppercase tracking-[0.14em] text-subtle">
          Loading…
        </p>
      ) : providers.length === 0 ? (
        <EmptyState
          title="No providers configured"
          description="Agents cannot answer without one. Add a key from OpenAI, Anthropic, Google, or any of the others."
          action={
            <Button variant="primary" onClick={openCreate}>
              Add a provider
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {providers.map((provider) => (
            <li key={provider.id}>
              <Card className="flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-display text-base text-text">
                      {provider.name}
                    </h2>
                    {provider.isDefault && <Badge tone="accent">Default</Badge>}
                  </div>
                  <p className="mt-1 font-mono text-xs text-subtle">
                    {presetFor(provider.provider)?.label ?? provider.provider}
                    <span className="mx-1.5">·</span>
                    {provider.model}
                    <span className="mx-1.5">·</span>
                    temp {provider.temperature}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-xs text-subtle">
                    {provider.apiUrl}
                  </p>
                  {testStatus[provider.id] && (
                    <p
                      role="status"
                      className={`mt-1 text-xs ${
                        testStatus[provider.id].startsWith('Ready')
                          ? 'text-success'
                          : testStatus[provider.id] === 'Testing…'
                            ? 'text-subtle'
                            : 'text-danger'
                      }`}
                    >
                      {testStatus[provider.id]}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => testProvider(provider)}
                    disabled={testStatus[provider.id] === 'Testing…'}
                  >
                    {testStatus[provider.id] === 'Testing…' ? 'Testing…' : 'Test key'}
                  </Button>
                  <Button size="sm" onClick={() => openEdit(provider)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPendingDelete(provider)}>
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
        eyebrow={editing ? 'Edit provider' : 'New provider'}
        title={editing ? editing.name : 'Connect a provider'}
        footer={
          <>
            <Button onClick={() => setShowForm(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add provider'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Provider">
            <Select
              value={draft.provider}
              onChange={(e) => chooseType(e.target.value as ProviderType)}
            >
              {PROVIDER_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Label" hint="How this key is named in your library.">
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </Field>

          <Field
            label="API key"
            hint={
              editing
                ? 'Leave as shown to keep the stored key.'
                : preset?.requiresKey === false
                  ? 'Not required for a local model.'
                  : 'Stored encrypted; never returned to the browser.'
            }
          >
            <Input
              type={draft.apiKey === MASK ? 'text' : 'password'}
              value={draft.apiKey}
              onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
              placeholder={preset?.requiresKey === false ? 'not required' : 'sk-…'}
              autoComplete="off"
            />
          </Field>

          <Field label="API URL">
            <Input
              value={draft.apiUrl}
              onChange={(e) => setDraft({ ...draft, apiUrl: e.target.value })}
              placeholder={preset?.defaultUrl || 'https://…'}
            />
          </Field>

          <Field
            label="Model"
            hint="Free text: type any model this key can reach."
          >
            <Input
              value={draft.model}
              onChange={(e) => setDraft({ ...draft, model: e.target.value })}
              placeholder={MODEL_OPTIONS[draft.provider]?.[0]?.value ?? 'model-name'}
            />
          </Field>

          <Field label="Temperature" hint={`${draft.temperature} — lower is more measured.`}>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={draft.temperature}
              onChange={(e) =>
                setDraft({ ...draft, temperature: Number(e.target.value) })
              }
              className="w-full accent-[var(--accent)]"
            />
          </Field>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={draft.isDefault}
              onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })}
              className="h-3.5 w-3.5 accent-[var(--accent)]"
            />
            Use as the default provider
          </label>

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
        title={`Delete ${pendingDelete?.name ?? 'this provider'}?`}
        className="max-w-md"
        footer={
          <>
            <Button onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete provider
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted">
          The encrypted key is destroyed with it. Agents that pointed at this provider
          fall back to the default, and councils that used it keep their transcripts.
        </p>
      </Modal>
    </div>
  )
}
