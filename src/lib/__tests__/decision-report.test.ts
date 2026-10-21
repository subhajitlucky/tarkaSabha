import { describe, expect, it } from 'vitest'
import { buildDecisionReport, sha256 } from '../decision-report'

const decision = {
  id: 'd1',
  title: 'Proceed with the Kestrel acquisition',
  summary: 'The board needs a recommendation before exclusivity closes.',
  status: 'IN_REVIEW',
  impact: 'CRITICAL',
  debtScore: 42,
  debtRationale: 'Only one evidence item (+25)\nNo approval recorded (+20)',
  createdAt: new Date('2026-10-01T09:00:00.000Z'),
  updatedAt: new Date('2026-10-02T10:00:00.000Z'),
  owner: { name: 'Asha Rao', email: 'asha@example.com' },
  workspace: { name: 'Project Kestrel' },
}

const evidence = [
  {
    kind: 'CODE',
    source: 'src/auth/session.ts:42',
    commit: 'abc123',
    quote: 'Sessions are validated on every request.',
    sha256: 'a'.repeat(64),
    status: 'VERIFIED',
    confidence: 'HIGH',
  },
]

const approvals = [
  {
    role: 'APPROVER',
    status: 'APPROVED',
    note: 'Evidence covers the auth question.',
    contentHash: 'b'.repeat(64),
    createdAt: new Date('2026-10-03T11:00:00.000Z'),
    decidedAt: new Date('2026-10-03T11:00:00.000Z'),
    actor: { name: 'Vikram Shah', email: 'vikram@example.com' },
  },
]

describe('buildDecisionReport', () => {
  it('renders decision context, evidence, approvals, and integrity metadata', () => {
    const report = buildDecisionReport({
      decision,
      evidence,
      approvals,
      generatedAt: new Date('2026-10-04T12:00:00.000Z'),
    })

    expect(report).toContain('# Decision Evidence Report — Proceed with the Kestrel acquisition')
    expect(report).toContain('- **Workspace:** Project Kestrel')
    expect(report).toContain('- **Impact:** CRITICAL')
    expect(report).toContain('- **Decision debt:** 42/100')
    expect(report).toContain('Only one evidence item (+25); No approval recorded (+20)')
    expect(report).toContain('src/auth/session.ts:42')
    expect(report).toContain('> Sessions are validated on every request.')
    expect(report).toContain('**APPROVED** by Vikram Shah (APPROVER)')
    expect(report).toContain('Snapshot hash:')
    expect(report).toContain('- **Evidence items:** 1')
    expect(report).toContain('- **Approval records:** 1')
    expect(report).toContain('2026-10-04T12:00:00.000Z')
  })

  it('is deterministic for a fixed generation time', () => {
    const input = {
      decision,
      evidence,
      approvals,
      generatedAt: new Date('2026-10-04T12:00:00.000Z'),
    }

    expect(buildDecisionReport(input)).toBe(buildDecisionReport(input))
  })

  it('states when no evidence or approvals are recorded', () => {
    const report = buildDecisionReport({
      decision,
      evidence: [],
      approvals: [],
      generatedAt: new Date('2026-10-04T12:00:00.000Z'),
    })

    expect(report).toContain('_No evidence recorded._')
    expect(report).toContain('_No approvals recorded._')
  })
})

describe('sha256', () => {
  it('returns the standard SHA-256 digest', () => {
    expect(sha256('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    )
  })
})
