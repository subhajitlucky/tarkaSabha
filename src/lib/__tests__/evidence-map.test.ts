import { describe, expect, it } from 'vitest'
import { buildEvidenceMap, splitClaims } from '../evidence-map'

const evidence = [
  {
    name: 'web_search',
    arguments: '{"query":"postgres row level security tenant isolation"}',
    ok: true,
    preview: 'Postgres row level security policies isolate tenants by tenant_id.',
  },
]

describe('splitClaims', () => {
  it('drops headings and code but keeps substantive sentences', () => {
    const content = `# Recommendation\n\nUse row-level security for tenant isolation.\n\n\`\`\`sql\nselect 1;\n\`\`\`\n\nAdd a two-tenant probe to CI so the boundary is tested.`
    const claims = splitClaims(content)

    expect(claims).toHaveLength(2)
    expect(claims[0]).toContain('row-level security')
    expect(claims[1]).toContain('two-tenant probe')
  })
})

describe('buildEvidenceMap', () => {
  it('links a claim to a recorded tool call with overlapping terms', () => {
    const map = buildEvidenceMap({
      content: 'Postgres row-level security policies isolate tenants by tenant_id.',
      messages: [{ id: 'm1', speaker: 'Meera', createdAt: new Date(), evidence }],
    })

    expect(map.toolCallCount).toBe(1)
    expect(map.claims[0].status).toBe('linked')
    expect(map.claims[0].evidenceId).toBe('m1:0')
  })

  it('flags claims that have no recorded evidence', () => {
    const map = buildEvidenceMap({
      content: 'The team should hire two more engineers before the launch.',
      messages: [{ id: 'm1', speaker: 'Meera', createdAt: new Date(), evidence }],
    })

    expect(map.claims[0].status).toBe('unsupported')
    expect(map.unsupportedCount).toBe(1)
  })

  it('flags every claim when the run recorded no tools', () => {
    const map = buildEvidenceMap({
      content: 'Postgres row-level security policies isolate tenants by tenant_id.',
      messages: [{ id: 'm1', speaker: 'Meera', createdAt: new Date(), evidence: null }],
    })

    expect(map.toolCallCount).toBe(0)
    expect(map.unsupportedCount).toBe(1)
    expect(map.claims[0].reason).toContain('No tool evidence')
  })
})
