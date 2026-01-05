'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import { useAuth } from './AuthProvider'

export default function Navbar() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const { session, isAuthenticated, signIn, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/debate', label: 'Start Debate' },
    { href: '/history', label: 'History' },
    { href: '/about', label: 'About' },
    { href: '/feedback', label: 'Feedback' },
  ]

  const isLight = theme === 'light'

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b transition-all duration-300 ${
      isLight ? 'bg-white/80 border-slate-200' : 'bg-slate-950/80 border-slate-800'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 z-50 relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-white font-bold text-lg">TS</span>
            </div>
            <div>
              <span className="font-bold text-lg bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Tarka Sabha
              </span>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Brahmodya Protocol</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                  pathname === link.href
                    ? isLight
                      ? 'bg-slate-100 text-slate-900'
                      : 'bg-slate-800 text-white'
                    : isLight
                      ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 z-50 relative">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800'
              }`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Auth Button */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link 
                  href="/dashboard" 
                  className={`hidden md:flex items-center justify-center transition-all hover:scale-105 cursor-pointer ${
                    isLight ? 'opacity-100 hover:opacity-80' : 'opacity-100 hover:opacity-80'
                  }`}
                  title="View User Dashboard"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all ring-2 ring-white/20">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </Link>
                <button
                  onClick={() => signOut()}
                  className={`hidden md:block px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer border shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className={`hidden md:block px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer border ${
                  isLight
                    ? 'bg-gradient-to-b from-slate-800 to-slate-950 border-slate-800 text-white shadow-slate-900/20'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/20 border-transparent'
                }`}
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${
                isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
        isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`} onClick={() => setIsMenuOpen(false)} />

      {/* Mobile Menu Panel */}
      <div className={`md:hidden fixed top-[73px] left-0 right-0 z-40 border-b shadow-2xl transition-all duration-300 transform ${
        isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
      } ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
        <div className="p-4 space-y-2">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl text-base font-medium transition-all ${
                pathname === link.href
                  ? isLight
                    ? 'bg-slate-100 text-slate-900'
                    : 'bg-slate-800 text-white'
                  : isLight
                    ? 'text-slate-600 hover:bg-slate-50'
                    : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
          
          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    isLight ? 'hover:bg-slate-50 text-slate-900' : 'hover:bg-slate-900 text-white'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    signOut()
                    setIsMenuOpen(false)
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    isLight ? 'text-red-600 hover:bg-red-50' : 'text-red-400 hover:bg-red-900/20'
                  }`}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="block w-full text-center bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 rounded-xl text-base font-bold shadow-lg shadow-amber-500/20"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
