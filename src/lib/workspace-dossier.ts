import { debtLevel } from './decision-debt'

export interface DossierWorkspace {
  name: string
  description?: string | null
}

export interface DossierSource {
  owner: string
  name: string
  ref: string
  commitSha?: string | null
  fileCount: number
  commitCount: number
  pullRequestCount: number
  issueCount: number
}

export interface DossierEvidence {
  kind: string
  source: string
  commit?: string | null
  quote: string
  sha256?: string | null
  status: string
  confidence: string
}

export interface DossierPin {
  decisionPoint: string
  chosenValue: string
  separatingTest: string
  expectedResult?: string | null
  codeScope?: string | null
  status: string
  lastRunResult?: string | null
  supersessionTrigger?: string | null
}

export interface DossierApproval {
  role: string
  status: string
  note?: string | null
  createdAt: Date | string
  decidedAt?: Date | string | null
  actor?: { name: string | null; email: string | null } | null
}

export interface DossierDecision {
  id: string
  title: string
  summary?: string | null
  status: string
  impact: string
  debtScore: number
  debtRationale?: string | null
  owner?: { name: string | null; email: string | null } | null
  evidence: DossierEvidence[]
  pins: DossierPin[]
  approvals: DossierApproval[]
  updatedAt: Date | string
}

export interface BuildDossierInput {
  workspace: DossierWorkspace
  decisions: DossierDecision[]
  sources: DossierSource[]
  generatedBy?: string | null
  generatedAt?: Date
}

function iso(value: Date | string | null | undefined): string {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toISOString()
}

function ownerName(owner: DossierDecision['owner']): string {
  return owner?.name || owner?.email || 'Unassigned'
}

function actorName(actor: DossierApproval['actor'] | undefined): string {
  return actor?.name || actor?.email || 'Unknown member'
}

function unresolved(evidence: DossierEvidence[]): DossierEvidence[] {
  return evidence.filter((item) =>
    ['DISPUTED', 'UNSUPPORTED', 'OPEN', 'INFERRED'].includes(item.status)
  )
}

