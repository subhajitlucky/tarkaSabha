import crypto from 'crypto'
import { describe, expect, it } from 'vitest'
import { CryptoService, cryptoService, ENCRYPTED_V2_PREFIX } from '../crypto'

function encryptLegacy(plaintext: string): string {
  const key = crypto.scryptSync(
    process.env.ENCRYPTION_KEY as string,
    'salt',
    32
  )
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + cipher.getAuthTag().toString('hex') + ':' + encrypted
}

describe('CryptoService', () => {
  it('round-trips encrypt and decrypt with the versioned format', () => {
    const plaintext = 'sk-live-super-secret-api-key'
    const encrypted = cryptoService.encrypt(plaintext)
    expect(encrypted).not.toContain(plaintext)
    expect(encrypted.startsWith(`${ENCRYPTED_V2_PREFIX}:`)).toBe(true)
    expect(encrypted.split(':')).toHaveLength(6)
    expect(cryptoService.decrypt(encrypted)).toBe(plaintext)
  })

  it('produces different ciphertext for the same plaintext (random salt and IV)', () => {
    const a = cryptoService.encrypt('same-input')
    const b = cryptoService.encrypt('same-input')
    expect(a).not.toBe(b)
  })

  it('still decrypts ciphertext written in the legacy format', () => {
    const legacy = encryptLegacy('sk-legacy-api-key')
    expect(legacy.split(':')).toHaveLength(3)
    expect(legacy.startsWith('enc:')).toBe(false)
    expect(cryptoService.decrypt(legacy)).toBe('sk-legacy-api-key')
  })

  it('rejects malformed ciphertext', () => {
    expect(() => cryptoService.decrypt('not-a-valid-payload')).toThrow(
      'Invalid encrypted format'
    )
  })

  it('rejects malformed v2 ciphertext', () => {
    expect(() => cryptoService.decrypt('enc:v2:only:three')).toThrow(
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
