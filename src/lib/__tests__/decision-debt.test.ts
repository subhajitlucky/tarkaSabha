import { describe, expect, it } from 'vitest'
import { debtLevel, scoreDecisionDebt } from '../decision-debt'

describe('scoreDecisionDebt', () => {
  it('scores an unevidenced critical draft as high debt', () => {
    const result = scoreDecisionDebt({
      status: 'DRAFT',
      impact: 'CRITICAL',
      evidence: [],
      approvals: [],
    })

    expect(result.score).toBe(85)
    expect(result.level).toBe('CRITICAL')
    expect(result.rationale).toContain('No evidence attached')
    expect(result.rationale).toContain('No approval recorded')
  })

  it('reduces debt when evidence and approval are present', () => {
    const result = scoreDecisionDebt({
      status: 'APPROVED',
      impact: 'HIGH',
      evidence: [
        { status: 'VERIFIED' },
        { status: 'VERIFIED' },
        { status: 'VERIFIED' },
      ],
      approvals: [{ status: 'APPROVED' }],
    })

    expect(result.score).toBe(0)
    expect(result.level).toBe('LOW')
  })

  it('penalizes disputed, unsupported, and open evidence', () => {
    const base = scoreDecisionDebt({
      status: 'IN_REVIEW',
      impact: 'MEDIUM',
      evidence: [
        { status: 'VERIFIED' },
        { status: 'VERIFIED' },
      ],
      approvals: [{ status: 'APPROVED' }],
    })
    const disputed = scoreDecisionDebt({
      status: 'IN_REVIEW',
      impact: 'MEDIUM',
      evidence: [
        { status: 'DISPUTED' },
        { status: 'UNSUPPORTED' },
      ],
      approvals: [{ status: 'APPROVED' }],
    })

    expect(disputed.score).toBeGreaterThan(base.score)
    expect(disputed.rationale).toContain('Unresolved evidence status')
  })

  it('records a rejection as a major debt signal', () => {
    const result = scoreDecisionDebt({
      status: 'IN_REVIEW',
      impact: 'MEDIUM',
      evidence: [{ status: 'VERIFIED' }],
      approvals: [{ status: 'REJECTED' }],
    })

    expect(result.rationale).toContain('rejection is on record')
  })

  it('clamps to 0-100', () => {
    const result = scoreDecisionDebt({
      status: 'DRAFT',
      impact: 'CRITICAL',
      evidence: [
        { status: 'UNSUPPORTED' },
        { status: 'UNSUPPORTED' },
        { status: 'DISPUTED' },
        { status: 'OPEN' },
      ],
      approvals: [{ status: 'REJECTED' }],
    })

    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.score).toBeGreaterThanOrEqual(0)
  })
})

describe('debtLevel', () => {
  it('maps score bands', () => {
    expect(debtLevel(0)).toBe('LOW')
    expect(debtLevel(20)).toBe('MEDIUM')
    expect(debtLevel(45)).toBe('HIGH')
    expect(debtLevel(70)).toBe('CRITICAL')
  })
})
