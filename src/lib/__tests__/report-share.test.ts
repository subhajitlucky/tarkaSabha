import { describe, expect, it } from 'vitest'
import { createShareToken, redactReportContent } from '../report-share'
import { sha256 } from '../decision-report'

describe('createShareToken', () => {
  it('returns a bearer token and its SHA-256 hash', () => {
    const { token, tokenHash } = createShareToken()

    expect(token.length).toBeGreaterThan(30)
    expect(tokenHash).toMatch(/^[a-f0-9]{64}$/)
    expect(sha256(token)).toBe(tokenHash)
  })

  it('does not reuse tokens', () => {
    const first = createShareToken()
    const second = createShareToken()

    expect(first.token).not.toBe(second.token)
    expect(first.tokenHash).not.toBe(second.tokenHash)
  })
})

describe('redactReportContent', () => {
  const content = [
    '# Decision Evidence Report — Kestrel',
    '- **Source:** `src/private/auth.ts`',
    '- **Commit:** `abc123`',
    '- **SHA-256:** `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`',
    '> Membership is the authorization boundary.',
    '  - Snapshot hash: `bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`',
    '- **Decision ID:** `d1`',
  ].join('\n')

  it('hides source coordinates but keeps the evidence argument', () => {
    const redacted = redactReportContent(content)

    expect(redacted).toContain('- **Source:** `[redacted]`')
    expect(redacted).toContain('- **Commit:** `[redacted]`')
    expect(redacted).toContain('- **SHA-256:** `[redacted]`')
    expect(redacted).toContain('  - Snapshot hash: `[redacted]`')
    expect(redacted).toContain('- **Decision ID:** `[redacted]`')
    expect(redacted).toContain('> Membership is the authorization boundary.')
    expect(redacted).not.toContain('src/private/auth.ts')
    expect(redacted).not.toContain('abc123')
  })
})
