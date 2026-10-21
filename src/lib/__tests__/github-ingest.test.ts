import { describe, expect, it } from 'vitest'
import {
  MAX_SOURCE_FILES,
  isIngestablePath,
  parseGitHubRepo,
  rankSourceFiles,
} from '../github-ingest'

describe('parseGitHubRepo', () => {
  it('accepts common GitHub URL and shorthand forms', () => {
    expect(parseGitHubRepo('https://github.com/acme/kestrel')).toEqual({
      owner: 'acme',
      repo: 'kestrel',
    })
    expect(parseGitHubRepo('https://github.com/acme/kestrel.git')).toEqual({
      owner: 'acme',
      repo: 'kestrel',
    })
    expect(parseGitHubRepo('github.com/acme/kestrel')).toEqual({
      owner: 'acme',
      repo: 'kestrel',
    })
    expect(parseGitHubRepo('acme/kestrel')).toEqual({ owner: 'acme', repo: 'kestrel' })
    expect(parseGitHubRepo('git@github.com:acme/kestrel.git')).toEqual({
      owner: 'acme',
      repo: 'kestrel',
    })
  })

  it('rejects other hosts and malformed values', () => {
    expect(parseGitHubRepo('https://gitlab.com/acme/kestrel')).toBeNull()
    expect(parseGitHubRepo('https://github.com/acme')).toBeNull()
    expect(parseGitHubRepo('not a url')).toBeNull()
    expect(parseGitHubRepo('')).toBeNull()
  })
})

describe('isIngestablePath', () => {
  it('accepts source, docs, and config files', () => {
    expect(isIngestablePath('README.md')).toBe(true)
    expect(isIngestablePath('docs/architecture/tenancy.md')).toBe(true)
    expect(isIngestablePath('src/auth/session.ts')).toBe(true)
    expect(isIngestablePath('prisma/schema.prisma')).toBe(true)
  })

  it('rejects dependencies, binaries, lockfiles, and secrets', () => {
    expect(isIngestablePath('node_modules/react/index.js')).toBe(false)
    expect(isIngestablePath('public/logo.png')).toBe(false)
    expect(isIngestablePath('package-lock.json')).toBe(false)
    expect(isIngestablePath('.env.local')).toBe(false)
    expect(isIngestablePath('certs/server.pem')).toBe(false)
    expect(isIngestablePath('dist/bundle.js')).toBe(false)
  })
})

describe('rankSourceFiles', () => {
  it('puts README and decision-relevant files before incidental files', () => {
    const ranked = rankSourceFiles([
      { path: 'src/utils/format.ts', size: 100 },
      { path: 'README.md', size: 100 },
      { path: 'src/auth/session.ts', size: 100 },
      { path: 'docs/tenancy.md', size: 100 },
      { path: 'node_modules/pkg/index.js', size: 100 },
    ])

    expect(ranked[0].path).toBe('README.md')
    expect(ranked.map((file) => file.path)).toContain('src/auth/session.ts')
    expect(ranked.map((file) => file.path)).not.toContain('node_modules/pkg/index.js')
  })

  it('caps the snapshot file count', () => {
    const files = Array.from({ length: MAX_SOURCE_FILES + 20 }, (_, index) => ({
      path: `src/file-${index}.ts`,
      size: 100,
    }))

    expect(rankSourceFiles(files)).toHaveLength(MAX_SOURCE_FILES)
  })
})
