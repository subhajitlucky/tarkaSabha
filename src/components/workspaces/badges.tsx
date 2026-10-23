import { Badge } from '@/components/ui/Badge'
import { debtLevel } from '@/lib/decision-debt'

type Tone = 'neutral' | 'accent' | 'danger' | 'success' | 'warning' | 'info' | 'outline'

const decisionStatusTones: Record<string, Tone> = {
  DRAFT: 'warning',
  IN_REVIEW: 'info',
  APPROVED: 'success',
  ARCHIVED: 'outline',
}

const impactTones: Record<string, Tone> = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'danger',
  CRITICAL: 'danger',
}

const evidenceStatusTones: Record<string, Tone> = {
  VERIFIED: 'success',
  DISPUTED: 'danger',
  UNSUPPORTED: 'warning',
  INFERRED: 'info',
  OPEN: 'neutral',
}

const confidenceTones: Record<string, Tone> = {
  HIGH: 'success',
  MEDIUM: 'warning',
  LOW: 'outline',
}

function label(value: string): string {
  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function DecisionStatusBadge({ status }: { status: string }) {
  return <Badge tone={decisionStatusTones[status] ?? 'neutral'}>{label(status)}</Badge>
}

export function ImpactBadge({ impact }: { impact: string }) {
  return <Badge tone={impactTones[impact] ?? 'outline'}>{label(impact)}</Badge>
}

export function EvidenceStatusBadge({ status }: { status: string }) {
  return <Badge tone={evidenceStatusTones[status] ?? 'neutral'}>{label(status)}</Badge>
}

export function ConfidenceBadge({ confidence }: { confidence: string }) {
  return <Badge tone={confidenceTones[confidence] ?? 'neutral'}>{label(confidence)}</Badge>
}

export function RoleBadge({ role }: { role: string }) {
  return <Badge tone={role === 'VIEWER' ? 'outline' : 'accent'}>{label(role)}</Badge>
}

export function DebtBadge({ score }: { score: number }) {
  const level = debtLevel(score)
  const tone =
    level === 'LOW'
      ? 'success'
      : level === 'MEDIUM'
        ? 'warning'
        : level === 'HIGH'
          ? 'danger'
          : 'danger'

  return (
    <Badge tone={tone} title={`Decision debt ${score}/100 (${level})`}>
      Debt {score}
    </Badge>
  )
}
