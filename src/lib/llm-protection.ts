import { LLMError } from './llm-provider'

// Timeout for LLM API calls (30 seconds)
export const LLM_TIMEOUT_MS = 30000

// Maximum response length (2000 chars) to prevent infinite output loops
export const MAX_RESPONSE_LENGTH = 2000

// Maximum input length for messages
export const MAX_MESSAGE_LENGTH = 4000

// Circuit breaker states
type CircuitState = 'closed' | 'open' | 'half-open'

interface CircuitBreakerConfig {
  failureThreshold: number // Number of failures before opening
  successThreshold: number // Number of successes in half-open before closing
  resetTimeoutMs: number   // Time to wait before trying again
}

const defaultConfig: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 3,
  resetTimeoutMs: 60000, // 1 minute
}

// Circuit breaker for each provider
const circuitBreakers = new Map<string, { state: CircuitState; failures: number; successes: number; lastFailure: number }>()

/**
 * Add timeout wrapper for promises
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Request timed out'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new LLMError(errorMessage, 'TIMEOUT'))
    }, timeoutMs)

    promise
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

/**
 * Get circuit breaker state for a provider
 */
export function getCircuitState(providerId: string) {
  return circuitBreakers.get(providerId)?.state || 'closed'
}

/**
 * Record a success for circuit breaker
 */
export function recordSuccess(providerId: string, config: CircuitBreakerConfig = defaultConfig) {
  const breaker = circuitBreakers.get(providerId)

  if (!breaker) return

  if (breaker.state === 'half-open') {
    breaker.successes++
    if (breaker.successes >= config.successThreshold) {
      // Close the circuit
      breaker.state = 'closed'
      breaker.failures = 0
      breaker.successes = 0
      console.log(`[CircuitBreaker] Provider ${providerId} circuit closed (recovered)`)
    }
  } else if (breaker.state === 'closed') {
    // Reset failure count on success
    breaker.failures = 0
  }
}

/**
 * Record a failure for circuit breaker
 */
export function recordFailure(providerId: string, config: CircuitBreakerConfig = defaultConfig) {
  let breaker = circuitBreakers.get(providerId)

  if (!breaker) {
    breaker = { state: 'closed', failures: 0, successes: 0, lastFailure: 0 }
    circuitBreakers.set(providerId, breaker)
  }

  breaker.failures++
  breaker.lastFailure = Date.now()

  if (breaker.state === 'closed' && breaker.failures >= config.failureThreshold) {
    breaker.state = 'open'
    console.warn(`[CircuitBreaker] Provider ${providerId} circuit opened due to ${breaker.failures} failures`)
  } else if (breaker.state === 'half-open') {
    // Back to open
    breaker.state = 'open'
    breaker.successes = 0
  }
}

/**
 * Check if circuit is open (should fail fast)
 */
export function isCircuitOpen(providerId: string): boolean {
  const breaker = circuitBreakers.get(providerId)

  if (!breaker) return false

  if (breaker.state === 'open') {
    // Check if it's time to try again
    if (Date.now() - breaker.lastFailure >= defaultConfig.resetTimeoutMs) {
      breaker.state = 'half-open'
      breaker.successes = 0
      console.log(`[CircuitBreaker] Provider ${providerId} circuit half-open (testing)`)
      return false
    }
    return true
  }

  return false
}

/**
 * Reset circuit breaker for a provider
 */
export function resetCircuitBreaker(providerId: string) {
  circuitBreakers.delete(providerId)
  console.log(`[CircuitBreaker] Provider ${providerId} circuit reset`)
}

/**
 * Truncate response if too long (prevents infinite output)
 */
export function truncateResponse(content: string, maxLength: number = MAX_RESPONSE_LENGTH): string {
  if (content.length <= maxLength) return content

  // Find a good cutoff point at sentence boundary
  const truncated = content.slice(0, maxLength)
  const lastSentenceEnd = truncated.lastIndexOf('.')
  const lastNewline = truncated.lastIndexOf('\n')

  const cutPoint = Math.max(
    lastSentenceEnd > 0 ? lastSentenceEnd + 1 : 0,
    lastNewline > 0 ? lastNewline : 0,
    Math.floor(maxLength * 0.9) // Fallback to 90% of max
  )

  return content.slice(0, cutPoint).trim() + '... [response truncated for safety]'
}

/**
 * Sanitize message content to prevent injection attacks
 */
export function detectLoop(content: string): boolean {
  // Check for repeated phrases of significant length
  const sentences = content.split(/[.!?\n]/).filter(s => s.trim().length > 10);
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i].trim();
    const count = sentences.filter(other => other.trim() === s).length;
    if (count > 3) return true;
  }
  
  // Check for character-level repetition (e.g., "abcabcabcabc")
  if (content.length > 50) {
      for (let len = 5; len <= 20; len++) {
          const chunk = content.substring(0, len);
          let matchCount = 0;
          for (let i = 0; i < content.length - len; i += len) {
              if (content.substring(i, i + len) === chunk) {
                  matchCount++;
              } else {
                  break;
              }
          }
          if (matchCount > 4) return true;
      }
  }

  return false;
}

export function sanitizeContent(content: string): string {
  // Remove null bytes and other dangerous characters
  let sanitized = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\u200B\uFEFF]/g, '')

  // Remove potential prompt injection patterns
  const injectionPatterns = [
    /ignore\s+(previous|above|prior)\s+(instruction|command|directive)/gi,
    /system\s*prompt/gi,
    /you\s+are\s+(now|a|an?)\s*(ai|assistant|bot)/gi,
    /jailbreak/gi,
    /roleplay.*break/gi,
    /pretend\s+to\s+be/gi,
    /override/gi,
  ]

  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '[FILTERED]')
  }

  // Limit consecutive newlines
  sanitized = sanitized.replace(/\n{5,}/g, '\n\n\n')

  return sanitized.trim()
}

/**
 * Validate message length
 */
export function validateMessageLength(content: string): { valid: boolean; error?: string } {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Message content is required' }
  }

  const trimmed = content.trim()

  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty' }
  }

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` }
  }

  return { valid: true }
}

