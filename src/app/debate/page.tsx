'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Persona, Chat, Provider, ProviderType } from '@/types'
import { useAuth } from '@/components/AuthProvider'
import { useTheme } from '@/components/ThemeProvider'

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
  { value: 'huggingface', label: 'HuggingFace', requiresKey: true, defaultUrl: 'https://api-inference.huggingface.co/models' },
  { value: 'custom', label: 'Custom API', requiresKey: true, defaultUrl: '' },
]

const MODEL_OPTIONS: Record<ProviderType, { value: string; label: string }[]> = {
  openai: [
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
  const { session, isAuthenticated, isLoading: authLoading, signIn } = useAuth()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [providers, setProviders] = useState<Provider[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [createdChatId, setCreatedChatId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Debate creation state
  const [topic, setTopic] = useState('')
  const [agents, setAgents] = useState<Array<{
    id: string
    name: string
    bio: string
    personality: string
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
      <div className={`min-h-screen flex items-center justify-center ${isLight ? 'bg-slate-50' : 'bg-slate-950'}`}>
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
    setError(null)
    setIsCreating(true)

    try {
      const createdPersonas: string[] = []

      for (const agent of agents) {
        let providerId: string

        const existingProvider = providers.find(p =>
          p.provider === agent.providerType &&
          p.apiUrl === agent.apiUrl &&
          p.model === agent.model
        )

        if (existingProvider) {
          providerId = existingProvider.id
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
          const provider = await providerRes.json()
          providerId = provider.id
        }

        const personaRes = await fetch('/api/personas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: agent.name,
            bio: agent.bio || `I am ${agent.name}.`,
            personality: agent.personality || 'Friendly and conversational.',
            providerId,
          }),
        })
        const persona = await personaRes.json()
        createdPersonas.push(persona.id)
      }

      const chatRes = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: topic,
          topic,
          isAutoMode: true,
          creatorId: session?.user?.id,
        }),
      })
      const chat = await chatRes.json()

      await fetch(`/api/chats/${chat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addParticipantIds: createdPersonas,
        }),
      })

      setCreatedChatId(chat.id)
    } catch (err: any) {
      setError(err.message || 'Failed to create debate')
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
      <div className={`min-h-screen flex items-center justify-center ${isLight ? 'bg-slate-50' : 'bg-slate-950'}`}>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-amber-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>Debate Created!</h2>
          <p className={`mb-6 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Your debate is ready</p>
          <button
            onClick={goToChat}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-semibold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
          >
            Enter Debate Room
          </button>
        </div>
      </div>
    )
  }

  const cardClass = isLight 
    ? 'bg-white border border-slate-200 shadow-sm' 
    : 'bg-slate-900 border border-slate-800'
  
  const inputClass = isLight
    ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500'
    : 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-amber-500/50'

  return (
    <div className={`min-h-screen py-12 ${isLight ? 'bg-slate-50' : 'bg-slate-950'}`}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Start a New Debate
          </h1>
          <p className={`text-lg ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Create agents with unique identities and watch them discuss
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Step 1: Topic */}
          <div className={`${cardClass} rounded-2xl p-6`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <span className="text-amber-500 font-bold">1</span>
              </div>
              <h3 className={`text-xl font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Discussion Topic</h3>
            </div>

            <div>
              <label className={`block text-sm mb-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                What should they discuss?
              </label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g., Should AI replace doctors?"
                className={`w-full rounded-xl px-4 py-3 focus:outline-none transition-colors ${inputClass}`}
              />
              <p className="text-xs text-slate-500 mt-2">
                Personas will only remember messages related to this topic
              </p>
            </div>
          </div>

          {/* Step 2: Add Agents */}
          <div className={`${cardClass} rounded-2xl p-6`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <span className="text-orange-500 font-bold">2</span>
              </div>
              <h3 className={`text-xl font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Add Agents</h3>
            </div>

            {/* Agent Form */}
            <div className={`${isLight ? 'bg-slate-50 border border-slate-100' : 'bg-slate-800/50'} rounded-xl p-4 mb-4`}>
              <div className="grid gap-4">
                <div>
                  <label className={`block text-xs mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Agent Name *</label>
                  <input
                    type="text"
                    value={newAgent.name}
                    onChange={e => setNewAgent({ ...newAgent, name: e.target.value })}
                    placeholder="e.g., Dr. Sharma (village doctor)"
                    className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none ${inputClass}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Provider</label>
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
                    <label className={`block text-xs mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Model Name</label>
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
                  <label className={`block text-xs mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>API URL</label>
                  <input
                    type="text"
                    value={newAgent.apiUrl}
                    onChange={e => setNewAgent({ ...newAgent, apiUrl: e.target.value })}
                    className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none font-mono ${inputClass}`}
                  />
                </div>

                {PROVIDER_TYPES.find(p => p.value === newAgent.providerType)?.requiresKey && (
                  <div>
                    <label className={`block text-xs mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>API Key</label>
                    <input
                      type="password"
                      value={newAgent.apiKey}
                      onChange={e => setNewAgent({ ...newAgent, apiKey: e.target.value })}
                      placeholder="sk-..."
                      className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none font-mono ${inputClass}`}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Bio (optional)</label>
                    <input
                      type="text"
                      value={newAgent.bio}
                      onChange={e => setNewAgent({ ...newAgent, bio: e.target.value })}
                      placeholder="19 year old village boy..."
                      className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Personality (optional)</label>
                    <input
                      type="text"
                      value={newAgent.personality}
                      onChange={e => setNewAgent({ ...newAgent, personality: e.target.value })}
                      placeholder="Calm, wise..."
                      className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none ${inputClass}`}
                    />
                  </div>
                </div>

                <button
                  onClick={addAgent}
                  className={`px-4 py-2 rounded-lg text-sm transition-all cursor-pointer font-medium ${
                    isLight 
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' 
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
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
                    isLight ? 'bg-slate-50 border border-slate-100' : 'bg-slate-800/50'
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
                        <div className={`text-sm font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>{agent.name}</div>
                        <div className="text-xs text-slate-500">{agent.providerType} · {agent.model}</div>
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
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-slate-700 disabled:to-slate-700 text-slate-900 font-semibold px-4 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer disabled:cursor-not-allowed disabled:transform-none"
            >
              {isCreating ? 'Creating...' : `Start Debate with ${agents.length} Agents`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
