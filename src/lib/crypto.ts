import crypto from 'crypto'

// Environment variable for encryption key (32 bytes for AES-256)
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY

  // During build time, Next.js might evaluate this module.
  // We only want to throw if we're actually trying to use the crypto service.
  if (!key) {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      // Return a dummy key during build phase to prevent crash
      return 'static_build_key_placeholder_32_chars_long'
    }
    throw new Error(
      'CRITICAL: ENCRYPTION_KEY environment variable is not set. ' +
      'Please set ENCRYPTION_KEY in your .env file (minimum 32 characters). ' +
      'Generate one with: openssl rand -base64 32'
    )
  }

  if (key.length < 32) {
    throw new Error(
      'CRITICAL: ENCRYPTION_KEY must be at least 32 characters long. ' +
      `Current length: ${key.length}`
    )
  }

  return key
}

const IV_LENGTH = 16
const SALT_LENGTH = 16
const KEY_LENGTH = 32
const ALGORITHM = 'aes-256-gcm'
const LEGACY_SALT = 'salt'
export const ENCRYPTED_V2_PREFIX = 'enc:v2'

export class CryptoService {
  private static instance: CryptoService
  private masterKey: string
  private legacyKey: Buffer

  private constructor() {
    this.masterKey = getEncryptionKey()
    // Legacy ciphertext derives the key with a fixed salt
    this.legacyKey = crypto.scryptSync(this.masterKey, LEGACY_SALT, KEY_LENGTH)
  }

  static getInstance(): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService()
    }
    return CryptoService.instance
  }

  /**
   * Encrypt a plaintext string.
   * New payloads use the versioned format: enc:v2:salt:iv:authTag:encryptedData
   */
  encrypt(plaintext: string): string {
    const salt = crypto.randomBytes(SALT_LENGTH)
    const key = crypto.scryptSync(this.masterKey, salt, KEY_LENGTH)
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    return [
      ENCRYPTED_V2_PREFIX,
      salt.toString('hex'),
      iv.toString('hex'),
      authTag.toString('hex'),
      encrypted,
    ].join(':')
  }

  /**
   * Decrypt an encrypted string.
   * Supports both the versioned v2 format and the legacy iv:authTag:data format.
   */
  decrypt(encryptedText: string): string {
    if (encryptedText.startsWith(`${ENCRYPTED_V2_PREFIX}:`)) {
      const parts = encryptedText.split(':')
      if (parts.length !== 6) {
        throw new Error('Invalid encrypted format')
      }

      const [, , saltHex, ivHex, authTagHex, encrypted] = parts
      const salt = Buffer.from(saltHex, 'hex')
      if (salt.length === 0) {
        throw new Error('Invalid encrypted format')
      }

      const key = crypto.scryptSync(this.masterKey, salt, KEY_LENGTH)
      return this.decryptWithKey(key, ivHex, authTagHex, encrypted)
    }

    const parts = encryptedText.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format')
    }

    const [ivHex, authTagHex, encrypted] = parts
    return this.decryptWithKey(this.legacyKey, ivHex, authTagHex, encrypted)
  }

  private decryptWithKey(key: Buffer, ivHex: string, authTagHex: string, encrypted: string): string {
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  /**
   * Mask API key for display (show only last 4 chars)
   */
  maskKey(apiKey: string): string {
    if (apiKey.length <= 4) return '****'
    return '*'.repeat(apiKey.length - 4) + apiKey.slice(-4)
  }

  /**
   * Validate encryption key strength
   */
  static validateKey(): { valid: boolean; message: string } {
    try {
      getEncryptionKey()
      return { valid: true, message: 'Encryption key configured' }
    } catch (error: unknown) {
      return {
        valid: false,
        message: error instanceof Error ? error.message : String(error),
      }
    }
  }
}

export const cryptoService = CryptoService.getInstance()
