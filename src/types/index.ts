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
  /** The job this agent does in a task, which shapes what it is told to do. */
  role?: PersonaRole | string | null
  /** Tool names granted to this agent, e.g. web_search, calculator. */
  tools?: string[] | null
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
  rubricPreset?: string
  isAutoMode: boolean
  isPublic?: boolean
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

export interface EvidenceEntry {
  name: string
  arguments: string
  ok: boolean
  preview: string
}

export interface Message {
  id: string
  content: string
  role: 'user' | 'persona' | 'system'
  personaId?: string | null
  personaName?: string | null
  evidence?: EvidenceEntry[] | null
  selectionReason?: string | null
  inputTokens?: number | null
  outputTokens?: number | null
  latencyMs?: number | null
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

/* --------------------------------------------------------- decision workspace */

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'REVIEWER' | 'VIEWER'
export type DecisionStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'ARCHIVED'
export type DecisionImpact = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type EvidenceKind = 'CODE' | 'COMMIT' | 'DOC' | 'TEST' | 'CONFIG' | 'OTHER'
export type EvidenceStatus = 'VERIFIED' | 'DISPUTED' | 'UNSUPPORTED' | 'INFERRED' | 'OPEN'
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW'

export interface WorkspaceSummary {
  id: string
  name: string
  description?: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    decisions: number
    memberships: number
  }
}

export interface DecisionSummary {
  id: string
  title: string
  summary?: string | null
  status: DecisionStatus | string
  impact: DecisionImpact | string
  updatedAt: string
  owner?: { name: string | null } | null
  _count?: {
    evidence: number
    approvals: number
  }
}

export interface WorkspaceDetail extends Omit<WorkspaceSummary, '_count'> {
  role: WorkspaceRole
  decisions: DecisionSummary[]
  memberships: Array<{
    id: string
    role: WorkspaceRole | string
    user: { name: string | null; email: string | null }
  }>
  _count?: {
    decisions: number
  }
}

export interface EvidenceRecord {
  id: string
  kind: EvidenceKind | string
  source: string
  commit?: string | null
  quote: string
  sha256?: string | null
  status: EvidenceStatus | string
  confidence: Confidence | string
  createdAt: string
}

export interface ApprovalRecord {
  id: string
  role: string
  status: string
  note?: string | null
  createdAt: string
  decidedAt?: string | null
  actor?: { name: string | null; email: string | null } | null
}

export interface ReportRecord {
  id: string
  version: number
  status: string
  createdAt: string
  publishedAt?: string | null
}

export interface DecisionDetail {
  id: string
  workspaceId: string
  title: string
  summary?: string | null
  status: DecisionStatus | string
  impact: DecisionImpact | string
  createdAt: string
  updatedAt: string
  role: WorkspaceRole
  workspace: { id: string; name: string }
  reviewRoom?: { id: string; title: string } | null
  owner?: { name: string | null; email: string | null } | null
  createdBy?: { name: string | null; email: string | null } | null
  evidence: EvidenceRecord[]
  approvals: ApprovalRecord[]
  reports: ReportRecord[]
}
