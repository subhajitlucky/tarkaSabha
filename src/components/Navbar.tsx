'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import { useAuth } from './AuthProvider'
import { Avatar } from './ui/Avatar'
import { Button } from './ui/Button'
import { cx } from './ui/cx'

const PUBLIC_LINKS = [
  { href: '/product', label: 'Product' },
  { href: '/diligence', label: 'Diligence' },
  { href: '/teams', label: 'For teams' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
]

const APP_LINKS = [
  { href: '/workspaces', label: 'Workspaces', icon: 'workspaces' as const },
  { href: '/history', label: 'Review rooms', icon: 'history' as const },
]

const TOOL_LINKS = [
  { href: '/personas', label: 'Agents', icon: 'agents' as const },
  { href: '/providers', label: 'Providers', icon: 'providers' as const },
]

function NavIcon({ name }: { name: 'workspaces' | 'history' | 'agents' | 'providers' | 'sample' }) {
  if (name === 'workspaces') {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    )
  }
  if (name === 'history') {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
        <path d="M8 9h8M8 13h5" />
      </svg>
    )
  }
  if (name === 'agents') {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M18 20a6 6 0 0 0-2-4.5" />
      </svg>
    )
  }
  if (name === 'providers') {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 9h4M7 13h2M15 12h2v3h-2z" />
      </svg>
    )
  }
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h6" />
    </svg>
  )
}

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center border border-accent bg-accent font-display text-base text-accent-ink shadow-sm transition-colors group-hover:border-accent-hover group-hover:bg-accent-hover"
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
  const { isAuthenticated, signOut, user } = useAuth()
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

        <nav aria-label="Public" className="hidden items-center gap-5 lg:flex xl:gap-7">
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
          className="flex items-center gap-2 border border-line-strong bg-surface px-3 py-2 text-sm font-semibold text-text transition-colors hover:border-accent hover:text-accent"
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
                'flex items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-sm transition-colors',
                isActive(link.href)
                  ? 'bg-nav-active font-semibold text-nav-active-text'
                  : 'text-muted hover:bg-surface-2 hover:text-text'
              )}
            >
              <NavIcon name={link.icon} />
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
                'flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-sm transition-colors',
                isActive(link.href)
                  ? 'bg-nav-active font-semibold text-nav-active-text'
                  : 'text-muted hover:bg-surface-2 hover:text-text'
              )}
            >
              <NavIcon name={link.icon} />
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="eyebrow px-3 pb-2 pt-7">Public</p>
        <Link
          href="/diligence"
          className="flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          <NavIcon name="sample" />
          Sample dossier
        </Link>
      </div>

      <div className="border-t border-line p-4">
        <div className="mb-3 flex items-center gap-3 rounded-[6px] border border-line bg-surface-2/60 px-2.5 py-2">
          <Avatar name={user?.name || user?.email || 'Account'} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-text">
              {user?.name || 'Signed in'}
            </p>
            <p className="truncate font-mono text-[0.58rem] text-subtle">
              {user?.email || 'Workspace member'}
            </p>
          </div>
        </div>
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
                    ? 'border-accent bg-surface-2 font-semibold text-text'
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
                      'flex items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-sm transition-colors',
                      isActive(link.href)
                        ? 'bg-nav-active font-semibold text-nav-active-text'
                        : 'text-muted hover:bg-surface-2 hover:text-text'
                    )}
                  >
                    <NavIcon name={link.icon} />
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
