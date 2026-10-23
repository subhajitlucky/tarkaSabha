'use client'

import { ReactNode, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Navbar from './Navbar'
import { Footer } from './Footer'
import { useAuth } from './AuthProvider'

const APP_PREFIXES = [
  '/workspaces',
  '/decisions',
  '/history',
  '/chat',
  '/personas',
  '/providers',
  '/dashboard',
]

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  const appRoute = APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  useEffect(() => {
    if (appRoute && !isLoading && !isAuthenticated) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
    }
  }, [appRoute, isAuthenticated, isLoading, pathname, router])

  if (appRoute && (isLoading || !isAuthenticated)) {
    return (
      <div className="flex min-h-[100dvh] flex-col">
        <Navbar mode="marketing" />
        <main className="flex flex-1 items-center justify-center px-5 pt-[65px]">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-subtle">
            {isLoading ? 'Checking your session…' : 'Redirecting to sign in…'}
          </p>
        </main>
      </div>
    )
  }

  const app = appRoute && isAuthenticated

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navbar mode={app ? 'app' : 'marketing'} />
      <main
        id="main"
        className={
          app
            ? 'flex-1 pt-[65px] lg:pl-[15.5rem] lg:pt-0 print:pl-0 print:pt-0'
            : 'marketing flex-1 pt-[65px] print:pt-0'
        }
      >
        {children}
      </main>
      {!app && <Footer />}
    </div>
  )
}
