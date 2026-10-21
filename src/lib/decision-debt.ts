export type DebtLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface DebtEvidence {
  status: string
}

export interface DebtApproval {
  status: string
}

export interface DebtInput {
  status: string
  impact: string
  evidence: DebtEvidence[]
  approvals: DebtApproval[]
}

export interface DebtResult {
  score: number
  level: DebtLevel
  rationale: string
}

export function debtLevel(score: number): DebtLevel {
  if (score >= 70) return 'CRITICAL'
  if (score >= 45) return 'HIGH'
  if (score >= 20) return 'MEDIUM'
  return 'LOW'
}

/**
 * A deliberately simple, explainable score. Higher means more unresolved debt:
 * missing evidence, unsupported/disputed evidence, missing approvals, and a
 * decision that is still in draft. Impact is a multiplier of consequence.
 */
export function scoreDecisionDebt(input: DebtInput): DebtResult {
  let score = 0
  const reasons: string[] = []

  const evidenceCount = input.evidence.length
  if (evidenceCount === 0) {
    score += 40
    reasons.push('No evidence attached (+40)')
  } else if (evidenceCount === 1) {
    score += 25
    reasons.push('Only one evidence item (+25)')
  } else if (evidenceCount === 2) {
    score += 10
    reasons.push('Two evidence items (+10)')
  }

  const evidencePenalty = input.evidence.reduce((total, item) => {
    switch (item.status) {
      case 'UNSUPPORTED':
        return total + 12
      case 'DISPUTED':
        return total + 10
      case 'OPEN':
        return total + 8
      case 'INFERRED':
        return total + 5
      case 'VERIFIED':
        return total
      default:
        return total + 5
    }
  }, 0)
  const cappedEvidencePenalty = Math.min(25, evidencePenalty)
  if (cappedEvidencePenalty > 0) {
    score += cappedEvidencePenalty
    reasons.push(`Unresolved evidence status (+${cappedEvidencePenalty})`)
  }

  if (input.approvals.some((approval) => approval.status === 'REJECTED')) {
    score += 25
    reasons.push('A rejection is on record (+25)')
  } else if (input.approvals.some((approval) => approval.status === 'APPROVED')) {
    score -= 15
    reasons.push('Approval recorded (-15)')
  } else if (input.approvals.some((approval) => approval.status === 'PENDING')) {
    score += 10
    reasons.push('Approval is pending (+10)')
  } else {
    score += 20
    reasons.push('No approval recorded (+20)')
  }

  if (input.status === 'DRAFT') {
    score += 10
    reasons.push('Decision is still a draft (+10)')
  } else if (input.status === 'IN_REVIEW') {
    score += 5
    reasons.push('Decision is in review (+5)')
  } else if (input.status === 'APPROVED') {
    score -= 10
    reasons.push('Decision is approved (-10)')
  }

  if (input.impact === 'CRITICAL') {
    score += 15
    reasons.push('Critical deal impact (+15)')
  } else if (input.impact === 'HIGH') {
    score += 10
    reasons.push('High deal impact (+10)')
  } else if (input.impact === 'MEDIUM') {
    score += 5
    reasons.push('Medium deal impact (+5)')
  }

  const clamped = Math.max(0, Math.min(100, score))
  return {
    score: clamped,
    level: debtLevel(clamped),
    rationale: reasons.length > 0 ? reasons.join('\n') : 'No material debt signals.',
  }
}
