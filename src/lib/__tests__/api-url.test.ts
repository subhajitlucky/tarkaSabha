import { describe, expect, it } from 'vitest'
import {
  MAX_API_URL_LENGTH,
  normalizeProviderApiUrl,
  validateProviderApiUrl,
} from '../api-url'

describe('validateProviderApiUrl', () => {
  it('allows public https URLs', () => {
    expect(validateProviderApiUrl('https://api.openai.com/v1').valid).toBe(true)
    expect(validateProviderApiUrl('https://api.anthropic.com').valid).toBe(true)
  })

  it('allows http only for localhost variants', () => {
    expect(validateProviderApiUrl('http://localhost:11434/v1').valid).toBe(true)
    expect(validateProviderApiUrl('http://127.0.0.1:11434/v1').valid).toBe(true)
    expect(validateProviderApiUrl('http://[::1]:11434/v1').valid).toBe(true)
  })

  it('rejects http for non-localhost hosts', () => {
    expect(validateProviderApiUrl('http://api.example.com/v1').valid).toBe(false)
  })

  it('rejects URLs containing credentials', () => {
    expect(validateProviderApiUrl('https://user:pass@api.example.com/v1').valid).toBe(false)
    expect(validateProviderApiUrl('https://user@api.example.com/v1').valid).toBe(false)
  })

  it('rejects invalid URLs and empty values', () => {
    expect(validateProviderApiUrl('not a url').valid).toBe(false)
    expect(validateProviderApiUrl('').valid).toBe(false)
  })

  it('blocks private and link-local IPv4 ranges', () => {
    expect(validateProviderApiUrl('https://10.0.0.5/v1').valid).toBe(false)
    expect(validateProviderApiUrl('https://172.16.0.1/v1').valid).toBe(false)
    expect(validateProviderApiUrl('https://172.31.255.255/v1').valid).toBe(false)
    expect(validateProviderApiUrl('https://192.168.1.1/v1').valid).toBe(false)
    expect(validateProviderApiUrl('https://169.254.169.254/latest/meta-data').valid).toBe(false)
    expect(validateProviderApiUrl('https://127.0.0.2/v1').valid).toBe(false)
    expect(validateProviderApiUrl('https://0.0.0.0/v1').valid).toBe(false)
  })

  it('allows public IPv4 addresses just outside private blocks', () => {
    expect(validateProviderApiUrl('https://172.15.0.1/v1').valid).toBe(true)
    expect(validateProviderApiUrl('https://172.32.0.1/v1').valid).toBe(true)
    expect(validateProviderApiUrl('https://192.169.0.1/v1').valid).toBe(true)
  })

  it('blocks link-local and unique-local IPv6 ranges', () => {
    expect(validateProviderApiUrl('https://[fe80::1]/v1').valid).toBe(false)
    expect(validateProviderApiUrl('https://[febf::1]/v1').valid).toBe(false)
    expect(validateProviderApiUrl('https://[fc00::1]/v1').valid).toBe(false)
    expect(validateProviderApiUrl('https://[fd12:3456::1]/v1').valid).toBe(false)
    expect(validateProviderApiUrl('https://[::]/v1').valid).toBe(false)
  })

  it('blocks IPv4-mapped private addresses', () => {
    expect(validateProviderApiUrl('https://[::ffff:10.0.0.1]/v1').valid).toBe(false)
    expect(validateProviderApiUrl('https://[::ffff:192.168.0.1]/v1').valid).toBe(false)
  })

  it('blocks the metadata hostname', () => {
    expect(validateProviderApiUrl('https://metadata.google.internal/computeMetadata/v1').valid).toBe(false)
    expect(validateProviderApiUrl('https://foo.metadata.google.internal/').valid).toBe(false)
  })

  it('rejects non-http protocols', () => {
    expect(validateProviderApiUrl('ftp://api.example.com/v1').valid).toBe(false)
    expect(validateProviderApiUrl('file:///etc/passwd').valid).toBe(false)
  })

  it('caps URLs at 2048 characters', () => {
    const longUrl = 'https://api.example.com/' + 'a'.repeat(MAX_API_URL_LENGTH)
    expect(validateProviderApiUrl(longUrl).valid).toBe(false)
  })
})

describe('normalizeProviderApiUrl', () => {
  it('trims and returns valid URLs', () => {
    expect(normalizeProviderApiUrl('  https://api.example.com/v1  ')).toBe(
      'https://api.example.com/v1'
    )
  })

  it('returns null for invalid URLs', () => {
    expect(normalizeProviderApiUrl('http://10.0.0.1/v1')).toBeNull()
  })
})
