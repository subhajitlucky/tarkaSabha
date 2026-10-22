import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, Rule } from '@/components/ui/Card'

const SECTIONS = [
  {
    heading: 'Why a decision record, not another code review',
    body: 'A code review tells you whether a change looks acceptable. A decision record tells you what the code has already chosen to do, who owns that choice, what evidence supports it, and what remains unresolved. Those are different questions — and the second is the one a buyer, board, or auditor needs before signing.',
  },
  {
    heading: 'Evidence with coordinates',
    body: 'A quote without a path is a story. Every evidence item carries a source path, commit, quote, confidence, and status; where possible it is locked to an immutable source snapshot with a SHA-256 hash. Unsupported and disputed claims stay visible instead of being smoothed over.',
  },
  {
    heading: 'Debt, pins, and approvals',
    body: 'Decision debt is an explainable 0–100 score built from evidence coverage, unresolved statuses, approvals, decision state, and deal impact. Pins turn a decision into a separating test with an expected result and a supersession trigger. Approvals record who signed off and the snapshot hash they covered.',
  },
  {
    heading: 'The review room is a room, not the product',
    body: 'The agent council remains useful when a record needs pressure. Agents with distinct jobs can test the reasoning, surface contradictions, and produce a review transcript. But the decision, the evidence, and the approval trail remain the durable artifact — not the chat.',
  },
  {
    heading: 'What we do not claim',
    body: 'A dossier is a record of what the workspace contains at a point in time. It does not prove runtime behavior, key custody, backup encryption, or production configuration, and it is not an audit opinion. The source still has to be verified. The point is to make that verification faster and more honest.',
  },
]

export default function AboutPage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-[#080d0b] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(58rem_34rem_at_12%_0%,rgba(15,91,67,0.5),transparent_64%),radial-gradient(42rem_30rem_at_92%_30%,rgba(95,191,145,0.1),transparent_60%)]"
        />
        <div className="relative mx-auto max-w-[88rem] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[#89e6bb]">
            About Tarka Sabha
          </p>
          <h1 className="mt-5 max-w-5xl text-5xl leading-[0.96] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
            Evidence, <span className="text-[#89e6bb]">on the record.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#bdcfc4]">
            Tarka Sabha is a decision evidence workspace for technical diligence. Frame the
            decision, attach the source, test the claim, and leave an approval trail that someone
            else can read.
          </p>
          <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-5 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#7f9a8c] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
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
            <div className="mx-auto max-w-[88rem] px-5 py-12 sm:px-8 lg:px-10 lg:py-14">
              <p className="font-mono text-xs tracking-[0.14em] text-accent">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h2 className="mt-3 max-w-4xl text-3xl leading-tight text-text sm:text-4xl">
                {section.heading}
              </h2>
              <p className="mt-4 max-w-5xl text-base leading-relaxed text-muted sm:text-lg">
                {section.body}
              </p>
            </div>
          </section>
        ))}

        <section className="border-b border-line bg-surface">
          <div className="mx-auto max-w-[88rem] px-5 py-12 sm:px-8 lg:px-10 lg:py-14">
            <Card className="max-w-5xl">
              <Rule label="On honesty" className="mb-4" />
              <p className="text-base leading-relaxed text-muted">
                The platform is built to show its working rather than to sound certain. Every
                decision carries a debt score and a rationale; every report carries a hash; every
                approval covers a named snapshot. Where the evidence is thin, the record should say
                so — not invent a conclusion.
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
              Read the record, then open a workspace of your own.
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
