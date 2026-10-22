import { describe, expect, it } from 'vitest'
import { buildWorkspaceInsights } from '../workspace-insights'

const now = new Date('2026-10-22T12:00:00.000Z')

const decisions = [
  {
    id: 'd1',
    title: 'Validate sessions',
    status: 'APPROVED',
    impact: 'HIGH',
    debtScore: 30,
    outcome: 'VALIDATED',
    revisitAt: new Date('2027-01-15T00:00:00.000Z'),
    evidence: [{ status: 'VERIFIED' }, { status: 'VERIFIED' }],
    approvals: [{ status: 'APPROVED' }],
  },
  {
    id: 'd2',
    title: 'Store money as cents',
    status: 'DRAFT',
    impact: 'CRITICAL',
    debtScore: 85,
    outcome: null,
    revisitAt: new Date('2026-10-01T00:00:00.000Z'),
    evidence: [{ status: 'OPEN' }],
    approvals: [],
  },
  {
    id: 'd3',
    title: 'Archive the old queue',
    status: 'ARCHIVED',
    impact: 'LOW',
    debtScore: 10,
    outcome: 'PARTIAL',
    revisitAt: null,
    evidence: [],
    approvals: [{ status: 'PENDING' }],
  },
]

const sources = [
  { fileCount: 3, commitCount: 4, pullRequestCount: 2, issueCount: 1 },
  { fileCount: 1, commitCount: 1, pullRequestCount: 0, issueCount: 0 },
]

describe('buildWorkspaceInsights', () => {
  it('aggregates debt, coverage, outcomes, and overdue revisits', () => {
    const insights = buildWorkspaceInsights({ decisions, sources, now })

    expect(insights.totalDecisions).toBe(3)
    expect(insights.averageDebt).toBe(42)
    expect(insights.evidenceCoverage).toBe(67)
    expect(insights.totalEvidence).toBe(3)
    expect(insights.totalApprovals).toBe(2)
    expect(insights.decisionsWithoutEvidence).toBe(1)
    expect(insights.decisionsWithoutApproval).toBe(1)
    expect(insights.overdueRevisits).toBe(1)
    expect(insights.debtBands).toEqual({ LOW: 1, MEDIUM: 1, HIGH: 0, CRITICAL: 1 })
    expect(insights.outcomes).toMatchObject({
      VALIDATED: 1,
      PARTIAL: 1,
      NOT_RECORDED: 1,
    })
    expect(insights.evidenceStatuses).toMatchObject({ VERIFIED: 2, OPEN: 1 })
    expect(insights.topDebtDecisions[0].id).toBe('d2')
    expect(insights.overdue[0]).toMatchObject({ id: 'd2' })
    expect(insights.sourceTotals).toEqual({
      files: 4,
      commits: 5,
      pullRequests: 2,
      issues: 1,
    })
  })

  it('handles an empty workspace', () => {
    const insights = buildWorkspaceInsights({ decisions: [], sources: [], now })

    expect(insights.totalDecisions).toBe(0)
    expect(insights.averageDebt).toBe(0)
    expect(insights.evidenceCoverage).toBe(0)
    expect(insights.topDebtDecisions).toEqual([])
    expect(insights.overdue).toEqual([])
  })
})
