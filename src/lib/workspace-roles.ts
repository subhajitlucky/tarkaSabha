export const WORKSPACE_ROLES = ['OWNER', 'ADMIN', 'REVIEWER', 'VIEWER'] as const
export const DECISION_STATUSES = ['DRAFT', 'IN_REVIEW', 'APPROVED', 'ARCHIVED'] as const
export const DECISION_IMPACTS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
export const EVIDENCE_KINDS = ['CODE', 'COMMIT', 'DOC', 'TEST', 'CONFIG', 'OTHER'] as const
export const EVIDENCE_STATUSES = ['VERIFIED', 'DISPUTED', 'UNSUPPORTED', 'INFERRED', 'OPEN'] as const
export const CONFIDENCES = ['HIGH', 'MEDIUM', 'LOW'] as const
export const APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number]
export type DecisionStatus = (typeof DECISION_STATUSES)[number]
export type DecisionImpact = (typeof DECISION_IMPACTS)[number]
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number]
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number]
export type Confidence = (typeof CONFIDENCES)[number]
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number]

export const MAX_WORKSPACE_NAME = 120
export const MAX_WORKSPACE_DESCRIPTION = 500
export const MAX_DECISION_TITLE = 200
export const MAX_DECISION_SUMMARY = 2000
export const MAX_EVIDENCE_SOURCE = 500
export const MAX_EVIDENCE_QUOTE = 2000
export const MAX_EVIDENCE_COMMIT = 120
export const MAX_EVIDENCE_HASH = 128
export const MAX_APPROVAL_NOTE = 1000
export const MAX_EMAIL = 254

function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (values as readonly string[]).includes(value)
}

export const isWorkspaceRole = (value: unknown): value is WorkspaceRole =>
  isOneOf(WORKSPACE_ROLES, value)

export const isDecisionStatus = (value: unknown): value is DecisionStatus =>
  isOneOf(DECISION_STATUSES, value)

export const isDecisionImpact = (value: unknown): value is DecisionImpact =>
  isOneOf(DECISION_IMPACTS, value)

export const isEvidenceKind = (value: unknown): value is EvidenceKind =>
  isOneOf(EVIDENCE_KINDS, value)

export const isEvidenceStatus = (value: unknown): value is EvidenceStatus =>
  isOneOf(EVIDENCE_STATUSES, value)

export const isConfidence = (value: unknown): value is Confidence =>
  isOneOf(CONFIDENCES, value)

export const isApprovalStatus = (value: unknown): value is ApprovalStatus =>
  isOneOf(APPROVAL_STATUSES, value)

export function isEmail(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  return (
    trimmed.length > 3 &&
    trimmed.length <= MAX_EMAIL &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
  )
}

export function approvalRoleForWorkspaceRole(role: WorkspaceRole): string {
  if (role === 'OWNER') return 'OWNER'
  if (role === 'ADMIN') return 'APPROVER'
  return 'REVIEWER'
}

export function canManageWorkspace(role: WorkspaceRole | null | undefined): boolean {
  return role === 'OWNER' || role === 'ADMIN'
}

export function canEditDecisions(role: WorkspaceRole | null | undefined): boolean {
  return role === 'OWNER' || role === 'ADMIN' || role === 'REVIEWER'
}

export function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > max) return null
  return trimmed
}

export function optionalText(value: unknown, max: number): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (trimmed.length > max) return undefined
  return trimmed.length > 0 ? trimmed : null
}
