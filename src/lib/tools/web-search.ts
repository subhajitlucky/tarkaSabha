import { ToolDefinition, readNumber, readString, toolError, toolOk } from './types'

const SEARCH_TIMEOUT_MS = 12_000
const DEFAULT_RESULTS = 5
const MAX_RESULTS = 10
const MAX_SNIPPET_CHARS = 400

export interface SearchHit {
  title: string
  url: string
  snippet: string
}

/** Which backend will be used, for diagnostics and the UI. */
export function searchBackend(): 'tavily' | 'brave' | 'duckduckgo' {
  if (process.env.TAVILY_API_KEY) return 'tavily'
  if (process.env.BRAVE_API_KEY) return 'brave'
  return 'duckduckgo'
}

function clampResults(value: number | null): number {
  if (value === null) return DEFAULT_RESULTS
  return Math.min(MAX_RESULTS, Math.max(1, Math.trunc(value)))
}

function clip(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > MAX_SNIPPET_CHARS ? `${clean.slice(0, MAX_SNIPPET_CHARS)}…` : clean
}

async function withTimeout<T>(run: (signal: AbortSignal) => Promise<T>, signal?: AbortSignal) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS)
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort, { once: true })
  try {
    return await run(controller.signal)
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

async function searchTavily(query: string, limit: number, signal?: AbortSignal): Promise<SearchHit[]> {
  return withTimeout(async (innerSignal) => {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      signal: innerSignal,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({ query, max_results: limit, search_depth: 'basic' }),
    })
    if (!response.ok) throw new Error(`Tavily returned HTTP ${response.status}`)
    const data = (await response.json()) as {
      results?: Array<{ title?: string; url?: string; content?: string }>
    }
    return (data.results ?? []).slice(0, limit).map((hit) => ({
      title: hit.title || hit.url || 'Untitled',
      url: hit.url || '',
      snippet: clip(hit.content || ''),
    }))
  }, signal)
}

async function searchBrave(query: string, limit: number, signal?: AbortSignal): Promise<SearchHit[]> {
  return withTimeout(async (innerSignal) => {
    const url = new URL('https://api.search.brave.com/res/v1/web/search')
    url.searchParams.set('q', query)
    url.searchParams.set('count', String(limit))

    const response = await fetch(url, {
      signal: innerSignal,
      headers: {
        accept: 'application/json',
        'x-subscription-token': process.env.BRAVE_API_KEY as string,
      },
    })
    if (!response.ok) throw new Error(`Brave returned HTTP ${response.status}`)
    const data = (await response.json()) as {
      web?: { results?: Array<{ title?: string; url?: string; description?: string }> }
    }
    return (data.web?.results ?? []).slice(0, limit).map((hit) => ({
      title: hit.title || hit.url || 'Untitled',
      url: hit.url || '',
      snippet: clip(hit.description || ''),
    }))
  }, signal)
}

/**
 * Keyless fallback.
 *
 * Best effort: it reads the no-JS HTML endpoint. It can be rate limited or
 * change shape, so a keyed backend is preferred wherever one is available.
 */
async function searchDuckDuckGo(query: string, limit: number, signal?: AbortSignal): Promise<SearchHit[]> {
  return withTimeout(async (innerSignal) => {
    const response = await fetch('https://html.duckduckgo.com/html/', {
      method: 'POST',
      signal: innerSignal,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'user-agent': 'Mozilla/5.0 (compatible; TarkaSabha/1.0; +agent research tool)',
      },
      body: new URLSearchParams({ q: query }).toString(),
    })
    if (!response.ok) throw new Error(`DuckDuckGo returned HTTP ${response.status}`)

    const html = await response.text()
    const linkPattern = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
    const snippetPattern = /class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi

    const snippets: string[] = []
    for (const match of html.matchAll(snippetPattern)) {
      snippets.push(clip(match[1].replace(/<[^>]+>/g, '')))
    }

    const hits: SearchHit[] = []
    let index = 0
    for (const match of html.matchAll(linkPattern)) {
      if (hits.length >= limit) break
      let href = match[1]
      // DDG wraps results in a redirect; unwrap where possible.
      const wrapped = href.match(/[?&]uddg=([^&]+)/)
      if (wrapped) href = decodeURIComponent(wrapped[1])

      hits.push({
        title: clip(match[2].replace(/<[^>]+>/g, '')) || href,
        url: href,
        snippet: snippets[index] || '',
      })
      index++
    }

    return hits
  }, signal)
}

export function formatHits(query: string, hits: SearchHit[], backend: string): string {
  if (hits.length === 0) {
    return `No results found for "${query}" (via ${backend}).`
  }

  const lines = hits.map(
    (hit, index) => `${index + 1}. ${hit.title}\n   ${hit.url}\n   ${hit.snippet}`
  )

  return `Search results for "${query}" (via ${backend}):\n\n${lines.join('\n\n')}`
}

export const webSearchTool: ToolDefinition = {
  label: 'Web search',
  summary: 'Search the web for sources',
  schema: {
    name: 'web_search',
    description:
      'Search the web and return a list of results with titles, URLs and snippets. Use this to ground a claim in a real source, then read the most promising result with fetch_url.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query' },
        results: {
          type: 'number',
          description: `How many results to return (1-${MAX_RESULTS}, default ${DEFAULT_RESULTS})`,
        },
      },
      required: ['query'],
    },
  },
  async run(input, signal) {
    const query = readString(input, 'query')
    if (!query) return toolError('query is required')

    const limit = clampResults(readNumber(input, 'results'))
    const backend = searchBackend()

    try {
      const hits =
        backend === 'tavily'
          ? await searchTavily(query, limit, signal)
          : backend === 'brave'
            ? await searchBrave(query, limit, signal)
            : await searchDuckDuckGo(query, limit, signal)

      return toolOk(formatHits(query, hits, backend))
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return toolError('The search timed out or was cancelled')
      }
      return toolError(error instanceof Error ? error.message : 'Search failed')
    }
  },
}
