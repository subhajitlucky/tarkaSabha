import { Badge } from '@/components/ui/Badge'
import { debtLevel } from '@/lib/decision-debt'

type Tone = 'neutral' | 'accent' | 'danger' | 'success' | 'outline'

const decisionStatusTones: Record<string, Tone> = {
  DRAFT: 'neutral',
  IN_REVIEW: 'accent',
  APPROVED: 'success',
  ARCHIVED: 'outline',
}

const impactTones: Record<string, Tone> = {
  LOW: 'neutral',
  MEDIUM: 'outline',
  HIGH: 'accent',
  CRITICAL: 'danger',
}

const evidenceStatusTones: Record<string, Tone> = {
  VERIFIED: 'success',
  DISPUTED: 'danger',
  UNSUPPORTED: 'danger',
  INFERRED: 'accent',
  OPEN: 'neutral',
}

const confidenceTones: Record<string, Tone> = {
  HIGH: 'success',
  MEDIUM: 'neutral',
  LOW: 'outline',
}

function label(value: string): string {
  return value.replaceAll('_', ' ')
}

export function DecisionStatusBadge({ status }: { status: string }) {
  return <Badge tone={decisionStatusTones[status] ?? 'neutral'}>{label(status)}</Badge>
}

export function ImpactBadge({ impact }: { impact: string }) {
  return <Badge tone={impactTones[impact] ?? 'outline'}>{impact}</Badge>
}

export function EvidenceStatusBadge({ status }: { status: string }) {
  return <Badge tone={evidenceStatusTones[status] ?? 'neutral'}>{label(status)}</Badge>
}

export function ConfidenceBadge({ confidence }: { confidence: string }) {
  return <Badge tone={confidenceTones[confidence] ?? 'neutral'}>{confidence}</Badge>
}

export function RoleBadge({ role }: { role: string }) {
  return <Badge tone={role === 'VIEWER' ? 'outline' : 'accent'}>{role}</Badge>
}

export function DebtBadge({ score }: { score: number }) {
  const level = debtLevel(score)
  const tone =
    level === 'LOW'
      ? 'success'
      : level === 'MEDIUM'
        ? 'neutral'
        : level === 'HIGH'
          ? 'accent'
          : 'danger'

  return (
    <Badge tone={tone} title={`Decision debt ${score}/100 (${level})`}>
      Debt {score}
    </Badge>
  )
}
