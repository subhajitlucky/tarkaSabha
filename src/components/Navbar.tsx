'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import { useAuth } from './AuthProvider'
import { Button } from './ui/Button'
import { cx } from './ui/cx'

const PRIMARY_LINKS = [
  { href: '/workspaces', label: 'Workspaces' },
  { href: '/history', label: 'Review rooms' },
  { href: '/demo', label: 'Sample' },
  { href: '/debate', label: 'New review' },
]

const MENU_LINKS = [
  ...PRIMARY_LINKS,
  { href: '/personas', label: 'Agents' },
  { href: '/providers', label: 'Providers' },
  { href: '/about', label: 'About' },
  { href: '/feedback', label: 'Feedback' },
]

function Wordmark() {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center rounded-[3px] border border-accent-line bg-accent-soft font-display text-sm text-accent transition-colors group-hover:bg-accent group-hover:text-accent-ink"
      >
        त
      </span>
      <span className="leading-none">
        <span className="block font-display text-[1.0625rem] tracking-tight text-text">
          Tarka Sabha
        </span>
        <span className="mt-1 block whitespace-nowrap font-mono text-xs uppercase tracking-[0.12em] text-subtle">
          Brahmodya Protocol
        </span>
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
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/65 print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-2.5">
        <Wordmark />

        <div className="hidden items-center gap-0.5 lg:flex">
          {PRIMARY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={cx(
                'rounded-[3px] px-3 py-2 text-sm transition-colors',
                isActive(link.href)
                  ? 'bg-surface-2 text-text'
                  : 'text-muted hover:bg-surface-2 hover:text-text'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="rounded-[3px] border border-transparent px-2 py-1.5 font-mono text-xs text-muted transition-colors hover:border-line hover:text-text"
          >
            {theme === 'dark' ? '◐ light' : '◑ dark'}
          </button>

          {isAuthenticated ? (
            <div className="hidden items-center gap-2 lg:flex">
              <Link
                href="/dashboard"
                className="rounded-[3px] px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text"
              >
                Dashboard
              </Link>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                Sign out
              </Button>
            </div>
          ) : (
            <Link href="/login" className="hidden lg:block">
              <Button variant="primary" size="sm">
                Sign in
              </Button>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className="rounded-[3px] border border-line px-2.5 py-1.5 font-mono text-xs text-muted lg:hidden"
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        hidden={!isMenuOpen}
        className="border-t border-line bg-surface lg:hidden"
      >
        <div className="mx-auto max-w-6xl space-y-0.5 px-4 py-3">
          {MENU_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={cx(
                'block rounded-[3px] px-3 py-2.5 text-sm transition-colors',
                isActive(link.href)
                  ? 'bg-surface-2 text-text'
                  : 'text-muted hover:bg-surface-2 hover:text-text'
              )}
            >
              {link.label}
            </Link>
          ))}

          <div className="!mt-3 border-t border-line pt-3">
            {isAuthenticated ? (
              <div className="space-y-0.5">
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-[3px] px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false)
                    signOut()
                  }}
                  className="block w-full rounded-[3px] px-3 py-2.5 text-left text-sm text-danger transition-colors hover:bg-danger-soft"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block">
                <Button variant="primary" className="w-full">
                  Sign in
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
