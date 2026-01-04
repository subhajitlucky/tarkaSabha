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
const ALGORITHM = 'aes-256-gcm'

export class CryptoService {
  private static instance: CryptoService
  private key: Buffer

  private constructor() {
    const key = getEncryptionKey()
    // Ensure key is exactly 32 bytes using scrypt
    this.key = crypto.scryptSync(key, 'salt', 32)
  }

  static getInstance(): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService()
    }
    return CryptoService.instance
  }

  /**
   * Encrypt a plaintext string
   * Returns: iv:authTag:encryptedData (base64 encoded)
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv)

    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Combine iv + authTag + encrypted data
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
  }

  /**
   * Decrypt an encrypted string
   */
  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format')
    }

    const [ivHex, authTagHex, encrypted] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv)
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
    } catch (error: any) {
      return { valid: false, message: error.message }
    }
  }
}

export const cryptoService = CryptoService.getInstance()
