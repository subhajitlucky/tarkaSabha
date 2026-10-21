import { createHash } from 'node:crypto'
import type { Prisma } from '@/generated/prisma/client'

export const MAX_SOURCE_FILES = 30
export const MAX_FILE_BYTES = 80_000
export const MAX_TOTAL_BYTES = 1_500_000
export const MAX_EVENT_BYTES = 20_000

const EXCLUDED_DIRS = new Set([
  'node_modules',
  'vendor',
  'dist',
  'build',
  '.next',
  'coverage',
  '.git',
  '.github',
  'generated',
  '__snapshots__',
  'fixtures',
])

const INCLUDED_EXTENSIONS = new Set([
  '.md',
  '.mdx',
  '.rst',
  '.txt',
  '.adoc',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.py',
  '.go',
  '.rs',
  '.java',
  '.kt',
  '.kts',
  '.rb',
  '.php',
  '.cs',
  '.swift',
  '.scala',
  '.sql',
  '.prisma',
  '.yml',
  '.yaml',
  '.toml',
  '.json',
  '.graphql',
  '.proto',
  '.html',
  '.css',
  '.scss',
  '.less',
  '.vue',
  '.svelte',
])

const EXCLUDED_FILE_PATTERNS = [
  /(^|\/)package-lock\.json$/i,
  /(^|\/)pnpm-lock\.yaml$/i,
  /(^|\/)yarn\.lock$/i,
  /(^|\/)bun\.lockb$/i,
  /(^|\/)composer\.lock$/i,
  /(^|\/)gemfile\.lock$/i,
  /\.min\.(js|css)$/i,
  /\.map$/i,
  /\.(png|jpe?g|gif|webp|svg|ico|pdf|zip|tar|gz|woff2?|ttf|otf|mp4|mov|mp3|wav|wasm)$/i,
  /(^|\/)\.env(\.|$)/i,
  /\.(pem|key|p12|pfx)$/i,
]

const DECISION_KEYWORDS = [
  'auth',
  'permission',
  'tenant',
  'role',
  'session',
  'security',
  'billing',
  'payment',
  'money',
  'idempot',
  'ledger',
  'database',
  'schema',
  'migration',
  'contract',
]

export interface GitHubRepoRef {
  owner: string
  repo: string
}

export interface GitHubTreeFile {
  path: string
  size?: number
  sha?: string
}

export interface SourceSnapshotInput {
  kind: 'FILE' | 'COMMIT' | 'PULL_REQUEST' | 'ISSUE'
  path: string
  title?: string | null
  content?: string | null
  url: string
  sha?: string | null
  sha256?: string | null
  size?: number | null
  metadata?: Prisma.InputJsonValue | null
}

export interface IngestResult {
  repoUrl: string
  owner: string
  name: string
  ref: string
  commitSha: string
  defaultBranch: string
  snapshots: SourceSnapshotInput[]
  counts: {
    files: number
    commits: number
    pullRequests: number
    issues: number
  }
}

interface GitHubRepoResponse {
  name: string
  default_branch: string
  html_url: string
}

interface GitHubBranchResponse {
  commit: { sha: string }
}

interface GitHubCommitResponse {
  sha: string
}

interface GitHubTreeResponse {
  tree: Array<{
    path: string
    type: string
    size?: number
    sha?: string
  }>
}

interface GitHubCommitListItem {
  sha: string
  html_url: string
  commit: {
    message: string
    author?: { name?: string; date?: string }
    verification?: { verified?: boolean }
  }
}

interface GitHubPullRequest {
  number: number
  title: string
  body?: string | null
  html_url: string
  state: string
  created_at: string
  updated_at: string
  merged_at?: string | null
  user?: { login?: string }
  head?: { sha?: string }
  base?: { ref?: string }
}

interface GitHubIssue {
  number: number
  title: string
  body?: string | null
  html_url: string
  state: string
  created_at: string
  updated_at: string
  pull_request?: unknown
  user?: { login?: string }
}

function cleanSlug(value: string): string {
  return value.trim().replace(/\.git$/i, '')
}

