import Link from 'next/link'

const FOOTER_LINKS = [
  ['/workspaces', 'Workspaces'],
  ['/diligence', 'Diligence'],
  ['/history', 'Review rooms'],
  ['/demo', 'Sample'],
  ['/debate', 'New review'],
  ['/personas', 'Agents'],
  ['/providers', 'Providers'],
  ['/feedback', 'Feedback'],
]

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#080d0b] text-[#dce9e2] print:hidden">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center border border-[#2c5747] bg-[#0f3529] font-display text-sm text-[#89e6bb]"
            >
              त
            </span>
            <span className="font-display text-lg">Tarka Sabha</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#91a89b]">
            Decision evidence for technical M&A. Frame the decision, attach the source, keep the
            approval trail, and share a dossier that can be read without the chat.
          </p>
          <p className="mt-6 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[#61796d]">
            Private by default · Source-backed · Expiring shares
          </p>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          {FOOTER_LINKS.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="text-[#91a89b] transition-colors hover:text-[#89e6bb]"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-[#61796d] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Tarka Sabha</p>
          <p>Less opinion. More evidence.</p>
        </div>
      </div>
    </footer>
  )
}
