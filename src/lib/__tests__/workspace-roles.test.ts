import { describe, expect, it } from 'vitest'
import {
  approvalRoleForWorkspaceRole,
  canEditDecisions,
  canManageWorkspace,
  cleanText,
  isApprovalStatus,
  isConfidence,
  isDecisionImpact,
  isDecisionStatus,
  isEmail,
  isEvidenceKind,
  isEvidenceStatus,
  isPinStatus,
  isWorkspaceRole,
  optionalText,
} from '../workspace-roles'

describe('workspace role helpers', () => {
  it('recognizes only the supported roles', () => {
    expect(isWorkspaceRole('OWNER')).toBe(true)
    expect(isWorkspaceRole('ADMIN')).toBe(true)
    expect(isWorkspaceRole('REVIEWER')).toBe(true)
    expect(isWorkspaceRole('VIEWER')).toBe(true)
    expect(isWorkspaceRole('owner')).toBe(false)
    expect(isWorkspaceRole('GUEST')).toBe(false)
    expect(isWorkspaceRole(null)).toBe(false)
  })

  it('lets owners and admins manage the workspace', () => {
    expect(canManageWorkspace('OWNER')).toBe(true)
    expect(canManageWorkspace('ADMIN')).toBe(true)
    expect(canManageWorkspace('REVIEWER')).toBe(false)
    expect(canManageWorkspace('VIEWER')).toBe(false)
    expect(canManageWorkspace(null)).toBe(false)
  })

  it('lets reviewers edit decisions but viewers only read', () => {
    expect(canEditDecisions('OWNER')).toBe(true)
    expect(canEditDecisions('ADMIN')).toBe(true)
    expect(canEditDecisions('REVIEWER')).toBe(true)
    expect(canEditDecisions('VIEWER')).toBe(false)
    expect(canEditDecisions(undefined)).toBe(false)
  })
})

describe('decision and evidence validators', () => {
  it('validates decision states and impacts', () => {
    expect(isDecisionStatus('DRAFT')).toBe(true)
    expect(isDecisionStatus('IN_REVIEW')).toBe(true)
    expect(isDecisionStatus('APPROVED')).toBe(true)
    expect(isDecisionStatus('ARCHIVED')).toBe(true)
    expect(isDecisionStatus('published')).toBe(false)

    expect(isDecisionImpact('LOW')).toBe(true)
    expect(isDecisionImpact('CRITICAL')).toBe(true)
    expect(isDecisionImpact('SEVERE')).toBe(false)
  })

  it('validates evidence kinds, statuses, and confidence', () => {
    expect(isEvidenceKind('CODE')).toBe(true)
    expect(isEvidenceKind('DOC')).toBe(true)
    expect(isEvidenceKind('SCREENSHOT')).toBe(false)

    expect(isEvidenceStatus('VERIFIED')).toBe(true)
    expect(isEvidenceStatus('DISPUTED')).toBe(true)
    expect(isEvidenceStatus('CERTAIN')).toBe(false)

    expect(isConfidence('HIGH')).toBe(true)
    expect(isConfidence('LOW')).toBe(true)
    expect(isConfidence('CERTAIN')).toBe(false)
  })

  it('validates approval states and maps workspace roles onto approval roles', () => {
    expect(isApprovalStatus('PENDING')).toBe(true)
    expect(isApprovalStatus('APPROVED')).toBe(true)
    expect(isApprovalStatus('REJECTED')).toBe(true)
    expect(isApprovalStatus('SIGNED')).toBe(false)

    expect(approvalRoleForWorkspaceRole('OWNER')).toBe('OWNER')
    expect(approvalRoleForWorkspaceRole('ADMIN')).toBe('APPROVER')
    expect(approvalRoleForWorkspaceRole('REVIEWER')).toBe('REVIEWER')
    expect(approvalRoleForWorkspaceRole('VIEWER')).toBe('REVIEWER')
  })

  it('validates decision pin statuses', () => {
    expect(isPinStatus('ACTIVE')).toBe(true)
    expect(isPinStatus('SUPERSEDED')).toBe(true)
    expect(isPinStatus('DRAFT')).toBe(false)
  })

  it('validates invite email addresses', () => {
    expect(isEmail('reviewer@firm.com')).toBe(true)
    expect(isEmail('  reviewer@firm.com  ')).toBe(true)
    expect(isEmail('not-an-email')).toBe(false)
    expect(isEmail('a@b')).toBe(false)
    expect(isEmail(null)).toBe(false)
  })
})

describe('text helpers', () => {
  it('trims required text and rejects empty or overlong values', () => {
    expect(cleanText('  Project Kestrel  ', 120)).toBe('Project Kestrel')
    expect(cleanText('   ', 120)).toBeNull()
    expect(cleanText(42, 120)).toBeNull()
    expect(cleanText('abcd', 3)).toBeNull()
  })

  it('distinguishes omitted optional text from an explicit empty value', () => {
    expect(optionalText(undefined, 120)).toBeUndefined()
    expect(optionalText(null, 120)).toBeNull()
    expect(optionalText('   ', 120)).toBeNull()
    expect(optionalText('  note  ', 120)).toBe('note')
    expect(optionalText('abcd', 3)).toBeUndefined()
  })
})