export function parseGitHubRepo(input: string): GitHubRepoRef | null {
  const raw = input.trim()
  if (!raw || raw.length > 300) return null

  const ssh = /^git@github\.com:([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/i.exec(raw)
  if (ssh) {
    return { owner: ssh[1], repo: cleanSlug(ssh[2]) }
  }

  let pathname = raw
  try {
    const url = new URL(raw)
    if (!/^(www\.)?github\.com$/i.test(url.hostname)) return null
    pathname = url.pathname
  } catch {
    pathname = raw.replace(/^(www\.)?github\.com\//i, '')
  }

  const parts = pathname.replace(/^\/+/, '').split('/').filter(Boolean)
  if (parts.length < 2) return null

  const owner = parts[0]
  const repo = cleanSlug(parts[1])
  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) {
    return null
  }
  if (owner === '.' || owner === '..' || repo === '.' || repo === '..') return null

  return { owner, repo }
}

export function isIngestablePath(path: string): boolean {
  const lower = path.toLowerCase()
  const segments = lower.split('/')
  if (segments.some((segment) => EXCLUDED_DIRS.has(segment))) return false
  if (EXCLUDED_FILE_PATTERNS.some((pattern) => pattern.test(path))) return false

  const basename = lower.split('/').pop()
  if (basename === 'readme') return true

  const dot = lower.lastIndexOf('.')
  if (dot < 0) return false
  return INCLUDED_EXTENSIONS.has(lower.slice(dot))
}

function scoreFile(path: string): number {
  const lower = path.toLowerCase()
  let score = 0

  if (/(^|\/)readme(\.|$)/.test(lower)) score += 100
  if (lower.startsWith('docs/') || lower.includes('/docs/')) score += 40
  if (/\.(md|mdx|rst|txt|adoc)$/.test(lower)) score += 20
  if (DECISION_KEYWORDS.some((keyword) => lower.includes(keyword))) score += 35

  const depth = lower.split('/').length
  score -= depth * 2
  return score
}

export function rankSourceFiles(files: GitHubTreeFile[]): GitHubTreeFile[] {
  return files
    .filter((file) => isIngestablePath(file.path))
    .filter((file) => (file.size ?? 0) <= MAX_FILE_BYTES)
    .sort((a, b) => scoreFile(b.path) - scoreFile(a.path) || a.path.localeCompare(b.path))
    .slice(0, MAX_SOURCE_FILES)
}

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'tarka-sabha',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  return headers
}

async function githubJson<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: githubHeaders(),
    signal: AbortSignal.timeout(20_000),
  })

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Repository, branch, or path not found on GitHub.')
    }
    if (res.status === 403 || res.status === 429) {
      throw new Error('GitHub API rate limit reached. Try again later or configure GITHUB_TOKEN.')
    }
    throw new Error(`GitHub API returned ${res.status}.`)
  }

  return (await res.json()) as T
}

async function safeGithubJson<T>(path: string, fallback: T): Promise<T> {
  try {
    return await githubJson<T>(path)
  } catch {
    return fallback
  }
}

function encodedPath(path: string): string {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

function hashContent(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex')
}

async function fetchRawFile(
  owner: string,
  repo: string,
  commitSha: string,
  file: GitHubTreeFile
): Promise<SourceSnapshotInput | null> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${commitSha}/${encodedPath(file.path)}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'tarka-sabha' },
    signal: AbortSignal.timeout(20_000),
  })

  if (!res.ok) return null

  const contentLength = Number(res.headers.get('content-length') || 0)
  if (contentLength > MAX_FILE_BYTES) return null

  const contentType = (res.headers.get('content-type') || '').toLowerCase()
  if (contentType && !contentType.startsWith('text/') && !contentType.includes('json')) {
    return null
  }

  const content = await res.text()
  const size = Buffer.byteLength(content, 'utf8')
  if (size > MAX_FILE_BYTES) return null

  return {
    kind: 'FILE',
    path: file.path,
    title: file.path.split('/').pop() || file.path,
    content,
    url: `https://github.com/${owner}/${repo}/blob/${commitSha}/${file.path}`,
    sha: file.sha ?? null,
    sha256: hashContent(content),
    size,
  }
}

