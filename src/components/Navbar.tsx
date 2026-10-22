'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import { useAuth } from './AuthProvider'
import { Button } from './ui/Button'
import { cx } from './ui/cx'

const PUBLIC_LINKS = [
  { href: '/#product', label: 'Product' },
  { href: '/diligence', label: 'Diligence' },
  { href: '/about', label: 'About' },
]

const APP_LINKS = [
  { href: '/workspaces', label: 'Workspaces' },
  { href: '/history', label: 'Review rooms' },
]

const TOOL_LINKS = [
  { href: '/personas', label: 'Agents' },
  { href: '/providers', label: 'Providers' },
]

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center border border-accent-line bg-accent-soft font-display text-base text-accent transition-colors group-hover:bg-accent group-hover:text-accent-ink"
      >
        त
      </span>
      <span className="leading-none">
        <span className="block font-display text-[1.1rem] tracking-tight text-text">
          Tarka Sabha
        </span>
        {!compact && (
          <span className="mt-1.5 hidden whitespace-nowrap font-mono text-[0.58rem] uppercase tracking-[0.18em] text-subtle sm:block">
            Decision evidence
          </span>
        )}
      </span>
    </Link>
  )
}

export default function Navbar({ mode }: { mode: 'app' | 'marketing' }) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const { isAuthenticated, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    if (!isMenuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isMenuOpen])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

  const themeButton = (
    <button
      type="button"
      onClick={toggleTheme}
      className="border border-transparent px-2 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted transition-colors hover:border-line hover:text-text"
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {theme === 'dark' ? '◐ light' : '◑ dark'}
    </button>
  )

  const marketingNav = (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/95 backdrop-blur-xl print:hidden">
      <div className="mx-auto flex h-[65px] max-w-[88rem] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <Wordmark />

        <nav aria-label="Public" className="hidden items-center gap-7 lg:flex">
          {PUBLIC_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={cx(
                'border-b-2 py-1 text-sm transition-colors',
                isActive(link.href)
                  ? 'border-accent text-text'
                  : 'border-transparent text-muted hover:border-line-strong hover:text-text'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {themeButton}
          {isAuthenticated ? (
            <span className="hidden lg:block">
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                Sign out
              </Button>
            </span>
          ) : (
            <Link href="/login" className="hidden lg:block">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
          )}
          <Link href="/workspaces" className="hidden lg:block">
            <Button variant="primary" size="sm">
              Open workspace
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className="border border-line px-2.5 py-1.5 font-mono text-xs text-muted lg:hidden"
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </header>
  )

  const appRail = (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-[15.5rem] flex-col border-r border-line bg-surface lg:flex print:hidden">
      <div className="border-b border-line px-5 pb-5 pt-6">
        <Wordmark />
      </div>

      <div className="px-3 pt-4">
        <Link
          href="/workspaces#new-workspace"
          className="flex items-center gap-2 border border-accent-line bg-accent-soft px-3 py-2 text-sm text-accent transition-colors hover:bg-accent hover:text-accent-ink"
        >
          <span className="font-mono text-xs">＋</span>
          New workspace
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <p className="eyebrow px-3 pb-2">Workspace</p>
        <nav aria-label="Workspace" className="space-y-0.5">
          {APP_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={cx(
                'block border-l-2 px-3 py-2.5 text-sm transition-colors',
                isActive(link.href)
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-transparent text-muted hover:bg-surface-2 hover:text-text'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="eyebrow px-3 pb-2 pt-7">Tools</p>
        <nav aria-label="Tools" className="space-y-0.5">
          {TOOL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={cx(
                'block px-3 py-2 text-sm transition-colors',
                isActive(link.href)
                  ? 'bg-accent-soft text-accent'
                  : 'text-muted hover:bg-surface-2 hover:text-text'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="eyebrow px-3 pb-2 pt-7">Public</p>
        <Link
          href="/diligence"
          className="block px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          Sample dossier
        </Link>
      </div>

      <div className="border-t border-line p-4">
        <div className="mb-3 flex items-center gap-2 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-subtle">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Private by default
        </div>
        <div className="flex items-center justify-between gap-2">
          {themeButton}
          <button
            type="button"
            onClick={() => signOut()}
            className="px-2 py-1.5 text-xs text-muted transition-colors hover:text-text"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <>
      {mode === 'app' ? appRail : marketingNav}

      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur-xl lg:hidden print:hidden">
        <div className="flex items-center justify-between gap-3">
          <Wordmark compact />
          <div className="flex items-center gap-2">
            {themeButton}
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              className="border border-line px-2.5 py-1.5 font-mono text-xs text-muted"
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        <div
          id="mobile-nav"
          hidden={!isMenuOpen}
          className="min-h-[calc(100dvh-57px)] max-h-[calc(100dvh-57px)] overflow-y-auto border-t border-line bg-bg py-3"
        >
          <p className="eyebrow px-3 pb-2">Public</p>
          <div className="space-y-0.5">
            {PUBLIC_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={cx(
                  'block border-l-2 px-3 py-2.5 text-sm transition-colors',
                  isActive(link.href)
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-transparent text-muted hover:bg-surface-2 hover:text-text'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {isAuthenticated && (
            <>
              <p className="eyebrow px-3 pb-2 pt-6">Workspace</p>
              <div className="space-y-0.5">
                {[...APP_LINKS, ...TOOL_LINKS].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    aria-current={isActive(link.href) ? 'page' : undefined}
                    className={cx(
                      'block border-l-2 px-3 py-2.5 text-sm transition-colors',
                      isActive(link.href)
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-transparent text-muted hover:bg-surface-2 hover:text-text'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </>
          )}

          <div className="mt-4 border-t border-line pt-3">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false)
                  signOut()
                }}
                className="block w-full px-3 py-2.5 text-left text-sm text-danger transition-colors hover:bg-danger-soft"
              >
                Sign out
              </button>
            ) : (
              <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block">
                <Button variant="primary" className="w-full">
                  Sign in
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
