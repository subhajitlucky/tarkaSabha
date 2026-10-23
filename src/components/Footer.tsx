import Link from 'next/link'

const FOOTER_LINKS = [
  ['/product', 'Product'],
  ['/diligence', 'Diligence'],
  ['/teams', 'For teams'],
  ['/pricing', 'Pricing'],
  ['/security', 'Security'],
  ['/privacy', 'Privacy'],
  ['/terms', 'Terms'],
  ['/about', 'About'],
  ['/demo', 'Sample review'],
  ['/careers', 'Careers'],
  ['/workspaces', 'Open workspace'],
  ['/feedback', 'Feedback'],
]

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface text-text print:hidden">
      <div className="mx-auto grid max-w-[88rem] gap-10 px-5 sm:px-8 lg:px-10 py-14 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center border border-accent bg-accent font-display text-sm text-accent-ink"
            >
              त
            </span>
            <span className="font-display text-lg">Tarka Sabha</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Decision evidence for technical M&A. Frame the decision, attach the source, keep the
            approval trail, and share a dossier that can be read without the chat.
          </p>
          <p className="mt-6 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-subtle">
            Private by default · Source-backed · Expiring shares
          </p>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
          {FOOTER_LINKS.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="text-muted transition-colors hover:text-accent"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[88rem] flex-col gap-2 px-5 sm:px-8 lg:px-10 py-6 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Tarka Sabha</p>
          <p>Less opinion. More evidence.</p>
        </div>
      </div>
    </footer>
  )
}
