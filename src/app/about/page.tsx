import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, Rule } from '@/components/ui/Card'

const SECTIONS = [
  {
    heading: 'A decision record, not another code review',
    body: 'A code review asks whether a change looks acceptable. A decision record asks what the code has already chosen, who owns it, and what remains unresolved.',
  },
  {
    heading: 'Evidence with coordinates',
    body: 'Every claim carries a source path, commit, quote, and hash. Unsupported and disputed claims stay visible.',
  },
  {
    heading: 'Debt, pins, and approvals',
    body: 'Decision debt makes unresolved work measurable. Pins define the separating test; approvals record who signed off.',
  },
  {
    heading: 'What we do not claim',
    body: 'A dossier is not an audit opinion and does not prove runtime behavior or production custody. It makes verification faster and more honest.',
  },
]

export default function AboutPage() {
  return (
    <div>
      <section className="home-hero relative overflow-hidden border-b border-line">
        <div className="relative mx-auto max-w-[88rem] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-accent">
            About Tarka Sabha
          </p>
          <h1 className="mt-5 max-w-5xl text-5xl leading-[0.96] tracking-[-0.045em] text-text sm:text-6xl lg:text-7xl">
            Evidence, <span className="text-accent">on the record.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            A decision evidence workspace for technical M&A.
          </p>
          <div className="mt-12 flex flex-col gap-2 border-t border-line pt-5 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-subtle sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
            <span>Private by default</span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span>Source-backed</span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span>Expiring shares</span>
          </div>
        </div>
      </section>

      <article>
        {SECTIONS.map((section, index) => (
          <section
            key={section.heading}
            className={`border-b border-line ${index % 2 === 0 ? 'bg-surface' : 'bg-bg'}`}
          >
            <div className="mx-auto max-w-[88rem] px-5 py-10 sm:px-8 lg:px-10 lg:py-12">
              <p className="font-mono text-xs tracking-[0.14em] text-accent">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h2 className="mt-3 max-w-4xl text-2xl leading-tight text-text sm:text-3xl">
                {section.heading}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
                {section.body}
              </p>
            </div>
          </section>
        ))}

        <section className="border-b border-line bg-surface">
          <div className="mx-auto max-w-[88rem] px-5 py-10 sm:px-8 lg:px-10 lg:py-12">
            <Card className="max-w-5xl">
              <Rule label="On honesty" className="mb-4" />
              <p className="text-base leading-relaxed text-muted">
                The record should show its working and its limits. Where the evidence is thin, it should say so.
              </p>
            </Card>
          </div>
        </section>
      </article>

      <section className="bg-bg">
        <div className="mx-auto flex max-w-[88rem] flex-col gap-6 px-5 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <p className="eyebrow">Next</p>
            <h2 className="mt-3 max-w-2xl text-3xl leading-tight text-text">
              Read the sample. Then bring a live deal.
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/diligence">
              <Button variant="primary" size="lg">
                Read the sample dossier
              </Button>
            </Link>
            <Link href="/workspaces">
              <Button variant="secondary" size="lg">
                Open a workspace
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
