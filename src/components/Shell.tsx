'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import { Footer } from './Footer'

const APP_PREFIXES = [
  '/workspaces',
  '/decisions',
  '/history',
  '/chat',
  '/personas',
  '/providers',
  '/feedback',
  '/dashboard',
]

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isApp = APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  return (
    <>
      <Navbar mode={isApp ? 'app' : 'marketing'} />
      <main
        id="main"
        className={
          isApp
            ? 'pt-[65px] lg:pl-[15.5rem] lg:pt-0 print:pl-0 print:pt-0'
            : 'pt-[65px] print:pt-0'
        }
      >
        {children}
      </main>
      {!isApp && <Footer />}
    </>
  )
}
