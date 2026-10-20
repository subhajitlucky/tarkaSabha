import type { CriterionScore } from './synthesis-rubric'

export interface InspectionMessage {
  id: string
  content: string
  role: string
  personaId: string | null
  personaName: string | null
  createdAt: string
  selectionReason: string | null
  inputTokens: number | null
  outputTokens: number | null
  latencyMs: number | null
  evidenceCount: number
}

export interface InspectionArtifact {
  id: string
  title: string
  model: string | null
  score: number | null
  breakdown: CriterionScore[] | null
  selected: boolean
  round: number
  angle: string | null
  createdAt: string
}

export interface RunInspection {
  ok: boolean
  chat: {
    title: string
    objective: string | null
    topic: string | null
    createdAt: string
    updatedAt: string
    turnCount: number
    participants: Array<{
      persona: {
        id: string
        name: string
        role: string
        model: string | null
        tools: string[]
      }
    }>
    messages: InspectionMessage[]
    artifacts: InspectionArtifact[]
  }
  summary: {
    turns: number
    measuredTurns: number
    toolCalls: number
    totalInputTokens: number
    totalOutputTokens: number
    totalLatencyMs: number
    candidates: number
  }
}
