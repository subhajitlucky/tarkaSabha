import { debtLevel, type DebtLevel } from './decision-debt'

export interface InsightDecision {
  id: string
  title: string
  status: string
  impact: string
  debtScore: number
  outcome?: string | null
  revisitAt?: Date | string | null
  evidence: Array<{ status: string }>
  approvals: Array<{ status: string }>
}

export interface InsightSource {
  fileCount: number
  commitCount: number
  pullRequestCount: number
  issueCount: number
}

export interface WorkspaceInsights {
  totalDecisions: number
  averageDebt: number
  evidenceCoverage: number
  totalEvidence: number
  totalApprovals: number
  decisionsWithoutEvidence: number
  decisionsWithoutApproval: number
  overdueRevisits: number
  debtBands: Record<DebtLevel, number>
  outcomes: Record<string, number>
  evidenceStatuses: Record<string, number>
  statuses: Record<string, number>
  impacts: Record<string, number>
  topDebtDecisions: Array<{
    id: string
    title: string
    debtScore: number
    status: string
    impact: string
    outcome?: string | null
  }>
  overdue: Array<{
    id: string
    title: string
    debtScore: number
    revisitAt: string
  }>
  sourceTotals: {
    files: number
    commits: number
    pullRequests: number
    issues: number
  }
}

function increment(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1
}

export function buildWorkspaceInsights({
  decisions,
  sources,
  now = new Date(),
}: {
  decisions: InsightDecision[]
  sources: InsightSource[]
  now?: Date
}): WorkspaceInsights {
  const debtBands: Record<DebtLevel, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
  }
  const outcomes: Record<string, number> = {}
  const evidenceStatuses: Record<string, number> = {}
  const statuses: Record<string, number> = {}
  const impacts: Record<string, number> = {}

  let totalEvidence = 0
  let totalApprovals = 0
  let decisionsWithoutEvidence = 0
  let decisionsWithoutApproval = 0
  let overdueRevisits = 0
  let debtTotal = 0

  const overdue: WorkspaceInsights['overdue'] = []

  for (const decision of decisions) {
    debtTotal += decision.debtScore
    debtBands[debtLevel(decision.debtScore)] += 1
    increment(statuses, decision.status)
    increment(impacts, decision.impact)
    increment(outcomes, decision.outcome || 'NOT_RECORDED')

    totalEvidence += decision.evidence.length
    totalApprovals += decision.approvals.length
    if (decision.evidence.length === 0) decisionsWithoutEvidence += 1
    if (decision.approvals.length === 0) decisionsWithoutApproval += 1

    for (const item of decision.evidence) {
      increment(evidenceStatuses, item.status)
    }

    if (decision.revisitAt && !decision.outcome) {
      const revisit = new Date(decision.revisitAt)
      if (!Number.isNaN(revisit.getTime()) && revisit.getTime() <= now.getTime()) {
        overdueRevisits += 1
        overdue.push({
          id: decision.id,
          title: decision.title,
          debtScore: decision.debtScore,
          revisitAt: revisit.toISOString(),
        })
      }
    }
  }

  const topDebtDecisions = [...decisions]
    .sort((a, b) => b.debtScore - a.debtScore || a.title.localeCompare(b.title))
    .slice(0, 5)
    .map((decision) => ({
      id: decision.id,
      title: decision.title,
      debtScore: decision.debtScore,
      status: decision.status,
      impact: decision.impact,
      outcome: decision.outcome ?? null,
    }))

  const sourceTotals = sources.reduce(
    (totals, source) => ({
      files: totals.files + source.fileCount,
      commits: totals.commits + source.commitCount,
      pullRequests: totals.pullRequests + source.pullRequestCount,
      issues: totals.issues + source.issueCount,
    }),
    { files: 0, commits: 0, pullRequests: 0, issues: 0 }
  )

  const evidenceCoverage =
    decisions.length === 0
      ? 0
      : Math.round(
          ((decisions.length - decisionsWithoutEvidence) / decisions.length) * 100
        )

  return {
    totalDecisions: decisions.length,
    averageDebt:
      decisions.length === 0 ? 0 : Math.round(debtTotal / decisions.length),
    evidenceCoverage,
    totalEvidence,
    totalApprovals,
    decisionsWithoutEvidence,
    decisionsWithoutApproval,
    overdueRevisits,
    debtBands,
    outcomes,
    evidenceStatuses,
    statuses,
    impacts,
    topDebtDecisions,
    overdue,
    sourceTotals,
  }
}
