'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import { useAuth } from './AuthProvider'
import { Button } from './ui/Button'
import { cx } from './ui/cx'

const PRIMARY_LINKS = [
  { href: '/workspaces', label: 'Workspaces', meta: 'Decision rooms' },
  { href: '/diligence', label: 'Diligence', meta: 'Sample dossier' },
  { href: '/history', label: 'Review rooms', meta: 'Past councils' },
  { href: '/demo', label: 'Sample', meta: 'Public demo' },
  { href: '/debate', label: 'New review', meta: 'Convene' },
]

const SYSTEM_LINKS = [
  { href: '/personas', label: 'Agents' },
  { href: '/providers', label: 'Providers' },
  { href: '/feedback', label: 'Feedback' },
]

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[2px] border border-accent-line bg-accent-soft font-display text-base text-accent transition-colors group-hover:bg-accent group-hover:text-accent-ink"
      >
        त
      </span>
      <span className="leading-none">
        <span className="block font-display text-[1.1rem] tracking-tight text-text">
          Tarka Sabha
        </span>
        {!compact && (
          <span className="mt-1.5 block whitespace-nowrap font-mono text-[0.6rem] uppercase tracking-[0.18em] text-subtle">
            Decision evidence
          </span>
        )}
      </span>
    </Link>
  )
}

function NavLink({
  href,
  label,
  meta,
  active,
  onClick,
}: {
  href: string
  label: string
  meta?: string
  active: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cx(
        'group relative flex items-center gap-3 rounded-[2px] border-l-2 px-3 py-2.5 text-sm transition-colors',
        active
          ? 'border-accent bg-surface-2 text-text'
          : 'border-transparent text-muted hover:border-line-strong hover:bg-surface-2/60 hover:text-text'
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'h-1.5 w-1.5 shrink-0',
          active ? 'bg-accent' : 'bg-line-strong group-hover:bg-accent-line'
        )}
      />
      <span className="min-w-0">
        <span className="block truncate">{label}</span>
        {meta && (
          <span className="mt-0.5 block font-mono text-[0.6rem] uppercase tracking-[0.1em] text-subtle">
            {meta}
          </span>
        )}
      </span>
    </Link>
  )
}

export default function Navbar() {
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
      className="rounded-[2px] border border-transparent px-2 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted transition-colors hover:border-line hover:text-text"
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {theme === 'dark' ? '◐ light' : '◑ dark'}
    </button>
  )

  return (
    <>
      {/* Desktop command rail */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[15.5rem] flex-col border-r border-line bg-bg/95 backdrop-blur-xl lg:flex print:hidden">
        <div className="border-b border-line px-5 pb-5 pt-6">
          <Wordmark />
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="eyebrow px-3 pb-2">Workspace</p>
          <nav aria-label="Workspace" className="space-y-1">
            {PRIMARY_LINKS.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                meta={link.meta}
                active={isActive(link.href)}
              />
            ))}
          </nav>

          <p className="eyebrow px-3 pb-2 pt-7">System</p>
          <nav aria-label="System" className="space-y-0.5">
            {SYSTEM_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={cx(
                  'block rounded-[2px] px-3 py-2 text-sm transition-colors',
                  isActive(link.href)
                    ? 'bg-surface-2 text-text'
                    : 'text-muted hover:bg-surface-2/60 hover:text-text'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-line p-4">
          <div className="mb-3 flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-subtle">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--accent-glow)]" />
            Private by default
          </div>
          <div className="flex items-center justify-between gap-2">
            {themeButton}
            {isAuthenticated ? (
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                Sign out
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="primary" size="sm">
                  Sign in
                </Button>
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/90 backdrop-blur-xl lg:hidden print:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Wordmark compact />
          <div className="flex items-center gap-2">
            {themeButton}
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              className="rounded-[2px] border border-line px-2.5 py-1.5 font-mono text-xs text-muted"
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        <div
          id="mobile-nav"
          hidden={!isMenuOpen}
          className="border-t border-line bg-surface px-3 py-3"
        >
          <p className="eyebrow px-2 pb-2">Workspace</p>
          <div className="space-y-0.5">
            {PRIMARY_LINKS.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                meta={link.meta}
                active={isActive(link.href)}
                onClick={() => setIsMenuOpen(false)}
              />
            ))}
          </div>
          <p className="eyebrow px-2 pb-2 pt-5">System</p>
          <div className="space-y-0.5">
            {SYSTEM_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={cx(
                  'block rounded-[2px] px-3 py-2.5 text-sm transition-colors',
                  isActive(link.href)
                    ? 'bg-surface-2 text-text'
                    : 'text-muted hover:bg-surface-2 hover:text-text'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-4 border-t border-line pt-3">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false)
                  signOut()
                }}
                className="block w-full rounded-[2px] px-3 py-2.5 text-left text-sm text-danger transition-colors hover:bg-danger-soft"
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
      </nav>
    </>
  )
}
