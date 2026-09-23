import { describe, expect, it } from 'vitest'
import { CryptoService, cryptoService } from '../crypto'

describe('CryptoService', () => {
  it('round-trips encrypt and decrypt', () => {
    const plaintext = 'sk-live-super-secret-api-key'
    const encrypted = cryptoService.encrypt(plaintext)
    expect(encrypted).not.toContain(plaintext)
    expect(encrypted.split(':')).toHaveLength(3)
    expect(cryptoService.decrypt(encrypted)).toBe(plaintext)
  })

  it('produces different ciphertext for the same plaintext (random IV)', () => {
    const a = cryptoService.encrypt('same-input')
    const b = cryptoService.encrypt('same-input')
    expect(a).not.toBe(b)
  })

  it('rejects malformed ciphertext', () => {
    expect(() => cryptoService.decrypt('not-a-valid-payload')).toThrow(
      'Invalid encrypted format'
    )
  })

  it('masks keys down to the last four characters', () => {
    expect(cryptoService.maskKey('abcdefghij')).toBe('******ghij')
    expect(cryptoService.maskKey('abcd')).toBe('****')
  })

  it('reports a valid encryption key configuration', () => {
    expect(CryptoService.validateKey().valid).toBe(true)
  })
})
