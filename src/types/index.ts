export type ProviderType = 'openai' | 'anthropic' | 'google' | 'groq' | 'ollama' | 'deepseek' | 'mistral' | 'together' | 'openrouter' | 'perplexity' | 'huggingface' | 'custom'

export interface Provider {
  id: string
  name: string
  provider: ProviderType
  apiUrl: string
  apiKey: string // Stored encrypted
  model: string
  temperature: number
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Persona {
  id: string
  name: string
  bio: string
  personality?: string | null
  providerId?: string | null
  model?: string | null
  temperature?: number | null
  avatarUrl?: string | null
  createdAt: Date
  updatedAt: Date
  provider?: Provider
}

export interface Chat {
  id: string
  title: string
  topic?: string | null
  isAutoMode: boolean
  lastSpeakerId?: string | null
  createdAt: Date
  updatedAt: Date
  creatorId?: string | null
  messages?: Message[]
  participants?: PersonaOnChat[]
}

export interface Message {
  id: string
  content: string
  role: 'user' | 'persona' | 'system'
  personaId?: string | null
  personaName?: string | null
  chatId: string
  createdAt: Date
}

export interface PersonaOnChat {
  id: string
  personaId: string
  chatId: string
  joinedAt: Date
  persona?: Persona
}

export interface RateLimit {
  id: string
  key: string
  requests: number
  limit: number
  resetAt: Date
}
