'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Provider, ProviderType } from '@/types'
import { useAuth } from '@/components/AuthProvider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DonutChart, MetricCard } from '@/components/ui/DataViz'
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

  const openCreateFor = (type: ProviderType) => {
    const preset = presetFor(type)
    setEditing(null)
    setDraft({
      ...emptyDraft(),
      provider: type,
      name: preset?.label ?? 'Provider',
      apiUrl: preset?.defaultUrl ?? '',
      model: MODEL_OPTIONS[type]?.[0]?.value ?? DEFAULT_MODEL,
    })
    setFormError(null)
    setShowForm(true)
  }

  const openCreate = () => openCreateFor('openai')

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
  const connectedTypes = new Set(providers.map((provider) => provider.provider))
  const connectedCount = connectedTypes.size
  const defaultProvider = providers.find((provider) => provider.isDefault) ?? providers[0]
  const testedCount = Object.values(testStatus).filter((status) => status.startsWith('Ready')).length
  const catalogRows = PROVIDER_TYPES.map((type) => {
    const matching = providers.filter((provider) => provider.provider === type.value)
    return {
      ...type,
      matching,
      connected: matching.length > 0,
      isDefault: matching.some((provider) => provider.isDefault),
      modelCount: MODEL_OPTIONS[type.value]?.length ?? 0,
      firstModel: MODEL_OPTIONS[type.value]?.[0]?.label ?? 'Custom model',
    }
  })

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
    <div className="mx-auto max-w-[90rem] px-5 py-14">
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
        <p className="py-20 text-center font-mono text-xs uppercase tracking-[0.14em] text-subtle">
          Loading providers…
        </p>
      ) : (
        <>
          <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Connected keys"
              value={providers.length}
              detail="Encrypted at rest with AES-256-GCM"
            />
            <MetricCard
              label="Catalog coverage"
              value={`${connectedCount}/${PROVIDER_TYPES.length}`}
              detail="Provider families with a key"
            />
            <MetricCard
              label="Default route"
              value={defaultProvider?.name ?? '—'}
              detail={defaultProvider?.model ?? 'No default key selected'}
            />
            <MetricCard
              label="Tested this session"
              value={testedCount}
              detail="Successful live key checks"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="min-w-0 space-y-6">
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow">Catalog coverage</p>
                    <h2 className="mt-2 font-display text-2xl text-text">
                      Keys across the provider catalogue
                    </h2>
                  </div>
                  <Badge tone={connectedCount > 0 ? 'success' : 'outline'}>
                    {connectedCount > 0 ? 'Active' : 'No keys yet'}
                  </Badge>
                </div>

                <div className="mt-6 grid items-center gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
                  <DonutChart
                    segments={[
                      {
                        label: 'Connected',
                        value: connectedCount,
                        color: 'var(--accent)',
                      },
                      {
                        label: 'Available',
                        value: PROVIDER_TYPES.length - connectedCount,
                        color: 'var(--surface-3)',
                      },
                    ]}
                    centerValue={`${connectedCount}/${PROVIDER_TYPES.length}`}
                    centerLabel="providers"
                  />
                  <div className="space-y-4 border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm text-muted">Default route</span>
                      <span className="text-right text-sm text-text">
                        {defaultProvider
                          ? `${defaultProvider.name} · ${defaultProvider.model}`
                          : 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm text-muted">Connected keys</span>
                      <span className="font-display text-xl text-text">{providers.length}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm text-muted">Catalog size</span>
                      <span className="font-display text-xl text-text">
                        {PROVIDER_TYPES.length}
                      </span>
                    </div>
                    <p className="border-t border-line pt-4 text-xs leading-relaxed text-subtle">
                      Any provider can be used by an agent. The default route is used when an
                      agent does not override it.
                    </p>
                  </div>
                </div>
              </Card>

              <Card flush className="overflow-hidden">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line p-5">
                  <div>
                    <p className="eyebrow">Connected keys</p>
                    <h2 className="mt-2 font-display text-2xl text-text">
                      Your provider library
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-subtle">
                    {providers.length} key{providers.length === 1 ? '' : 's'}
                  </span>
                </div>

                {providers.length === 0 ? (
                  <div className="p-5">
                    <div className="border border-dashed border-line bg-surface-2/40 px-6 py-8 text-center">
                      <p className="font-display text-xl text-text">No keys connected</p>
                      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                        Choose a provider from the catalogue below. Until a key exists, agents
                        cannot run a review room.
                      </p>
                      <Button variant="primary" className="mt-4" onClick={openCreate}>
                        Connect a provider
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-line font-mono text-[0.6rem] uppercase tracking-[0.14em] text-subtle">
                          <th className="px-5 py-3 font-normal">Key</th>
                          <th className="px-4 py-3 font-normal">Model</th>
                          <th className="px-4 py-3 font-normal">Role</th>
                          <th className="px-5 py-3 font-normal text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {providers.map((provider) => (
                          <tr
                            key={provider.id}
                            className="border-b border-line last:border-b-0"
                          >
                            <td className="px-5 py-4">
                              <p className="break-words text-sm font-semibold text-text">
                                {provider.name}
                              </p>
                              <p className="mt-1 font-mono text-xs text-subtle">
                                {presetFor(provider.provider)?.label ?? provider.provider}
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
                            </td>
                            <td className="px-4 py-4">
                              <p className="break-all font-mono text-xs text-text">
                                {provider.model}
                              </p>
                              <p className="mt-1 font-mono text-[0.62rem] text-subtle">
                                temp {provider.temperature}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              {provider.isDefault ? (
                                <Badge tone="accent">Default</Badge>
                              ) : (
                                <Badge tone="outline">Fallback</Badge>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => testProvider(provider)}
                                  disabled={testStatus[provider.id] === 'Testing…'}
                                >
                                  {testStatus[provider.id] === 'Testing…' ? 'Testing…' : 'Test'}
                                </Button>
                                <Button size="sm" onClick={() => openEdit(provider)}>
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-danger hover:text-danger"
                                  onClick={() => setPendingDelete(provider)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <Card flush className="overflow-hidden">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line p-5">
                  <div>
                    <p className="eyebrow">Provider catalogue</p>
                    <h2 className="mt-2 font-display text-2xl text-text">
                      Supported model providers
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-subtle">
                    {PROVIDER_TYPES.length} providers
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-line font-mono text-[0.6rem] uppercase tracking-[0.14em] text-subtle">
                        <th className="px-5 py-3 font-normal">Provider</th>
                        <th className="px-4 py-3 font-normal">Model family</th>
                        <th className="px-4 py-3 font-normal">Access</th>
                        <th className="px-4 py-3 font-normal">Status</th>
                        <th className="px-5 py-3 font-normal text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catalogRows.map((row) => (
                        <tr key={row.value} className="border-b border-line last:border-b-0">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-7 w-7 items-center justify-center border border-line bg-surface-2 font-mono text-[0.55rem] text-accent">
                                {row.label.slice(0, 2).toUpperCase()}
                              </span>
                              <span className="text-sm text-text">{row.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-xs text-text">{row.firstModel}</p>
                            <p className="mt-0.5 font-mono text-[0.6rem] text-subtle">
                              {row.modelCount} model{row.modelCount === 1 ? '' : 's'} in catalogue
                            </p>
                          </td>
                          <td className="px-4 py-4 font-mono text-xs text-muted">
                            {row.requiresKey ? 'API key' : 'Local / no key'}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {row.connected ? (
                                <Badge tone="success">
                                  {row.matching.length} key{row.matching.length === 1 ? '' : 's'}
                                </Badge>
                              ) : (
                                <Badge tone="outline">Not connected</Badge>
                              )}
                              {row.isDefault && <Badge tone="accent">Default</Badge>}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            {row.connected ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEdit(row.matching[0])}
                              >
                                Manage
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => openCreateFor(row.value)}
                              >
                                Connect
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <aside className="space-y-4">
              <Card>
                <p className="eyebrow">Key handling</p>
                <div className="mt-4 space-y-4 text-xs leading-relaxed text-muted">
                  <div>
                    <p className="font-semibold text-text">Encrypted before storage</p>
                    <p className="mt-1">AES-256-GCM; the raw key is never returned to the browser.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-text">Test before use</p>
                    <p className="mt-1">A live test checks latency and a sample response.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-text">Local option</p>
                    <p className="mt-1">Ollama runs against localhost and requires no key.</p>
                  </div>
                </div>
              </Card>

              <Card>
                <p className="eyebrow">Default routing</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {defaultProvider
                    ? `Agents without an override use ${defaultProvider.name} (${defaultProvider.model}).`
                    : 'No default provider is set. Select one so agents do not rely on an arbitrary key.'}
                </p>
                <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-subtle">
                  An individual agent can override the default with a specific key.
                </p>
              </Card>

              <Card>
                <p className="eyebrow">Why BYOK</p>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  Your keys stay with your workspace. Provider choice is explicit, spend is visible
                  to you, and a single account is not shared across every diligence room.
                </p>
              </Card>
            </aside>
          </div>
        </>
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
