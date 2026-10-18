import { lookup } from 'node:dns/promises'
import { expandIPv6, parseIPv4 } from '../api-url'
import { ToolDefinition, readString, toolError, toolOk } from './types'

const FETCH_TIMEOUT_MS = 10_000
const MAX_BYTES = 512 * 1024
const MAX_REDIRECTS = 3
const MAX_TEXT_CHARS = 12_000
const ALLOWED_CONTENT_TYPES = ['text/html', 'text/plain', 'application/json', 'text/markdown']

/**
 * Stricter than validateProviderApiUrl on purpose.
 *
 * That validator deliberately permits loopback so users can point a provider at
 * a local Ollama. A fetch tool must not: an agent that can reach 127.0.0.1 or
 * the cloud metadata endpoint turns into an internal-network probe. This policy
 * therefore blocks loopback, all private ranges, link-local, CGNAT, and
 * multicast, for both literal addresses and resolved hostnames.
 */
export function isBlockedAddress(address: string): boolean {
  const v4 = parseIPv4(address)
  if (v4) {
    const [a, b] = v4
    if (a === 0) return true // "this network"
    if (a === 10) return true // private
    if (a === 127) return true // loopback
    if (a === 169 && b === 254) return true // link-local, incl. cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true // private
    if (a === 192 && b === 168) return true // private
    if (a === 192 && b === 0) return true // IETF protocol assignments
    if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
    if (a >= 224) return true // multicast and reserved
    return false
  }

  const v6 = expandIPv6(address)
  if (v6) {
    const [g0, g1] = v6
    const allZero = v6.every((group) => group === 0)
    if (allZero) return true // ::
    const loopback = v6.slice(0, 7).every((group) => group === 0) && v6[7] === 1
    if (loopback) return true // ::1
    if ((g0 & 0xfe00) === 0xfc00) return true // unique local fc00::/7
    if ((g0 & 0xffc0) === 0xfe80) return true // link local fe80::/10
    if ((g0 & 0xff00) === 0xff00) return true // multicast ff00::/8
    // IPv4-mapped ::ffff:a.b.c.d
    if (v6.slice(0, 5).every((group) => group === 0) && v6[5] === 0xffff) {
      const mapped = `${v6[6] >> 8}.${v6[6] & 0xff}.${v6[7] >> 8}.${v6[7] & 0xff}`
      return isBlockedAddress(mapped)
    }
    // 64:ff9b::/96 NAT64
    if (g0 === 0x64 && g1 === 0xff9b) {
      const mapped = `${v6[6] >> 8}.${v6[6] & 0xff}.${v6[7] >> 8}.${v6[7] & 0xff}`
      return isBlockedAddress(mapped)
    }
    return false
  }

  // Not an IP literal: refuse rather than guess.
  return true
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.goog',
])

export interface UrlCheck {
  ok: boolean
  url?: URL
  error?: string
}

/** Validate a URL and every address its hostname resolves to. */
export async function checkUrl(raw: string): Promise<UrlCheck> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return { ok: false, error: 'Not a valid URL' }
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, error: 'Only http and https URLs are supported' }
  }
  if (url.username || url.password) {
    return { ok: false, error: 'URLs containing credentials are not allowed' }
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost')) {
    return { ok: false, error: 'That host is not allowed' }
  }

  const literal = parseIPv4(hostname) || expandIPv6(hostname)
  if (literal) {
    if (isBlockedAddress(hostname)) {
      return { ok: false, error: 'That address is not allowed' }
    }
    return { ok: true, url }
  }

  let addresses: string[]
  try {
    const resolved = await lookup(hostname, { all: true })
    addresses = resolved.map((entry) => entry.address)
  } catch {
    return { ok: false, error: `Could not resolve ${hostname}` }
  }

  if (addresses.length === 0) {
    return { ok: false, error: `Could not resolve ${hostname}` }
  }

  // Every answer must be public: one private record is enough to reject.
  for (const address of addresses) {
    if (isBlockedAddress(address)) {
      return { ok: false, error: `${hostname} resolves to a private or reserved address` }
    }
  }

  return { ok: true, url }
}

/** Strip tags and collapse whitespace. Never renders HTML, only text. */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|section|article|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function readCapped(response: Response): Promise<string> {
  const body = response.body
  if (!body) return ''

  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    total += value.byteLength
    if (total > MAX_BYTES) {
      await reader.cancel().catch(() => {})
      break
    }
    chunks.push(value)
  }

  const merged = new Uint8Array(Math.min(total, MAX_BYTES))
  let offset = 0
  for (const chunk of chunks) {
    if (offset >= merged.length) break
    const slice = chunk.subarray(0, merged.length - offset)
    merged.set(slice, offset)
    offset += slice.length
  }

  return new TextDecoder('utf-8', { fatal: false }).decode(merged)
}

export const fetchUrlTool: ToolDefinition = {
  label: 'Read a page',
  summary: 'Fetch a URL and return its text',
  schema: {
    name: 'fetch_url',
    description:
      'Fetch a public web page or API endpoint and return its readable text. Use this to check a source rather than guessing at its contents. Private, loopback and metadata addresses are refused.',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Absolute http(s) URL to read' },
      },
      required: ['url'],
    },
  },
  async run(input, signal) {
    const raw = readString(input, 'url')
    if (!raw) return toolError('url is required')

    let target = raw
    const visited: string[] = []

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const check = await checkUrl(target)
      if (!check.ok || !check.url) return toolError(check.error || 'URL not allowed')

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
      const onAbort = () => controller.abort()
      signal?.addEventListener('abort', onAbort, { once: true })

      try {
        const response = await fetch(check.url, {
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            // Identify honestly and ask for text.
            'user-agent': 'TarkaSabha/1.0 (+agent research tool)',
            accept: 'text/html,application/json,text/plain;q=0.9,*/*;q=0.1',
          },
        })

        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location')
          if (!location) return toolError(`Redirect with no location (HTTP ${response.status})`)
          // Re-validate on the next iteration: a redirect must not be a way in.
          target = new URL(location, check.url).toString()
          visited.push(target)
          continue
        }

        if (!response.ok) {
          return toolError(`HTTP ${response.status} ${response.statusText}`.trim())
        }

        const contentType = (response.headers.get('content-type') || '').toLowerCase()
        if (contentType && !ALLOWED_CONTENT_TYPES.some((type) => contentType.includes(type))) {
          return toolError(`Unsupported content type: ${contentType.split(';')[0]}`)
        }

        const body = await readCapped(response)
        const text = contentType.includes('html') ? htmlToText(body) : body.trim()

        if (!text) return toolError('The page returned no readable text')

        const clipped =
          text.length > MAX_TEXT_CHARS
            ? `${text.slice(0, MAX_TEXT_CHARS)}\n\n[... truncated at ${MAX_TEXT_CHARS} characters]`
            : text

        return toolOk(`Source: ${check.url.toString()}\n\n${clipped}`)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return toolError('The request timed out or was cancelled')
        }
        return toolError(error instanceof Error ? error.message : 'Fetch failed')
      } finally {
        clearTimeout(timer)
        signal?.removeEventListener('abort', onAbort)
      }
    }

    return toolError(`Too many redirects (limit ${MAX_REDIRECTS})`)
  },
}
