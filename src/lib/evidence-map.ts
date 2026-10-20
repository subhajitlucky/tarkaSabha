import type { EvidenceEntry } from '@/types'

export interface EvidenceSource extends EvidenceEntry {
  id: string
  messageId: string
  speaker: string
  createdAt: Date | string
}

export interface EvidenceClaim {
  id: string
  text: string
  status: 'linked' | 'unsupported'
  evidenceId: string | null
  reason: string
}

export interface EvidenceMap {
  claims: EvidenceClaim[]
  evidence: EvidenceSource[]
  toolCallCount: number
  messagesWithEvidence: number
  unsupportedCount: number
}

export interface EvidenceMessage {
  id: string
  speaker: string
  createdAt: Date | string
  evidence: unknown
}

const STOPWORDS = new Set([
  'about', 'after', 'again', 'against', 'also', 'because', 'been', 'before',
  'being', 'between', 'both', 'could', 'does', 'each', 'from', 'have', 'having',
  'into', 'more', 'most', 'other', 'over', 'same', 'should', 'some', 'such',
  'than', 'that', 'their', 'there', 'these', 'they', 'this', 'those', 'through',
  'under', 'until', 'very', 'what', 'when', 'where', 'which', 'while', 'with',
  'would', 'your', 'will', 'were', 'was', 'are', 'the', 'and', 'for', 'not',
  'but', 'can', 'may', 'use', 'using', 'used', 'its', 'it', 'is', 'as', 'at',
  'be', 'by', 'in', 'of', 'on', 'or', 'to', 'a', 'an',
])

export function claimTokens(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/https?:\/\/\S+/g, ' ')
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length > 3 && !STOPWORDS.has(token))
    )
  )
}

export function splitClaims(content: string): string[] {
  const withoutCode = content.replace(/```[\s\S]*?```/g, ' ')
  const withoutLinks = withoutCode.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  const cleaned = withoutLinks
    .replace(/\r/g, '')
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/[`*>]/g, '')

  return cleaned
    .split(/(?<=[.!?])\s+|\n+/)
    .map((claim) => claim.replace(/\s+/g, ' ').trim())
    .filter((claim) => claim.length >= 40 && claim.length <= 500)
    .slice(0, 12)
}

function asEvidence(value: unknown): EvidenceEntry[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is EvidenceEntry => {
    if (!entry || typeof entry !== 'object') return false
    const candidate = entry as Partial<EvidenceEntry>
    return (
      typeof candidate.name === 'string' &&
      typeof candidate.arguments === 'string' &&
      typeof candidate.ok === 'boolean' &&
      typeof candidate.preview === 'string'
    )
  })
}

export function buildEvidenceMap(input: {
  content: string | null
  messages: EvidenceMessage[]
}): EvidenceMap {
  const evidence: EvidenceSource[] = []
  let messagesWithEvidence = 0

  for (const message of input.messages) {
    const entries = asEvidence(message.evidence)
    if (entries.length > 0) messagesWithEvidence++
    entries.forEach((entry, index) => {
      evidence.push({
        ...entry,
        id: `${message.id}:${index}`,
        messageId: message.id,
        speaker: message.speaker,
        createdAt: message.createdAt,
      })
    })
  }

  const claims = input.content ? splitClaims(input.content) : []
  const mapped = claims.map((text, index): EvidenceClaim => {
    if (evidence.length === 0) {
      return {
        id: `claim-${index + 1}`,
        text,
        status: 'unsupported',
        evidenceId: null,
        reason: 'No tool evidence was recorded for this run.',
      }
    }

    const tokens = claimTokens(text)
    let best: { source: EvidenceSource; score: number } | null = null

    for (const source of evidence) {
      const sourceText = `${source.name} ${source.arguments} ${source.preview}`
      const sourceTokens = new Set(claimTokens(sourceText))
      const score = tokens.reduce((total, token) => total + (sourceTokens.has(token) ? 1 : 0), 0)
      if (score > 0 && (!best || score > best.score)) {
        best = { source, score }
      }
    }

    // One shared word is usually a coincidence. Two or more is still only a
    // lexical signal, which is why the UI asks the reader to inspect the source.
    if (best && best.score >= 2) {
      return {
        id: `claim-${index + 1}`,
        text,
        status: 'linked',
        evidenceId: best.source.id,
        reason: `Shares ${best.score} terms with a recorded ${best.source.name} call.`,
      }
    }

    return {
      id: `claim-${index + 1}`,
      text,
      status: 'unsupported',
      evidenceId: null,
      reason: 'No recorded tool evidence overlaps this claim.',
    }
  })

  return {
    claims: mapped,
    evidence,
    toolCallCount: evidence.length,
    messagesWithEvidence,
    unsupportedCount: mapped.filter((claim) => claim.status === 'unsupported').length,
  }
}
