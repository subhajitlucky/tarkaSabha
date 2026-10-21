import { prisma } from './prisma'
import { scoreDecisionDebt } from './decision-debt'

/** Recompute and persist a decision's debt after evidence or approval changes. */
export async function recalculateDecisionDebt(decisionId: string) {
  const decision = await prisma.decision.findUnique({
    where: { id: decisionId },
    select: {
      status: true,
      impact: true,
      evidence: { select: { status: true } },
      approvals: { select: { status: true } },
    },
  })

  if (!decision) return null

  const result = scoreDecisionDebt(decision)

  await prisma.decision.update({
    where: { id: decisionId },
    data: {
      debtScore: result.score,
      debtRationale: result.rationale,
      scoredAt: new Date(),
    },
  })

  return result
}
