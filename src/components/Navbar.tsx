'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import { useAuth } from './AuthProvider'
import { Button } from './ui/Button'
import { cx } from './ui/cx'

const PRODUCT_LINKS = [
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

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#2c5747] bg-[#0f3529] font-display text-base text-[#89e6bb] transition-colors group-hover:border-[#52a781] group-hover:bg-[#164a38]"
      >
        त
      </span>
      <span className="leading-none">
        <span className="block font-display text-[1.1rem] tracking-tight text-white">
          Tarka Sabha
        </span>
        {!compact && (
          <span className="mt-1.5 hidden whitespace-nowrap font-mono text-[0.58rem] uppercase tracking-[0.18em] text-[#7f9a8c] sm:block">
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
      className="border border-transparent px-2 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-[#8fa89b] transition-colors hover:border-white/15 hover:text-white"
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {theme === 'dark' ? '◐ light' : '◑ dark'}
    </button>
  )

  const marketingNav = (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#080d0b]/95 text-white backdrop-blur-xl print:hidden">
      <div className="mx-auto flex h-[65px] max-w-6xl items-center justify-between gap-4 px-5">
        <Wordmark />

        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
          {PRODUCT_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={cx(
                'border-b-2 py-1 text-sm transition-colors',
                isActive(link.href)
                  ? 'border-[#89e6bb] text-white'
                  : 'border-transparent text-[#a2b8ac] hover:border-white/20 hover:text-white'
              )}
            >
              {link.label}
            </Link>
          ))}
          <details key={pathname} className="group relative">
            <summary className="cursor-pointer list-none border-b-2 border-transparent py-1 text-sm text-[#a2b8ac] no-underline transition-colors hover:text-white">
              Tools
            </summary>
            <div className="absolute right-0 top-8 z-50 min-w-36 border border-white/10 bg-[#0d1712] p-1.5 shadow-lift">
              {TOOL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 text-sm text-[#a2b8ac] transition-colors hover:bg-[#15251d] hover:text-white"
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
              <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-[#a2b8ac] hover:bg-white/10 hover:text-white">
                Sign out
              </Button>
            </span>
          ) : (
            <Link href="/login" className="hidden lg:block">
              <Button variant="ghost" size="sm" className="text-[#a2b8ac] hover:bg-white/10 hover:text-white">
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
            className="border border-white/15 px-2.5 py-1.5 font-mono text-xs text-[#a2b8ac] lg:hidden"
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </header>
  )

  const appRail = (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-[15.5rem] flex-col border-r border-[#1d3027] bg-[#0a120e] text-white lg:flex print:hidden">
      <div className="border-b border-[#1d3027] px-5 pb-5 pt-6">
        <Wordmark />
      </div>

      <div className="px-3 pt-4">
        <Link
          href="/workspaces#new-workspace"
          className="flex items-center gap-2 border border-[#2c5747] bg-[#0f3529] px-3 py-2 text-sm text-[#b9f2d6] transition-colors hover:border-[#52a781] hover:bg-[#164a38]"
        >
          <span className="font-mono text-xs">＋</span>
          New workspace
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <p className="eyebrow px-3 pb-2 text-[#61796d]">Workspace</p>
        <nav aria-label="Workspace" className="space-y-0.5">
          {PRODUCT_LINKS.slice(0, 3).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={cx(
                'block border-l-2 px-3 py-2.5 text-sm transition-colors',
                isActive(link.href)
                  ? 'border-[#5fbf91] bg-[#123d2e] text-[#d8f3e6]'
                  : 'border-transparent text-[#9fb7ab] hover:bg-[#10241c] hover:text-white'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="eyebrow px-3 pb-2 pt-7 text-[#61796d]">System</p>
        <nav aria-label="System" className="space-y-0.5">
          {TOOL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={cx(
                'block px-3 py-2 text-sm transition-colors',
                isActive(link.href)
                  ? 'bg-[#123d2e] text-[#d8f3e6]'
                  : 'text-[#9fb7ab] hover:bg-[#10241c] hover:text-white'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-[#1d3027] p-4">
        <div className="mb-3 flex items-center gap-2 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-[#61796d]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5fbf91] shadow-[0_0_10px_rgba(95,191,145,.45)]" />
          Private by default
        </div>
        <div className="flex items-center justify-between gap-2">
          {themeButton}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => signOut()}
              className="px-2 py-1.5 text-xs text-[#9fb7ab] transition-colors hover:text-white"
            >
              Sign out
            </button>
          ) : (
            <Link href="/login" className="text-xs text-[#89e6bb] hover:text-white">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </aside>
  )

  return (
    <>
      {mode === 'app' ? appRail : marketingNav}

      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#1d3027] bg-[#0a120e] px-4 py-3 text-white lg:hidden print:hidden">
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
              className="border border-white/15 px-2.5 py-1.5 font-mono text-xs text-[#a2b8ac]"
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        <div
          id="mobile-nav"
          hidden={!isMenuOpen}
          className="min-h-[calc(100dvh-57px)] max-h-[calc(100dvh-57px)] overflow-y-auto border-t border-[#1d3027] bg-[#0a120e] py-3"
        >
          <p className="eyebrow px-3 pb-2 text-[#61796d]">Workspace</p>
          <div className="space-y-0.5">
            {PRODUCT_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={cx(
                  'block border-l-2 px-3 py-2.5 text-sm transition-colors',
                  isActive(link.href)
                    ? 'border-[#5fbf91] bg-[#123d2e] text-[#d8f3e6]'
                    : 'border-transparent text-[#9fb7ab] hover:bg-[#10241c] hover:text-white'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <p className="eyebrow px-3 pb-2 pt-6 text-[#61796d]">System</p>
          <div className="space-y-0.5">
            {TOOL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2.5 text-sm text-[#9fb7ab] transition-colors hover:bg-[#10241c] hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-4 border-t border-[#1d3027] pt-3">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false)
                  signOut()
                }}
                className="block w-full px-3 py-2.5 text-left text-sm text-[#e08a7e] transition-colors hover:bg-[#2a1714]"
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