export async function ingestGitHubRepo({
  owner,
  repo,
  ref,
}: GitHubRepoRef & { ref?: string }): Promise<IngestResult> {
  const repoInfo = await githubJson<GitHubRepoResponse>(`/repos/${owner}/${repo}`)
  const requestedRef = ref?.trim() || repoInfo.default_branch

  let commitSha: string
  try {
    const branch = await githubJson<GitHubBranchResponse>(
      `/repos/${owner}/${repo}/branches/${encodeURIComponent(requestedRef)}`
    )
    commitSha = branch.commit.sha
  } catch {
    const commit = await githubJson<GitHubCommitResponse>(
      `/repos/${owner}/${repo}/commits/${encodeURIComponent(requestedRef)}`
    )
    commitSha = commit.sha
  }

  const tree = await githubJson<GitHubTreeResponse>(
    `/repos/${owner}/${repo}/git/trees/${commitSha}?recursive=1`
  )

  const candidates = rankSourceFiles(
    tree.tree
      .filter((entry) => entry.type === 'blob')
      .map((entry) => ({ path: entry.path, size: entry.size, sha: entry.sha }))
  )

  const snapshots: SourceSnapshotInput[] = []
  let totalBytes = 0

  for (const file of candidates) {
    if (totalBytes >= MAX_TOTAL_BYTES) break
    try {
      const snapshot = await fetchRawFile(owner, repo, commitSha, file)
      if (!snapshot) continue
      const size = snapshot.size ?? 0
      if (totalBytes + size > MAX_TOTAL_BYTES) continue
      snapshots.push(snapshot)
      totalBytes += size
    } catch {
      // A single unreadable file should not fail the whole source run.
    }
  }

  const commits = await safeGithubJson<GitHubCommitListItem[]>(
    `/repos/${owner}/${repo}/commits?sha=${commitSha}&per_page=10`,
    []
  )

  const commitSnapshots: SourceSnapshotInput[] = commits.map((commit) => {
    const message = commit.commit.message.split('\n')[0]?.slice(0, 200) || commit.sha.slice(0, 12)
    return {
      kind: 'COMMIT',
      path: commit.sha,
      title: message,
      content: commit.commit.message.slice(0, MAX_EVENT_BYTES),
      url: commit.html_url,
      sha: commit.sha,
      metadata: {
        author: commit.commit.author?.name ?? null,
        date: commit.commit.author?.date ?? null,
        verified: commit.commit.verification?.verified ?? false,
      },
    }
  })

  const pullRequests = await safeGithubJson<GitHubPullRequest[]>(
    `/repos/${owner}/${repo}/pulls?state=all&sort=updated&direction=desc&per_page=5`,
    []
  )

  const pullRequestSnapshots: SourceSnapshotInput[] = pullRequests.map((pull) => ({
    kind: 'PULL_REQUEST',
    path: `#${pull.number}`,
    title: pull.title,
    content: (pull.body ?? '').slice(0, MAX_EVENT_BYTES),
    url: pull.html_url,
    sha: pull.head?.sha ?? null,
    metadata: {
      number: pull.number,
      state: pull.state,
      author: pull.user?.login ?? null,
      createdAt: pull.created_at,
      updatedAt: pull.updated_at,
      mergedAt: pull.merged_at ?? null,
      base: pull.base?.ref ?? null,
    },
  }))

  const issues = await safeGithubJson<GitHubIssue[]>(
    `/repos/${owner}/${repo}/issues?state=all&sort=updated&direction=desc&per_page=10`,
    []
  )

  const issueSnapshots: SourceSnapshotInput[] = issues
    .filter((issue) => !issue.pull_request)
    .slice(0, 5)
    .map((issue) => ({
      kind: 'ISSUE',
      path: `#${issue.number}`,
      title: issue.title,
      content: (issue.body ?? '').slice(0, MAX_EVENT_BYTES),
      url: issue.html_url,
      metadata: {
        number: issue.number,
        state: issue.state,
        author: issue.user?.login ?? null,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
      },
    }))

  const allSnapshots = [
    ...snapshots,
    ...commitSnapshots,
    ...pullRequestSnapshots,
    ...issueSnapshots,
  ]

  return {
    repoUrl: repoInfo.html_url,
    owner,
    name: repoInfo.name,
    ref: requestedRef,
    commitSha,
    defaultBranch: repoInfo.default_branch,
    snapshots: allSnapshots,
    counts: {
      files: snapshots.length,
      commits: commitSnapshots.length,
      pullRequests: pullRequestSnapshots.length,
      issues: issueSnapshots.length,
    },
  }
}
