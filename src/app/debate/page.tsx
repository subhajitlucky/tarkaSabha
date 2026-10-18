'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Provider, ProviderType } from '@/types'
import { useAuth } from '@/components/AuthProvider'
import { PageHeader } from '@/components/ui/EmptyState'

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

const PROVIDER_TYPES: { value: ProviderType; label: string; requiresKey: boolean; defaultUrl: string }[] = [
  { value: 'openai', label: 'OpenAI', requiresKey: true, defaultUrl: 'https://api.openai.com/v1' },
  { value: 'anthropic', label: 'Anthropic', requiresKey: true, defaultUrl: 'https://api.anthropic.com' },
  { value: 'google', label: 'Google Gemini', requiresKey: true, defaultUrl: 'https://generativelanguage.googleapis.com/v1beta' },
  { value: 'groq', label: 'Groq', requiresKey: true, defaultUrl: 'https://api.groq.com/openai/v1' },
  { value: 'ollama', label: 'Ollama (Local)', requiresKey: false, defaultUrl: 'http://localhost:11434/v1' },
  { value: 'deepseek', label: 'DeepSeek', requiresKey: true, defaultUrl: 'https://api.deepseek.com' },
  { value: 'mistral', label: 'Mistral AI', requiresKey: true, defaultUrl: 'https://api.mistral.ai/v1' },
  { value: 'together', label: 'Together AI', requiresKey: true, defaultUrl: 'https://api.together.ai/v1' },
  { value: 'openrouter', label: 'OpenRouter', requiresKey: true, defaultUrl: 'https://openrouter.ai/api/v1' },
  { value: 'perplexity', label: 'Perplexity', requiresKey: true, defaultUrl: 'https://api.perplexity.ai' },
  { value: 'huggingface', label: 'HuggingFace', requiresKey: true, defaultUrl: 'https://router.huggingface.co/v1' },
  { value: 'custom', label: 'Custom API', requiresKey: true, defaultUrl: '' },
]

type PersonaRole = 'contributor' | 'researcher' | 'critic' | 'planner' | 'synthesizer'

const ROLE_OPTIONS: { value: PersonaRole; label: string; hint: string }[] = [
  { value: 'contributor', label: 'Contributor', hint: 'Argues the strongest substantive point' },
  { value: 'researcher', label: 'Researcher', hint: 'Brings evidence and flags uncertainty' },
  { value: 'critic', label: 'Critic', hint: 'Attacks the weakest reasoning' },
  { value: 'planner', label: 'Planner', hint: 'Turns the discussion into concrete steps' },
  { value: 'synthesizer', label: 'Synthesizer', hint: 'Pulls the threads together' },
]

const TOOL_OPTIONS = [
  { value: 'web_search', label: 'Web search', hint: 'Find sources to ground a claim' },
  { value: 'fetch_url', label: 'Read a page', hint: 'Open a URL and read its text' },
  { value: 'calculator', label: 'Calculator', hint: 'Exact arithmetic, no guessing' },
]

const MODEL_OPTIONS: Record<ProviderType, { value: string; label: string }[]> = {  openai: [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'o1', label: 'o1' },
    { value: 'o1-mini', label: 'o1-mini' },
  ],
  anthropic: [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
    { value: 'claude-haiku-3-20250514', label: 'Claude Haiku 3' },
  ],
  google: [
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro' },
  ],
  groq: [
    { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B' },
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B' },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
  ],
  ollama: [
    { value: 'llama3.2', label: 'Llama 3.2' },
    { value: 'llama3.1', label: 'Llama 3.1' },
    { value: 'mistral', label: 'Mistral' },
    { value: 'codellama', label: 'CodeLlama' },
    { value: 'deepseek-r1', label: 'DeepSeek R1' },
  ],
  deepseek: [
    { value: 'deepseek-chat', label: 'DeepSeek Chat' },
    { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
  ],
  mistral: [
    { value: 'mistral-small', label: 'Mistral Small' },
    { value: 'mistral-medium', label: 'Mistral Medium' },
    { value: 'mistral-large', label: 'Mistral Large' },
  ],
  together: [
    { value: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', label: 'Llama 3.3 70B' },
    { value: 'meta-llama/Llama-3.1-405B-Instruct-Turbo', label: 'Llama 3.1 405B' },
    { value: 'Qwen/Qwen2.5-72B-Instruct', label: 'Qwen 2.5 72B' },
  ],
  openrouter: [
    { value: 'openrouter/auto', label: 'Auto-Select Best' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'openai/gpt-4o', label: 'GPT-4o' },
    { value: 'google/gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash' },
  ],
  perplexity: [
    { value: 'sonar', label: 'Sonar' },
    { value: 'sonar-pro', label: 'Sonar Pro' },
    { value: 'sonar-reasoning', label: 'Sonar Reasoning' },
  ],
  huggingface: [
    { value: 'meta-llama/Llama-3.3-70B-Instruct', label: 'Llama 3.3 70B' },
    { value: 'microsoft/Phi-4-mini-instruct', label: 'Phi-4 Mini' },
    { value: 'Qwen/Qwen2.5-72B-Instruct', label: 'Qwen 2.5 72B' },
  ],
  custom: [
    { value: 'custom', label: 'Custom Model' },
  ],
}

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
    model: 'gpt-3.5-turbo',
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
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
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
      model: 'gpt-3.5-turbo',
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
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-amber-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${'text-text'}`}>Debate Created!</h2>
          <p className={`mb-6 ${'text-muted'}`}>Your debate is ready</p>
          <button
            onClick={goToChat}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-semibold px-8 py-4 rounded-[3px] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
          >
            Enter Debate Room
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
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 shadow'
                        : 'text-muted hover:text-text'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
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
                    <label className="eyebrow mb-1.5 block">Model Name</label>
                    <input
                      type="text"
                      value={newAgent.model}
                      onChange={e => setNewAgent({ ...newAgent, model: e.target.value })}
                      placeholder="e.g., gpt-4, claude-opus-4"
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
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
                        <span className="truncate max-w-[90%]">
                          {(agent.name || '?')
                            .split(/\s+/)
                            .filter(Boolean)
                            .slice(0, 2)
                            .map(w => w[0]?.toUpperCase() || '')
                            .join('')}
                        </span>
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${'text-text'}`}>{agent.name}</div>
                        <div className="text-xs text-slate-500">
                          <span className="text-amber-500 font-semibold">{agent.role}</span>
                          {' · '}{agent.providerType} · {agent.model}
                          {agent.tools.length > 0 && ` · ${agent.tools.length} tool${agent.tools.length > 1 ? 's' : ''}`}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeAgent(agent.id)}
                      className="text-red-400 hover:text-red-300 p-1 cursor-pointer transition-colors"
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
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm mb-4">
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