export function buildWorkspaceDossier({
  workspace,
  decisions,
  sources,
  generatedBy,
  generatedAt = new Date(),
}: BuildDossierInput): string {
  const lines: string[] = []
  const evidenceCount = decisions.reduce((total, decision) => total + decision.evidence.length, 0)
  const unresolvedEvidence = decisions.flatMap((decision) =>
    unresolved(decision.evidence).map((item) => ({ decision, item }))
  )
  const decisionsWithoutEvidence = decisions.filter((decision) => decision.evidence.length === 0)
  const approvalCount = decisions.reduce(
    (total, decision) => total + decision.approvals.length,
    0
  )
  const averageDebt =
    decisions.length === 0
      ? 0
      : Math.round(
          decisions.reduce((total, decision) => total + decision.debtScore, 0) /
            decisions.length
        )
  const ranked = [...decisions].sort(
    (a, b) => b.debtScore - a.debtScore || a.title.localeCompare(b.title)
  )

  lines.push(`# Decision Diligence Dossier — ${workspace.name}`, '')
  lines.push(
    `_Generated ${iso(generatedAt)}${generatedBy ? ` by ${generatedBy}` : ''} from Tarka Sabha._`,
    ''
  )

  lines.push('## Deal context', '')
  lines.push(workspace.description?.trim() || '_No workspace description recorded._', '')

  lines.push('## Executive summary', '')
  lines.push(`- **Decisions:** ${decisions.length}`)
  lines.push(`- **Evidence items:** ${evidenceCount}`)
  lines.push(`- **Unresolved evidence:** ${unresolvedEvidence.length}`)
  lines.push(`- **Decisions without evidence:** ${decisionsWithoutEvidence.length}`)
  lines.push(`- **Approval records:** ${approvalCount}`)
  lines.push(`- **Average decision debt:** ${averageDebt}/100`, '')

  lines.push('### Highest-debt decisions', '')
  if (ranked.length === 0) {
    lines.push('_No decisions recorded._', '')
  } else {
    ranked.slice(0, 5).forEach((decision, index) => {
      lines.push(
        `${index + 1}. **${decision.title}** — debt ${decision.debtScore}/100 (${debtLevel(
          decision.debtScore
        )}), ${decision.impact} impact, ${decision.status}`
      )
    })
    lines.push('')
  }

  lines.push('## Decision inventory', '')
  if (decisions.length === 0) {
    lines.push('_No decisions recorded._', '')
  } else {
    decisions.forEach((decision, index) => {
      lines.push(
        `- **D-${String(index + 1).padStart(2, '0')}** ${decision.title} — ${decision.status} · ${
          decision.impact
        } · debt ${decision.debtScore}/100 · ${decision.evidence.length} evidence · ${
          decision.approvals.length
        } approvals`
      )
    })
    lines.push('')
  }

  lines.push('## Decision records', '')
  if (decisions.length === 0) {
    lines.push('_No decisions recorded._', '')
  } else {
    decisions.forEach((decision, index) => {
      lines.push(`### D-${String(index + 1).padStart(2, '0')}. ${decision.title}`, '')
      lines.push(`- **Status:** ${decision.status}`)
      lines.push(`- **Impact:** ${decision.impact}`)
      lines.push(`- **Owner:** ${ownerName(decision.owner)}`)
      lines.push(
        `- **Decision debt:** ${decision.debtScore}/100 (${debtLevel(decision.debtScore)})`
      )
      lines.push(`- **Last updated:** ${iso(decision.updatedAt)}`)
      if (decision.debtRationale) {
        lines.push(
          `- **Debt rationale:** ${decision.debtRationale.replace(/\n/g, '; ')}`
        )
      }
      lines.push('')
      lines.push(decision.summary?.trim() || '_No context recorded._', '')

      lines.push('#### Evidence', '')
      if (decision.evidence.length === 0) {
        lines.push('_No evidence recorded._', '')
      } else {
        decision.evidence.forEach((item) => {
          lines.push(`- **${item.kind}** — ${item.status} (${item.confidence} confidence)`)
          lines.push(`  - Source: \`${item.source}\``)
          if (item.commit) lines.push(`  - Commit: \`${item.commit}\``)
          if (item.sha256) lines.push(`  - SHA-256: \`${item.sha256}\``)
          lines.push(`  - Quote: ${item.quote.replace(/\n/g, ' ')}`)
        })
        lines.push('')
      }

      lines.push('#### Pins', '')
      if (decision.pins.length === 0) {
        lines.push('_No pins recorded._', '')
      } else {
        decision.pins.forEach((pin) => {
          lines.push(`- **${pin.decisionPoint}** — ${pin.status}`)
          lines.push(`  - Chosen value: ${pin.chosenValue}`)
          lines.push(`  - Separating test: ${pin.separatingTest}`)
          if (pin.expectedResult) lines.push(`  - Expected result: ${pin.expectedResult}`)
          if (pin.codeScope) lines.push(`  - Code scope: \`${pin.codeScope}\``)
          if (pin.lastRunResult) lines.push(`  - Last run: ${pin.lastRunResult}`)
          if (pin.supersessionTrigger) {
            lines.push(`  - Supersession trigger: ${pin.supersessionTrigger}`)
          }
        })
        lines.push('')
      }

      lines.push('#### Approvals', '')
      if (decision.approvals.length === 0) {
        lines.push('_No approvals recorded._', '')
      } else {
        decision.approvals.forEach((approval) => {
          lines.push(
            `- **${approval.status}** by ${actorName(approval.actor)} (${approval.role}) on ${iso(
              approval.decidedAt || approval.createdAt
            )}`
          )
          if (approval.note) lines.push(`  - Note: ${approval.note}`)
        })
        lines.push('')
      }
    })
  }

  lines.push('## Contradictions and unsupported claims', '')
  const unsupported = unresolvedEvidence.filter(({ item }) =>
    ['DISPUTED', 'UNSUPPORTED'].includes(item.status)
  )
  if (unsupported.length === 0) {
    lines.push('_No disputed or unsupported evidence recorded._', '')
  } else {
    unsupported.forEach(({ decision, item }) => {
      lines.push(`- **${decision.title}** — ${item.status}: \`${item.source}\``)
      lines.push(`  - ${item.quote.replace(/\n/g, ' ')}`)
    })
    lines.push('')
  }

  lines.push('## Open questions', '')
  const openItems: string[] = []
  for (const decision of decisions) {
    if (decision.evidence.length === 0) {
      openItems.push(`**${decision.title}** has no evidence attached.`)
    }
    for (const item of decision.evidence) {
      if (item.status === 'OPEN') {
        openItems.push(
          `**${decision.title}** has open evidence at \`${item.source}\`: ${item.quote.replace(
            /\n/g,
            ' '
          )}`
        )
      }
      if (item.status === 'INFERRED') {
        openItems.push(
          `**${decision.title}** has inferred evidence at \`${item.source}\` that needs confirmation.`
        )
      }
    }
    if (decision.approvals.length === 0) {
      openItems.push(`**${decision.title}** has no approval recorded.`)
    }
    for (const pin of decision.pins) {
      if (!pin.lastRunResult) {
        openItems.push(
          `**${decision.title}** pin "${pin.decisionPoint}" has not been run.`
        )
      }
    }
  }
  if (openItems.length === 0) {
    lines.push('_No open questions recorded._', '')
  } else {
    openItems.forEach((item) => lines.push(`- ${item}`))
    lines.push('')
  }

  lines.push('## Evidence appendix', '')
  if (decisions.every((decision) => decision.evidence.length === 0)) {
    lines.push('_No evidence recorded._', '')
  } else {
    decisions.forEach((decision, index) => {
      if (decision.evidence.length === 0) return
      lines.push(`### D-${String(index + 1).padStart(2, '0')} — ${decision.title}`, '')
      decision.evidence.forEach((item) => {
        lines.push(`- **${item.kind}** · ${item.status} · ${item.confidence}`)
        lines.push(`  - Source: \`${item.source}\``)
        if (item.commit) lines.push(`  - Commit: \`${item.commit}\``)
        if (item.sha256) lines.push(`  - SHA-256: \`${item.sha256}\``)
        lines.push(`  - Quote: ${item.quote.replace(/\n/g, ' ')}`)
      })
      lines.push('')
    })
  }

  lines.push('## Sources', '')
  if (sources.length === 0) {
    lines.push('_No source snapshots recorded._', '')
  } else {
    sources.forEach((source) => {
      lines.push(
        `- **${source.owner}/${source.name}** @ ${source.ref}${
          source.commitSha ? ` (${source.commitSha.slice(0, 12)})` : ''
        } — ${source.fileCount} files, ${source.commitCount} commits, ${source.pullRequestCount} PRs, ${source.issueCount} issues`
      )
    })
    lines.push('')
  }

  lines.push('## Method and limitations', '')
  lines.push(
    'This dossier is generated from the workspace as recorded at the time shown above. Evidence quotes, source paths, commits, and hashes are reproduced from the workspace; they are not independently re-verified. Decision debt is an explainable internal score, not an audit opinion. A source path or commit may no longer exist at the time of reading. Verify the underlying source before relying on a finding.',
    ''
  )
  lines.push(
    'Approvals are recorded events with SHA-256 snapshot hashes, not cryptographic signatures. Human review is required before this dossier is used in an investment, audit, or insurance decision.',
    ''
  )

  lines.push('## Integrity', '')
  lines.push(`- **Workspace:** ${workspace.name}`)
  lines.push(`- **Decisions:** ${decisions.length}`)
  lines.push(`- **Evidence items:** ${evidenceCount}`)
  lines.push(`- **Sources:** ${sources.length}`)
  lines.push('')

  return lines.join('\n')
}
