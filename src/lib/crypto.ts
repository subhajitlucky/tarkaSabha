import crypto from 'crypto'

// Environment variable for encryption key (32 bytes for AES-256)
const ENCRYPTION_KEY_ENV = process.env.ENCRYPTION_KEY

// Validate encryption key on module load
if (!ENCRYPTION_KEY_ENV) {
  throw new Error(
    'CRITICAL: ENCRYPTION_KEY environment variable is not set. ' +
    'Please set ENCRYPTION_KEY in your .env file (minimum 32 characters). ' +
    'Generate one with: openssl rand -base64 32'
  )
}

if (ENCRYPTION_KEY_ENV.length < 32) {
  throw new Error(
    'CRITICAL: ENCRYPTION_KEY must be at least 32 characters long. ' +
    `Current length: ${ENCRYPTION_KEY_ENV.length}`
  )
}

const ENCRYPTION_KEY: string = ENCRYPTION_KEY_ENV
const IV_LENGTH = 16
const ALGORITHM = 'aes-256-gcm'

export class CryptoService {
  private static instance: CryptoService
  private key: Buffer

  private constructor() {
    // Ensure key is exactly 32 bytes using scrypt
    this.key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
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
   * Note: Key is now required at startup, so this always returns valid
   */
  static validateKey(): { valid: boolean; message: string } {
    return { valid: true, message: 'Encryption key configured' }
  }
}

export const cryptoService = CryptoService.getInstance()
