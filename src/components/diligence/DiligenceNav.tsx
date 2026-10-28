'use client'

import { useEffect, useRef, useState } from 'react'
import { cx } from '@/components/ui/cx'

const SECTIONS = [
  { id: 'brief', number: '01', label: 'Brief' },
  { id: 'inventory', number: '02', label: 'Inventory' },
  { id: 'd-001', number: '03', label: 'D-001' },
  { id: 'evidence', number: '04', label: 'Evidence' },
  { id: 'questions', number: '05', label: 'Open questions' },
  { id: 'method', number: '06', label: 'Method' },
]

export function DiligenceNav() {
  const [active, setActive] = useState('brief')
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const marker = 140
      let current = SECTIONS[0].id

      for (const section of SECTIONS) {
        const element = document.getElementById(section.id)
        if (element && element.getBoundingClientRect().top <= marker) {
          current = section.id
        }
      }

      setActive(current)
    }

    const schedule = () => {
      if (frame) return
      frame = requestAnimationFrame(update)
    }

    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const link = nav.querySelector<HTMLElement>('[aria-current="location"]')
    if (!link) return
    nav.scrollTo({
      left: link.offsetLeft - nav.clientWidth / 2 + link.clientWidth / 2,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    })
  }, [active])

  return (
    <div className="sticky top-[65px] z-40 border-b border-line bg-bg/90 backdrop-blur-xl print:hidden">
      <div className="mx-auto flex max-w-[88rem] items-center gap-3 px-5 sm:px-8 lg:px-10">
        <span className="hidden shrink-0 py-3 font-mono text-[0.56rem] uppercase tracking-[0.16em] text-subtle xl:block">
          Dossier index
        </span>

        <nav
          ref={navRef}
          aria-label="Dossier sections"
          className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {SECTIONS.map((section) => {
            const isActive = active === section.id
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                aria-current={isActive ? 'location' : undefined}
                className={cx(
                  'relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 py-2 text-xs font-semibold transition-colors sm:text-[0.8125rem]',
                  isActive ? 'text-text' : 'text-muted hover:text-text'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cx(
                    'font-mono text-[0.56rem] tracking-[0.08em]',
                    isActive ? 'text-accent' : 'text-subtle'
                  )}
                >
                  {section.number}
                </span>
                {section.label}
                <span
                  aria-hidden="true"
                  className={cx(
                    'absolute inset-x-2.5 bottom-0 h-[2px] bg-accent transition-opacity duration-150',
                    isActive ? 'opacity-100' : 'opacity-0'
                  )}
                />
              </a>
            )
          })}
        </nav>

        <a
          href="/diligence-sample.md"
          download
          className="hidden shrink-0 items-center gap-2 border-l border-line py-2 pl-4 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-subtle transition-colors hover:text-accent sm:flex"
        >
          Download .md
          <span aria-hidden="true">↓</span>
        </a>
      </div>
    </div>
  )
}
