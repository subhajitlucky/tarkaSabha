'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Provider, ProviderType } from '@/types'
import { useAuth } from '@/components/AuthProvider'
import {
  DEFAULT_MODEL,
  MODEL_OPTIONS,
  PROVIDER_TYPES,
  ROLE_OPTIONS,
  TOOL_OPTIONS,
} from '@/lib/provider-catalog'
import { PageHeader } from '@/components/ui/EmptyState'
import { Avatar } from '@/components/ui/Avatar'

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}


type PersonaRole = 'contributor' | 'researcher' | 'critic' | 'planner' | 'synthesizer'



// Debates make many calls per run (one per agent turn, plus two per synthesis
// candidate), so the default trades a little quality for a lot of cost. The
// field is free text: anything the account can reach will work.

export default function DebatePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [providers, setProviders] = useState<Provider[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [createdChatId, setCreatedChatId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Debate creation state
  const [topic, setTopic] = useState('')
  const [mode, setMode] = useState<'debate' | 'task'>('task')
  const [objective, setObjective] = useState('')
  const [deliverableSpec, setDeliverableSpec] = useState('')
  const [audience, setAudience] = useState('')
  const [agents, setAgents] = useState<Array<{
    id: string
    name: string
    bio: string
    personality: string
    role: PersonaRole
    tools: string[]
    providerType: ProviderType
    apiUrl: string
    apiKey: string
    model: string
    temperature: number
  }>>([])
  const [newAgent, setNewAgent] = useState({
    name: '',
    bio: '',
    personality: '',
    role: 'contributor' as PersonaRole,
    tools: [] as string[],
    providerType: 'openai' as ProviderType,
    apiUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: DEFAULT_MODEL,
    temperature: 0.7,
  })

  // Fetch providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      const res = await fetch('/api/providers')
      const data = await res.json()
      setProviders(data)
    }
    fetchProviders()
  }, [])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?callbackUrl=/debate')
    }
  }, [authLoading, isAuthenticated, router])

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${'bg-bg'}`}>
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-[3px] animate-spin" />
      </div>
    )
  }

  // Don't render anything while redirecting
  if (!isAuthenticated) {
    return null
  }

  const handleProviderTypeChange = (type: ProviderType) => {
    const providerInfo = PROVIDER_TYPES.find(p => p.value === type)
    setNewAgent({
      ...newAgent,
      providerType: type,
      apiUrl: providerInfo?.defaultUrl || '',
      model: MODEL_OPTIONS[type][0]?.value || 'custom',
    })
  }

  const addAgent = () => {
    if (!newAgent.name.trim()) {
      setError('Agent name is required')
      return
    }
    setAgents([...agents, { ...newAgent, id: Date.now().toString() }])
    setNewAgent({
      name: '',
      bio: '',
      personality: '',
      role: 'contributor',
      tools: [],
      providerType: 'openai',
      apiUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model: DEFAULT_MODEL,
      temperature: 0.7,
    })
    setError(null)
  }

  const removeAgent = (id: string) => {
    setAgents(agents.filter(a => a.id !== id))
  }

  const createDebate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic for the debate')
      return
    }
    if (agents.length < 2) {
      setError('You need at least 2 agents to start a debate')
      return
    }

    // Catch a missing key here rather than letting the provider POST 400 and
    // silently produce a debate whose every turn fails.
    const missingKey = agents.find((agent) => {
      const option = PROVIDER_TYPES.find((o) => o.value === agent.providerType)
      return option?.requiresKey && !agent.apiKey.trim()
    })
    if (missingKey) {
      setError(`${missingKey.name} needs an API key`)
      return
    }

    setError(null)
    setIsCreating(true)

    const createdPersonas: string[] = []

    try {
      for (const agent of agents) {
        let providerId: string

        const existingProvider = providers.find(p =>
          p.provider === agent.providerType &&
          p.apiUrl === agent.apiUrl &&
          p.model === agent.model
        )

        if (existingProvider) {
          providerId = existingProvider.id

          // The client only ever receives a masked key, so it cannot tell whether
          // the stored one differs from what was just typed. Push the typed key
          // through, otherwise a corrected key would be silently discarded.
          if (agent.apiKey.trim()) {
            const updateRes = await fetch(`/api/providers/${existingProvider.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                apiKey: agent.apiKey,
                model: agent.model,
                temperature: agent.temperature,
              }),
            })
            if (!updateRes.ok) {
              const body = await updateRes.json().catch(() => null)
              throw new Error(body?.error || `Could not update the provider for ${agent.name}`)
            }
          }
        } else {
          const providerRes = await fetch('/api/providers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `${agent.name}'s Provider`,
              provider: agent.providerType,
              apiUrl: agent.apiUrl,
              apiKey: agent.apiKey,
              model: agent.model,
              temperature: agent.temperature,
            }),
          })
          const provider = await providerRes.json().catch(() => null)
          if (!providerRes.ok || !provider?.id) {
            throw new Error(provider?.error || `Could not save the provider for ${agent.name}`)
          }
          providerId = provider.id
        }

        const personaRes = await fetch('/api/personas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: agent.name,
            bio: agent.bio || `I am ${agent.name}.`,
            personality: agent.personality || 'Friendly and conversational.',
            role: agent.role,
            tools: agent.tools,
            providerId,
          }),
        })
        const persona = await personaRes.json().catch(() => null)
        if (!personaRes.ok || !persona?.id) {
          throw new Error(persona?.error || `Could not create ${agent.name}`)
        }
        createdPersonas.push(persona.id)
      }

      const chatRes = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: topic,
          topic,
          mode,
          objective: mode === 'task' ? objective : null,
          deliverableSpec: mode === 'task' ? deliverableSpec : null,
          audience: mode === 'task' ? audience : null,
          isAutoMode: true,
        }),
      })
      const chat = await chatRes.json().catch(() => null)
      if (!chatRes.ok || !chat?.id) {
        throw new Error(chat?.error || 'Could not create the debate room')
      }

      const linkRes = await fetch(`/api/chats/${chat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addParticipantIds: createdPersonas,
        }),
      })
      if (!linkRes.ok) {
        const body = await linkRes.json().catch(() => null)
        throw new Error(body?.error || 'Could not add the agents to the debate')
      }

      setCreatedChatId(chat.id)
    } catch (err: unknown) {
      // Roll back the personas this attempt created. Leaving them behind produced
      // orphans the user could neither see nor delete from the UI.
      await Promise.allSettled(
        createdPersonas.map((personaId) =>
          fetch(`/api/personas/${personaId}`, { method: 'DELETE' })
        )
      )
      setError(getErrorMessage(err, 'Failed to create debate'))
      setIsCreating(false)
    }
  }

  const goToChat = () => {
    if (createdChatId) {
      router.push(`/chat/${createdChatId}`)
    }
  }

  if (createdChatId) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${'bg-bg'}`}>
        <div className="text-center">
          <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-[3px] border border-accent-line bg-accent-soft font-display text-2xl text-accent">
            त
          </span>
          <h2 className="text-2xl text-text">The council is convened</h2>
          <p className="mb-6 mt-2 text-sm text-muted">
            Take your seat, then start the discussion or let the agents work on their own.
          </p>
          <button
            onClick={goToChat}
            className="cursor-pointer rounded-[3px] border border-accent bg-accent px-6 py-3 font-medium text-accent-ink transition-colors hover:bg-accent-hover"
          >
            Enter the council
          </button>
        </div>
      </div>
    )
  }

  const cardClass = 'bg-surface border border-line'
  
  const inputClass =
    'bg-surface-2 border border-line text-text placeholder:text-subtle focus:border-accent'

  return (
    <div className={`min-h-screen py-12 ${'bg-bg'}`}>
      <div className="max-w-6xl mx-auto px-6">
        <PageHeader
          eyebrow="New council"
          title="Convene a council"
          lede="State what you need, then assemble agents with distinct jobs and the tools to check their own claims."
        />

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Step 1: Brief */}
          <div className={`${cardClass} rounded-[4px] p-6`}>
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-xs text-accent">01</span>
              <h3 className={`text-xl font-semibold ${'text-text'}`}>
                {mode === 'task' ? 'What do you need?' : 'Discussion Topic'}
              </h3>
            </div>

            <div className="mb-6">
              <label className="eyebrow mb-2 block">
                Mode
              </label>
              <div className={`inline-flex p-1 rounded-[3px] border ${'bg-surface-2 border-line'}`}>
                {([
                  { value: 'task', label: 'Task', hint: 'Agents cooperate and produce a deliverable' },
                  { value: 'debate', label: 'Debate', hint: 'Agents argue in character' },
                ] as const).map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMode(option.value)}
                    title={option.hint}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                      mode === option.value
                        ? 'border-accent bg-accent text-accent-ink'
                        : 'text-muted hover:text-text'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-subtle">
                {mode === 'task'
                  ? 'Agents work together on your objective. Synthesise a final deliverable when they are done.'
                  : 'Agents stay stubbornly in character and argue. For entertainment, not for getting an answer.'}
              </p>
            </div>

            <div>
              <label className="eyebrow mb-2 block">
                {mode === 'task' ? 'Short title' : 'What should they discuss?'}
              </label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder={mode === 'task' ? 'e.g., Buy vs rent in Bengaluru' : 'e.g., Should AI replace doctors?'}
                className={`w-full rounded-[3px] px-4 py-3 focus:outline-none transition-colors ${inputClass}`}
              />
            </div>

            {mode === 'task' && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="eyebrow mb-2 block">
                    Objective
                  </label>
                  <textarea
                    value={objective}
                    onChange={e => setObjective(e.target.value)}
                    rows={2}
                    placeholder="What exactly should they work out?"
                    className={`w-full rounded-[3px] px-4 py-3 focus:outline-none transition-colors resize-none ${inputClass}`}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="eyebrow mb-2 block">
                      Deliverable
                    </label>
                    <input
                      type="text"
                      value={deliverableSpec}
                      onChange={e => setDeliverableSpec(e.target.value)}
                      placeholder="e.g., A one-page recommendation"
                      className={`w-full rounded-[3px] px-4 py-3 focus:outline-none transition-colors ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="eyebrow mb-2 block">
                      Audience
                    </label>
                    <input
                      type="text"
                      value={audience}
                      onChange={e => setAudience(e.target.value)}
                      placeholder="e.g., A first-time buyer"
                      className={`w-full rounded-[3px] px-4 py-3 focus:outline-none transition-colors ${inputClass}`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Add Agents */}
          <div className={`${cardClass} rounded-[4px] p-6`}>
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-xs text-accent">02</span>
              <h3 className={`text-xl font-semibold ${'text-text'}`}>Add Agents</h3>
            </div>

            {/* Agent Form */}
            <div className={`${'bg-surface-2 border border-line'} rounded-[3px] p-4 mb-4`}>
              <div className="grid gap-4">
                <div>
                  <label className="eyebrow mb-1.5 block">Agent Name *</label>
                  <input
                    type="text"
                    value={newAgent.name}
                    onChange={e => setNewAgent({ ...newAgent, name: e.target.value })}
                    placeholder="e.g., Dr. Sharma (village doctor)"
                    className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none ${inputClass}`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="eyebrow mb-1.5 block">Provider</label>
                    <select
                      value={newAgent.providerType}
                      onChange={e => handleProviderTypeChange(e.target.value as ProviderType)}
                      className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none ${inputClass}`}
                    >
                      {PROVIDER_TYPES.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="eyebrow mb-1.5 block">Model name</label>
                    <input
                      type="text"
                      value={newAgent.model}
                      onChange={e => setNewAgent({ ...newAgent, model: e.target.value })}
                      placeholder="e.g., gpt-5.4-mini, claude-sonnet-4-20250514"
                      className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none font-mono ${inputClass}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="eyebrow mb-1.5 block">API URL</label>
                  <input
                    type="text"
                    value={newAgent.apiUrl}
                    onChange={e => setNewAgent({ ...newAgent, apiUrl: e.target.value })}
                    className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none font-mono ${inputClass}`}
                  />
                </div>

                {PROVIDER_TYPES.find(p => p.value === newAgent.providerType)?.requiresKey && (
                  <div>
                    <label className="eyebrow mb-1.5 block">API Key</label>
                    <input
                      type="password"
                      value={newAgent.apiKey}
                      onChange={e => setNewAgent({ ...newAgent, apiKey: e.target.value })}
                      placeholder="sk-..."
                      className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none font-mono ${inputClass}`}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="eyebrow mb-1.5 block">Bio (optional)</label>
                    <input
                      type="text"
                      value={newAgent.bio}
                      onChange={e => setNewAgent({ ...newAgent, bio: e.target.value })}
                      placeholder="19 year old village boy..."
                      className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="eyebrow mb-1.5 block">Personality (optional)</label>
                    <input
                      type="text"
                      value={newAgent.personality}
                      onChange={e => setNewAgent({ ...newAgent, personality: e.target.value })}
                      placeholder="Calm, wise..."
                      className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none ${inputClass}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="eyebrow mb-1.5 block">
                    Role in the task
                  </label>
                  <select
                    value={newAgent.role}
                    onChange={e => setNewAgent({ ...newAgent, role: e.target.value as PersonaRole })}
                    className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none ${inputClass}`}
                  >
                    {ROLE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label} — {option.hint}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="eyebrow mb-1.5 block">
                    Tools
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {TOOL_OPTIONS.map(tool => (
                      <label
                        key={tool.value}
                        title={tool.hint}
                        className={`flex items-center gap-2 text-xs cursor-pointer ${'text-muted'}`}
                      >
                        <input
                          type="checkbox"
                          checked={newAgent.tools.includes(tool.value)}
                          onChange={e => setNewAgent({
                            ...newAgent,
                            tools: e.target.checked
                              ? [...newAgent.tools, tool.value]
                              : newAgent.tools.filter(name => name !== tool.value),
                          })}
                          className="accent-amber-500"
                        />
                        {tool.label}
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={addAgent}
                  className="w-full cursor-pointer rounded-[3px] border border-line-strong bg-surface px-4 py-2.5 text-sm text-text transition-colors hover:border-accent hover:text-accent" 
                >
                  + Add Agent
                </button>
              </div>
            </div>

            {/* Added Agents List */}
            {agents.length > 0 && (
              <div className="space-y-2 mb-4">
                {agents.map((agent) => (
                  <div key={agent.id} className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                    'bg-surface-2 border border-line'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Avatar name={agent.name} size="sm" />
                      <div>
                        <div className={`text-sm font-medium ${'text-text'}`}>{agent.name}</div>
                        <div className="text-xs text-subtle">
                          <span className="font-mono text-accent">{agent.role}</span>
                          {' · '}{agent.providerType} · {agent.model}
                          {agent.tools.length > 0 && ` · ${agent.tools.length} tool${agent.tools.length > 1 ? 's' : ''}`}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeAgent(agent.id)}
                      className="cursor-pointer rounded-[3px] p-1 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div role="alert" className="mb-4 rounded-[3px] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
                {error}
              </div>
            )}

            <button
              onClick={createDebate}
              disabled={isCreating || agents.length < 2}
              className="w-full cursor-pointer rounded-[3px] border border-accent bg-accent px-4 py-3.5 font-medium text-accent-ink transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-2 disabled:text-subtle" 
            >
              {isCreating ? 'Creating...' : `Start Debate with ${agents.length} Agents`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
