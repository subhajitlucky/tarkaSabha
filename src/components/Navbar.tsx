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
  { href: '/diligence', label: 'Diligence' },
  { href: '/history', label: 'Review rooms' },
  { href: '/demo', label: 'Sample' },
  { href: '/debate', label: 'New review' },
]

const TOOL_LINKS = [
  { href: '/personas', label: 'Agents' },
  { href: '/providers', label: 'Providers' },
  { href: '/feedback', label: 'Feedback' },
]

function Wordmark() {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center border border-accent-line bg-accent-soft font-display text-base text-accent transition-colors group-hover:bg-accent group-hover:text-accent-ink"
      >
        त
      </span>
      <span className="leading-none">
        <span className="block font-display text-[1.1rem] tracking-tight text-text">
          Tarka Sabha
        </span>
        <span className="mt-1 hidden whitespace-nowrap font-mono text-[0.58rem] uppercase tracking-[0.18em] text-subtle sm:block">
          Decision evidence
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

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/95 backdrop-blur-xl print:hidden">
      <div className="mx-auto flex h-[65px] max-w-6xl items-center justify-between gap-4 px-5">
        <Wordmark />

        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
          {PRIMARY_LINKS.map((link) => (
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

          <details key={pathname} className="group relative">
            <summary className="cursor-pointer list-none border-b-2 border-transparent py-1 text-sm text-muted no-underline transition-colors hover:text-text">
              Tools
            </summary>
            <div className="absolute right-0 top-8 z-50 min-w-36 border border-line bg-surface p-1.5 shadow-lift">
              {TOOL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </details>
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
            className="border border-line px-2.5 py-1.5 font-mono text-xs text-muted lg:hidden"
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        hidden={!isMenuOpen}
        className="min-h-[calc(100dvh-65px)] max-h-[calc(100dvh-65px)] overflow-y-auto border-t border-line bg-bg px-3 py-3 lg:hidden"
      >
        <div className="space-y-0.5">
          {PRIMARY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={cx(
                'block border-l-2 px-3 py-2.5 text-sm transition-colors',
                isActive(link.href)
                  ? 'border-accent bg-surface-2 text-text'
                  : 'border-transparent text-muted hover:bg-surface-2 hover:text-text'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <p className="eyebrow px-3 pb-2 pt-5">Tools</p>
        <div className="space-y-0.5">
          {TOOL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="block px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text"
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
  )
}
