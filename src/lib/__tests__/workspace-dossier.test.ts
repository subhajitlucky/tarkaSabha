import { describe, expect, it } from 'vitest'
import { buildWorkspaceDossier, redactDossierContent } from '../workspace-dossier'

const workspace = {
  name: 'Project Kestrel',
  description: 'Acquisition review before exclusivity closes.',
}

const decisions = [
  {
    id: 'd1',
    title: 'Validate sessions on every request',
    summary: 'Sessions are bearer credentials.',
    status: 'IN_REVIEW',
    impact: 'HIGH',
    debtScore: 65,
    debtRationale: 'Only one evidence item (+25)\nNo approval recorded (+20)',
    owner: { name: 'Asha Rao', email: 'asha@example.com' },
    updatedAt: new Date('2026-10-21T12:00:00.000Z'),
    evidence: [
      {
        kind: 'CODE',
        source: 'src/middleware.ts',
        commit: 'abc123',
        quote: 'Sessions are validated on every request.',
        sha256: 'a'.repeat(64),
        status: 'VERIFIED',
        confidence: 'HIGH',
      },
      {
        kind: 'DOC',
        source: 'docs/tenancy.md',
        quote: 'Tenant data is isolated by workspace ID.',
        status: 'INFERRED',
        confidence: 'MEDIUM',
      },
    ],
    pins: [
      {
        decisionPoint: 'Session validation point',
        chosenValue: 'Sessions are validated in middleware.',
        separatingTest: 'Request a protected route without a cookie; expect 401.',
        expectedResult: '401 Unauthorized',
        codeScope: 'src/middleware.ts',
        status: 'ACTIVE',
        lastRunResult: 'Passed',
        supersessionTrigger: 'Revisit if validation moves to the edge.',
      },
    ],
    approvals: [
      {
        role: 'APPROVER',
        status: 'APPROVED',
        note: 'Looks sound.',
        createdAt: new Date('2026-10-21T12:30:00.000Z'),
        decidedAt: new Date('2026-10-21T12:30:00.000Z'),
        actor: { name: 'Vikram Shah', email: 'vikram@example.com' },
      },
    ],
  },
  {
    id: 'd2',
    title: 'Store money as integer cents',
    status: 'DRAFT',
    impact: 'CRITICAL',
    debtScore: 85,
    debtRationale: null,
    revisitAt: new Date('2026-10-01T00:00:00.000Z'),
    outcome: null,
    owner: null,
    updatedAt: new Date('2026-10-21T11:00:00.000Z'),
    evidence: [],
    pins: [],
    approvals: [],
  },
]

const sources = [
  {
    owner: 'acme',
    name: 'kestrel',
    ref: 'main',
    commitSha: 'abc123def456',
    fileCount: 3,
    commitCount: 4,
    pullRequestCount: 2,
    issueCount: 1,
  },
]

describe('buildWorkspaceDossier', () => {
  it('builds the deal dossier sections and summaries', () => {
    const dossier = buildWorkspaceDossier({
      workspace,
      decisions,
      sources,
      generatedBy: 'Asha Rao',
      generatedAt: new Date('2026-10-22T09:00:00.000Z'),
    })

    expect(dossier).toContain('# Decision Diligence Dossier — Project Kestrel')
    expect(dossier).toContain('## Deal context')
    expect(dossier).toContain('- **Decisions:** 2')
    expect(dossier).toContain('- **Evidence items:** 2')
    expect(dossier).toContain('- **Unresolved evidence:** 1')
    expect(dossier).toContain('- **Decisions without evidence:** 1')
    expect(dossier).toContain('- **Average decision debt:** 75/100')
    expect(dossier).toContain('### D-01. Validate sessions on every request')
    expect(dossier).toContain('### D-02. Store money as integer cents')
    expect(dossier).toContain('#### Pins')
    expect(dossier).toContain('Request a protected route without a cookie; expect 401.')
    expect(dossier).toContain('## Contradictions and unsupported claims')
    expect(dossier).toContain('## Open questions')
    expect(dossier).toContain('has no evidence attached')
    expect(dossier).toContain('is due for a revisit and has no outcome recorded')
    expect(dossier).toContain('## Evidence appendix')
    expect(dossier).toContain('src/middleware.ts')
    expect(dossier).toContain('## Sources')
    expect(dossier).toContain('acme/kestrel')
    expect(dossier).toContain('## Method and limitations')
  })

  it('is deterministic for a fixed generation time', () => {
    const input = {
      workspace,
      decisions,
      sources,
      generatedBy: 'Asha Rao',
      generatedAt: new Date('2026-10-22T09:00:00.000Z'),
    }

    expect(buildWorkspaceDossier(input)).toBe(buildWorkspaceDossier(input))
  })

  it('redacts source coordinates while keeping quotes', () => {
    const dossier = buildWorkspaceDossier({
      workspace,
      decisions,
      sources,
      generatedAt: new Date('2026-10-22T09:00:00.000Z'),
    })
    const redacted = redactDossierContent(dossier)

    expect(redacted).toContain('Source: `[redacted]`')
    expect(redacted).toContain('Commit: `[redacted]`')
    expect(redacted).toContain('SHA-256: `[redacted]`')
    expect(redacted).toContain('- **[redacted source]** — 3 files')
    expect(redacted).toContain('Sessions are validated on every request.')
    expect(redacted).not.toContain('src/middleware.ts')
    expect(redacted).not.toContain('acme/kestrel')
  })

  it('handles an empty workspace without throwing', () => {
    const dossier = buildWorkspaceDossier({
      workspace: { name: 'Empty', description: null },
      decisions: [],
      sources: [],
      generatedAt: new Date('2026-10-22T09:00:00.000Z'),
    })

    expect(dossier).toContain('_No decisions recorded._')
    expect(dossier).toContain('_No source snapshots recorded._')
    expect(dossier).toContain('- **Average decision debt:** 0/100')
  })
})
