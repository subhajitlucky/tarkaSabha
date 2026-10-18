import { describe, expect, it } from 'vitest'
import { evaluateExpression } from '../tools/calculator'
import { checkUrl, htmlToText, isBlockedAddress } from '../tools/fetch-url'
import { resolveTools, TOOL_NAMES } from '../tools'

describe('calculator', () => {
  it('evaluates arithmetic with precedence and parentheses', () => {
    expect(evaluateExpression('2 + 3 * 4')).toBe(14)
    expect(evaluateExpression('(2 + 3) * 4')).toBe(20)
    expect(evaluateExpression('2 ^ 10')).toBe(1024)
    expect(evaluateExpression('-5 + 2')).toBe(-3)
    expect(evaluateExpression('10 % 3')).toBe(1)
  })

  it('supports functions and constants', () => {
    expect(evaluateExpression('sqrt(144)')).toBe(12)
    expect(evaluateExpression('max(3, 7, 5)')).toBe(7)
    expect(evaluateExpression('round(pi * 100) / 100')).toBeCloseTo(3.14, 5)
  })

  it('refuses division by zero instead of returning Infinity', () => {
    expect(() => evaluateExpression('1 / 0')).toThrow(/Division by zero/)
    expect(() => evaluateExpression('1 % 0')).toThrow(/Modulo by zero/)
  })

  it('cannot reach JavaScript: no identifiers, calls or property access', () => {
    // These are the shapes that would matter if this used eval or new Function.
    for (const hostile of [
      'process.exit(1)',
      'globalThis',
      'this',
      'require("fs")',
      'constructor',
      '[].constructor',
      '(() => 1)()',
      'alert(1)',
      '1; process.exit(1)',
    ]) {
      expect(() => evaluateExpression(hostile)).toThrow()
    }
  })

  it('rejects malformed and oversized input', () => {
    expect(() => evaluateExpression('2 +')).toThrow()
    expect(() => evaluateExpression('(2 + 3')).toThrow(/parenthesis/)
    expect(() => evaluateExpression('sqrt()')).toThrow()
    expect(() => evaluateExpression('sqrt(1, 2)')).toThrow()
    expect(() => evaluateExpression('x'.repeat(600))).toThrow(/too long/)
  })
})

describe('isBlockedAddress', () => {
  it('blocks loopback, private, link-local and metadata ranges', () => {
    for (const address of [
      '127.0.0.1',
      '127.1.2.3',
      '10.0.0.5',
      '172.16.0.1',
      '172.31.255.255',
      '192.168.1.1',
      '169.254.169.254', // cloud metadata
      '100.64.0.1', // CGNAT
      '0.0.0.0',
      '224.0.0.1', // multicast
      '::1',
      '::',
      'fc00::1',
      'fe80::1',
      '::ffff:127.0.0.1',
    ]) {
      expect(isBlockedAddress(address), address).toBe(true)
    }
  })

  it('allows public addresses', () => {
    for (const address of ['8.8.8.8', '1.1.1.1', '93.184.216.34', '2606:4700::1111']) {
      expect(isBlockedAddress(address), address).toBe(false)
    }
  })

  it('blocks anything that is not an IP literal, rather than guessing', () => {
    expect(isBlockedAddress('example.com')).toBe(true)
    expect(isBlockedAddress('')).toBe(true)
  })
})

describe('checkUrl', () => {
  it('refuses non-http schemes and credentials', async () => {
    expect((await checkUrl('file:///etc/passwd')).ok).toBe(false)
    expect((await checkUrl('javascript:alert(1)')).ok).toBe(false)
    expect((await checkUrl('gopher://example.com')).ok).toBe(false)
    expect((await checkUrl('https://user:pass@example.com')).ok).toBe(false)
  })

  it('refuses loopback and metadata literals without touching the network', async () => {
    expect((await checkUrl('http://127.0.0.1:3000/admin')).ok).toBe(false)
    expect((await checkUrl('http://169.254.169.254/latest/meta-data/')).ok).toBe(false)
    expect((await checkUrl('http://[::1]:8080/')).ok).toBe(false)
    expect((await checkUrl('http://localhost/')).ok).toBe(false)
    expect((await checkUrl('http://metadata.google.internal/')).ok).toBe(false)
  })

  it('accepts a public literal address', async () => {
    const result = await checkUrl('https://8.8.8.8/')
    expect(result.ok).toBe(true)
  })
})

describe('htmlToText', () => {
  it('drops scripts, styles and tags but keeps the prose', () => {
    const html = `<html><head><style>body{color:red}</style>
      <script>alert('x')</script></head>
      <body><h1>Title</h1><p>First para.</p><p>Second &amp; last.</p></body></html>`
    const text = htmlToText(html)

    expect(text).toContain('Title')
    expect(text).toContain('First para.')
    expect(text).toContain('Second & last.')
    expect(text).not.toContain('alert')
    expect(text).not.toContain('color:red')
    expect(text).not.toContain('<')
  })
})

describe('resolveTools', () => {
  it('returns only registered tools and de-duplicates', () => {
    expect(resolveTools(['calculator', 'nope', 'calculator']).map((t) => t.schema.name)).toEqual([
      'calculator',
    ])
  })

  it('treats a missing or empty allowlist as no tools', () => {
    expect(resolveTools([])).toEqual([])
    expect(resolveTools(null)).toEqual([])
    expect(resolveTools(undefined)).toEqual([])
  })

  it('exposes the expected tool names', () => {
    expect(TOOL_NAMES.sort()).toEqual(['calculator', 'fetch_url', 'web_search'])
  })
})
