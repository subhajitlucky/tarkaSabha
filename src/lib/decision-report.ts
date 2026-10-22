import { createHash } from 'node:crypto'

export interface ReportDecision {
  id: string
  title: string
  summary?: string | null
  status: string
  impact: string
  debtScore?: number | null
  debtRationale?: string | null
  revisitAt?: Date | string | null
  outcome?: string | null
  outcomeSummary?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  owner?: { name: string | null; email: string | null } | null
  workspace: { name: string }
}

export interface ReportEvidence {
  kind: string
  source: string
  commit?: string | null
  quote: string
  sha256?: string | null
  status: string
  confidence: string
}

export interface ReportPin {
  decisionPoint: string
  chosenValue: string
  separatingTest: string
  expectedResult?: string | null
  codeScope?: string | null
  status: string
  lastRunAt?: Date | string | null
  lastRunResult?: string | null
  supersessionTrigger?: string | null
  owner?: { name: string | null; email: string | null } | null
}

export interface ReportApproval {
  role: string
  status: string
  note?: string | null
  createdAt: Date | string
  decidedAt?: Date | string | null
  contentHash?: string | null
  actor?: { name: string | null; email: string | null } | null
}

export interface BuildReportInput {
  decision: ReportDecision
  evidence: ReportEvidence[]
  approvals: ReportApproval[]
  pins?: ReportPin[]
  generatedAt?: Date
}

export function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function iso(value: Date | string | null | undefined): string {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toISOString()
}

function ownerName(owner: ReportDecision['owner']): string {
  return owner?.name || owner?.email || 'Unassigned'
}

function actorName(actor: ReportApproval['actor']): string {
  return actor?.name || actor?.email || 'Unknown member'
}

/** Deterministic Markdown for a single decision evidence record. */
export function buildDecisionReport({
  decision,
  evidence,
  approvals,
  pins = [],
  generatedAt = new Date(),
}: BuildReportInput): string {
  const lines: string[] = []

  lines.push(`# Decision Evidence Report — ${decision.title}`, '')
  lines.push(
    `_Generated ${iso(generatedAt)} from Tarka Sabha. This report reproduces recorded evidence and approval events; it does not independently verify sources._`,
    ''
  )

  lines.push('## Record', '')
  lines.push(`- **Workspace:** ${decision.workspace.name}`)
  lines.push(`- **Decision:** ${decision.title}`)
  lines.push(`- **Status:** ${decision.status.replaceAll('_', ' ')}`)
  lines.push(`- **Impact:** ${decision.impact}`)
  lines.push(`- **Owner:** ${ownerName(decision.owner)}`)
  lines.push(
    `- **Decision debt:** ${decision.debtScore ?? 0}/100${
      decision.debtRationale ? ` — ${decision.debtRationale.replace(/\n/g, '; ')}` : ''
    }`
  )
  lines.push(`- **Outcome:** ${decision.outcome || 'Not recorded'}`)
  if (decision.outcomeSummary) lines.push(`- **Outcome summary:** ${decision.outcomeSummary}`)
  lines.push(`- **Revisit:** ${decision.revisitAt ? iso(decision.revisitAt) : 'Not scheduled'}`)
  lines.push(`- **Created:** ${iso(decision.createdAt)}`)
  lines.push(`- **Updated:** ${iso(decision.updatedAt)}`, '')

  lines.push('## Context', '')
  lines.push(decision.summary?.trim() || '_No context recorded._', '')

  lines.push('## Evidence', '')
  if (evidence.length === 0) {
    lines.push('_No evidence recorded._', '')
  } else {
    evidence.forEach((item, index) => {
      lines.push(`### ${index + 1}. ${item.kind} — ${item.status} (${item.confidence} confidence)`, '')
      lines.push(`- **Source:** \`${item.source}\``)
      if (item.commit) lines.push(`- **Commit:** \`${item.commit}\``)
      if (item.sha256) lines.push(`- **SHA-256:** \`${item.sha256}\``)
      lines.push('')
      lines.push(
        ...item.quote
          .split(/\r?\n/)
          .map((line) => `> ${line}`)
      )
      lines.push('')
    })
  }

  lines.push('## Decision pins', '')
  if (pins.length === 0) {
    lines.push('_No decision pins recorded._', '')
  } else {
    pins.forEach((pin, index) => {
      lines.push(`### ${index + 1}. ${pin.decisionPoint}`, '')
      lines.push(`- **Status:** ${pin.status}`)
      lines.push(`- **Chosen value:** ${pin.chosenValue}`)
      lines.push(`- **Separating test:** ${pin.separatingTest}`)
      if (pin.expectedResult) lines.push(`- **Expected result:** ${pin.expectedResult}`)
      if (pin.codeScope) lines.push(`- **Code scope:** ${pin.codeScope}`)
      if (pin.owner) lines.push(`- **Owner:** ${ownerName(pin.owner)}`)
      if (pin.lastRunAt) lines.push(`- **Last run:** ${iso(pin.lastRunAt)}`)
      if (pin.lastRunResult) lines.push(`- **Last result:** ${pin.lastRunResult}`)
      if (pin.supersessionTrigger) {
        lines.push(`- **Supersession trigger:** ${pin.supersessionTrigger}`)
      }
      lines.push('')
    })
  }

  lines.push('## Approvals', '')
  if (approvals.length === 0) {
    lines.push('_No approvals recorded._', '')
  } else {
    approvals.forEach((approval) => {
      lines.push(
        `- **${approval.status}** by ${actorName(approval.actor)} (${approval.role}) on ${
          iso(approval.decidedAt || approval.createdAt)
        }`
      )
      if (approval.note?.trim()) lines.push(`  - Note: ${approval.note.trim()}`)
      if (approval.contentHash) lines.push(`  - Snapshot hash: \`${approval.contentHash}\``)
    })
    lines.push('')
  }

  lines.push('## Method and limitations', '')
  lines.push(
    'This report is generated from the decision workspace at the time shown above. Evidence is reproduced as recorded, including its source path, commit, quote, and any stored hash. A report does not prove that a source still exists or that the quote was interpreted correctly; verify the source and commit before relying on it.',
    ''
  )
  lines.push(
    'Approvals are recorded events, not cryptographic signatures. Each approval stores a SHA-256 snapshot hash of the decision and evidence it covered so a later change can be detected.',
    ''
  )

  lines.push('## Integrity', '')
  lines.push(`- **Decision ID:** \`${decision.id}\``)
  lines.push(`- **Evidence items:** ${evidence.length}`)
  lines.push(`- **Approval records:** ${approvals.length}`)
  lines.push('')

  return lines.join('\n')
}
