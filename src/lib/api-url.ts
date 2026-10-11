export const MAX_API_URL_LENGTH = 2048

export interface ApiUrlValidationResult {
  valid: boolean
  error?: string
}

function parseIPv4(hostname: string): number[] | null {
  const parts = hostname.split('.')
  if (parts.length !== 4) return null
  const octets = parts.map((part) => (/^\d{1,3}$/.test(part) ? Number(part) : NaN))
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return null
  }
  return octets
}

function isBlockedIPv4(hostname: string): boolean {
  const octets = parseIPv4(hostname)
  if (!octets) return false
  const [a, b] = octets
  if (a === 0) return true
  if (a === 10) return true
  if (a === 127) return hostname !== '127.0.0.1'
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  return false
}

function expandIPv6(input: string): number[] | null {
  let host = input
  if (host.startsWith('[') && host.endsWith(']')) {
    host = host.slice(1, -1)
  }
  if (!host.includes(':')) return null

  const zoneIndex = host.indexOf('%')
  if (zoneIndex !== -1) host = host.slice(0, zoneIndex)

  let embedded: number[] = []
  const ipv4Match = host.match(/(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (ipv4Match) {
    const octets = parseIPv4(ipv4Match[0])
    if (!octets) return null
    embedded = [(octets[0] << 8) | octets[1], (octets[2] << 8) | octets[3]]
    host = host.slice(0, host.length - ipv4Match[0].length)
  }

  const halves = host.split('::')
  if (halves.length > 2) return null

  const parseGroups = (part: string): number[] | null => {
    if (!part) return []
    const groups = part.split(':').map((group) =>
      /^[0-9a-fA-F]{1,4}$/.test(group) ? parseInt(group, 16) : NaN
    )
    return groups.some((group) => Number.isNaN(group)) ? null : groups
  }

  const head = parseGroups(halves[0])
  const tail = parseGroups(halves.length === 2 ? halves[1] : '')
  if (!head || !tail) return null

  if (halves.length === 2) {
    const missing = 8 - (head.length + tail.length + embedded.length)
    if (missing < 0) return null
    return [...head, ...new Array(missing).fill(0), ...tail, ...embedded]
  }

  const groups = [...head, ...tail, ...embedded]
  return groups.length === 8 ? groups : null
}

function isBlockedIPv6(groups: number[]): boolean {
  const first = groups[0]
  if ((first & 0xffc0) === 0xfe80) return true // link-local fe80::/10
  if ((first & 0xfe00) === 0xfc00) return true // unique-local fc00::/7
  if (groups.every((group) => group === 0)) return true // unspecified ::

  const mappedPrefix = [0, 0, 0, 0, 0, 0xffff]
  if (mappedPrefix.every((value, index) => groups[index] === value)) {
    const mapped = `${groups[6] >> 8}.${groups[6] & 0xff}.${groups[7] >> 8}.${groups[7] & 0xff}`
    return mapped !== '127.0.0.1' && isBlockedIPv4(mapped)
  }

  return false
}

export function validateProviderApiUrl(raw: string): ApiUrlValidationResult {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return { valid: false, error: 'API URL is required' }
  }

  if (raw.length > MAX_API_URL_LENGTH) {
    return { valid: false, error: `API URL is too long (max ${MAX_API_URL_LENGTH} characters)` }
  }

  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return { valid: false, error: 'Invalid API URL format (e.g., https://api.example.com/v1)' }
  }

  if (url.username || url.password) {
    return { valid: false, error: 'API URL must not contain credentials' }
  }

  const protocol = url.protocol.toLowerCase()
  if (protocol !== 'https:' && protocol !== 'http:') {
    return { valid: false, error: 'API URL must use https (http is only allowed for localhost)' }
  }

  const hostname = url.hostname.toLowerCase()
  const bareHostname =
    hostname.startsWith('[') && hostname.endsWith(']')
      ? hostname.slice(1, -1)
      : hostname

  const isLoopback =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    bareHostname === '::1'

  if (protocol === 'http:' && !isLoopback) {
    return { valid: false, error: 'API URL must use https unless it points to localhost' }
  }

  if (hostname === 'metadata.google.internal' || hostname.endsWith('.metadata.google.internal')) {
    return { valid: false, error: 'API URL must not target metadata services' }
  }

  const ipv6Groups = expandIPv6(hostname)
  if (ipv6Groups) {
    const loopback =
      ipv6Groups.slice(0, 7).every((group) => group === 0) && ipv6Groups[7] === 1
    if (!loopback && isBlockedIPv6(ipv6Groups)) {
      return { valid: false, error: 'API URL must not target private, link-local, or reserved ranges' }
    }
    return { valid: true }
  }

  const ipv4Octets = parseIPv4(hostname)
  if (ipv4Octets && hostname !== '127.0.0.1' && isBlockedIPv4(hostname)) {
    return { valid: false, error: 'API URL must not target private, link-local, or reserved ranges' }
  }

  return { valid: true }
}

export function normalizeProviderApiUrl(raw: string): string | null {
  return validateProviderApiUrl(raw).valid ? raw.trim() : null
}
