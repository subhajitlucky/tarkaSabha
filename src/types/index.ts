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
  mode?: ChatMode | string
  objective?: string | null
  deliverableSpec?: string | null
  audience?: string | null
  isAutoMode: boolean
  lastSpeakerId?: string | null
  /** Next scheduled turn; null when the chat is not running server-side. */
  autoAdvanceAt?: string | Date | null
  /** Turns left in a bounded run; null while running open-ended. */
  turnsRemaining?: number | null
  turnCount?: number
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

/** One rubric criterion's score for a candidate. */
export interface CriterionScore {
  key: string
  label: string
  score: number
  reason: string
}

/** A produced deliverable, stored separately from the transcript. */
export interface Artifact {
  id: string
  kind: string
  title: string
  content: string
  model?: string | null
  /** Weighted rubric score (0-10); null when judging did not run or failed. */
  score?: number | null
  breakdown?: CriterionScore[] | null
  /** True for the chosen candidate of the latest run. */
  selected?: boolean
  round?: number
  /** Generation angle that produced this candidate. */
  angle?: string | null
  createdAt: string | Date
}

export type ChatMode = 'debate' | 'task'

export type PersonaRole =
  | 'contributor'
  | 'researcher'
  | 'critic'
  | 'planner'
  | 'synthesizer'

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
