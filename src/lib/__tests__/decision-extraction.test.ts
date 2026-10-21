import { describe, expect, it } from 'vitest'
import {
  MAX_CANDIDATES,
  buildExtractionPrompt,
  parseCandidateResponse,
} from '../decision-extraction'

const snapshots = [
  {
    id: 'snap-file',
    kind: 'FILE',
    path: 'src/auth/session.ts',
    title: 'session.ts',
    content: 'Sessions are validated on every request.',
    sha: 'blob1',
  },
  {
    id: 'snap-commit',
    kind: 'COMMIT',
    path: 'abc123',
    title: 'Validate sessions in middleware',
    content: 'Move session validation into middleware.',
  },
]

describe('buildExtractionPrompt', () => {
  it('includes the repository, snapshots, and confirmation contract', () => {
    const prompt = buildExtractionPrompt({
      repo: 'acme/kestrel',
      ref: 'main',
      snapshots,
    })

    expect(prompt).toContain('Repository: acme/kestrel')
    expect(prompt).toContain('Ref: main')
    expect(prompt).toContain('SNAPSHOT snap-file')
    expect(prompt).toContain('Sessions are validated on every request.')
    expect(prompt).toContain('Do NOT propose recommendations')
    expect(prompt).toContain('untrusted data')
    expect(prompt).toContain(`at most ${MAX_CANDIDATES}`)
  })
})

describe('parseCandidateResponse', () => {
  it('parses valid candidates and keeps only cited snapshots', () => {
    const text = JSON.stringify({
      candidates: [
        {
          title: 'Validate sessions on every request',
          context: 'Sessions are bearer credentials.',
          proposal: 'Session validation happens in middleware for every request.',
          rationale: 'The middleware calls the session validator.',
          confidence: 'HIGH',
          evidence: [
            { snapshotId: 'snap-file', quote: 'Sessions are validated on every request.' },
            { snapshotId: 'unknown', quote: 'not a real snapshot' },
          ],
        },
      ],
    })

    const parsed = parseCandidateResponse(text, new Set(['snap-file', 'snap-commit']))

    expect(parsed).toHaveLength(1)
    expect(parsed?.[0]).toMatchObject({
      title: 'Validate sessions on every request',
      confidence: 'HIGH',
    })
    expect(parsed?.[0].evidence).toEqual([
      { snapshotId: 'snap-file', quote: 'Sessions are validated on every request.' },
    ])
  })

  it('drops candidates with no valid evidence', () => {
    const text = JSON.stringify({
      candidates: [
        {
          title: 'Unsupported claim',
          confidence: 'HIGH',
          evidence: [{ snapshotId: 'unknown', quote: 'nope' }],
        },
      ],
    })

    expect(parseCandidateResponse(text, new Set(['snap-file']))).toEqual([])
  })

  it('returns null for malformed output', () => {
    expect(parseCandidateResponse('not json', new Set())).toBeNull()
    expect(parseCandidateResponse('{"candidates": "nope"}', new Set())).toBeNull()
  })

  it('caps candidates at the configured maximum', () => {
    const text = JSON.stringify({
      candidates: Array.from({ length: MAX_CANDIDATES + 4 }, (_, index) => ({
        title: `Decision ${index}`,
        confidence: 'MEDIUM',
        evidence: [{ snapshotId: 'snap-file', quote: 'quote' }],
      })),
    })

    expect(parseCandidateResponse(text, new Set(['snap-file']))).toHaveLength(MAX_CANDIDATES)
  })
})
