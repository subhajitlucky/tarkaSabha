import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, Rule } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Careers — Tarka Sabha',
  description:
    'Work on the evidence layer for technical M&A. Tarka Sabha is a small team building decision records, evidence, and diligence dossiers.',
}

const TRACKS = [
  {
    eyebrow: 'Diligence engineering',
    title: 'Turn code into evidence',
    body: 'Read repositories and architecture the way a deal team reads a data room. Build extraction, source coordinates, and the checks that make a claim survive scrutiny.',
  },
  {
    eyebrow: 'Product engineering',
    title: 'Build the record',
    body: 'Work across the document model, review rooms, approvals, and versioned dossiers. The hard part is not another dashboard; it is making the record trustworthy.',
  },
  {
    eyebrow: 'Design and research',
    title: 'Make complexity legible',
    body: 'Design for investment committees, technical advisors, and operators who need different views of the same decision. Clarity is the product surface.',
  },
  {
    eyebrow: 'Design partners',
    title: 'Bring a live deal',
    body: 'We work closely with a small number of funds and advisors. If you run technical diligence, we would rather learn from a real target than a hypothetical one.',
  },
]

export default function CareersPage() {
  return (
    <div>
      <section className="home-hero border-b border-line">
        <div className="mx-auto grid max-w-[88rem] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:px-10 lg:py-24">
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-accent">
              Careers
            </p>
            <h1 className="mt-5 max-w-2xl text-[3.3rem] leading-[0.94] tracking-[-0.045em] text-text sm:text-7xl">
              Work on the record.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
              A small team building the evidence layer for technical M&A.
            </p>
            <div className="hero-actions mt-8">
              <Link href="/feedback">
                <Button variant="primary" size="lg">
                  Introduce yourself
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="secondary" size="lg">
                  Read about the product
                </Button>
              </Link>
            </div>
            <p className="mt-8 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-subtle">
              Small team · Remote-friendly · Design partners
            </p>
          </div>

          <Card className="self-start">
            <p className="eyebrow">How we work</p>
            <div className="mt-4 space-y-4">
              {[
                ['Primary sources', 'We read the code, the document, and the decision before we form an opinion.'],
                ['Show the working', 'The record should explain its reasoning and its limits.'],
                ['Small surface area', 'Every screen earns its place. Every feature has an owner.'],
                ['Deal-team pace', 'The work is tied to real transactions and real review windows.'],
              ].map(([title, body]) => (
                <div key={title} className="border-b border-line pb-4 last:border-b-0 last:pb-0">
                  <p className="text-sm font-semibold text-text">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-[88rem] px-5 py-16 sm:px-8 lg:px-10">
          <Rule label="Where we need help" className="mb-8" />
          <div className="grid gap-3 md:grid-cols-2">
            {TRACKS.map((track) => (
              <Card key={track.title} className="flex h-full flex-col">
                <p className="eyebrow">{track.eyebrow}</p>
                <h2 className="mt-4 font-display text-2xl text-text">{track.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{track.body}</p>
                <Link
                  href="/feedback"
                  className="mt-5 font-mono text-xs text-accent transition-colors hover:text-accent-hover"
                >
                  Start a conversation →
                </Link>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-subtle">
            We do not have a public list of open reqs. Send a note with the work you want to do,
            the evidence you can show for it, and the kind of team you want to join.
          </p>
        </div>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-[88rem] flex-col gap-6 px-5 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <p className="eyebrow">Next</p>
            <h2 className="mt-3 max-w-2xl text-3xl leading-tight text-text">
              Tell us what you would put on the record.
            </h2>
          </div>
          <Link href="/feedback">
            <Button variant="primary" size="lg">
              Introduce yourself
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
