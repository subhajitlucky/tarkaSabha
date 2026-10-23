import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, Rule } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'For deal teams — Tarka Sabha',
  description:
    'Technical diligence for private-equity deal teams, operating partners, and technical advisors. Source-backed decision records and investment-ready dossiers.',
}

const ENGAGEMENTS = [
  {
    engagement: 'Design-partner sprint',
    scope: 'One target or one decision area',
    output: 'Decision inventory, evidence pack, open questions, dossier v1',
    commercial: 'Scoped per deal',
  },
  {
    engagement: 'Private workspace',
    scope: 'Recurring diligence across a fund or portfolio',
    output: 'Workspaces, review rooms, approvals, versioned dossiers',
    commercial: 'Scoped per team',
  },
  {
    engagement: 'Post-close review',
    scope: 'First 100 days and revisit obligations',
    output: 'Outcome checks, decision debt, unresolved-risk register',
    commercial: 'Scoped per portfolio',
  },
]

const DELIVERABLES = [
  ['Decision inventory', 'The choices already embedded in the target’s code, ranked by deal impact.'],
  ['Evidence ledger', 'Paths, commits, quotes, and hashes tied to each finding.'],
  ['Open questions', 'What the data room has not answered and who should answer it.'],
  ['Residual risk', 'What does not add up, called out separately from the evidence.'],
  ['Approval trail', 'Who signed off, on which snapshot, and what they covered.'],
  ['Dossier v1', 'A versioned, readable record for the investment committee.'],
]

export default function TeamsPage() {
  return (
    <div>
      <section className="home-hero relative overflow-hidden border-b border-line">
        <div className="relative mx-auto grid max-w-[88rem] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:px-10 lg:py-24">
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-accent">
              For deal teams
            </p>
            <h1 className="mt-5 max-w-2xl text-[3.3rem] leading-[0.94] tracking-[-0.045em] text-text sm:text-7xl">
              Technical diligence for the people who sign.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
              Source-backed technical diligence for private-equity deal teams and their advisors.
            </p>
            <div className="hero-actions mt-8">
              <Link href="/feedback">
                <Button variant="primary" size="lg">
                  Request a diligence sprint
                </Button>
              </Link>
              <Link href="/diligence">
                <Button variant="secondary" size="lg">
                  Read the sample dossier
                </Button>
              </Link>
            </div>
            <p className="mt-8 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-subtle">
              Design-partner model · Private by default · Scoped per deal
            </p>
          </div>

          <Card className="self-start bg-surface/80">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="eyebrow">Engagement brief</p>
              <Badge tone="accent">Design partner</Badge>
            </div>
            <div className="mt-5 space-y-4">
              {[
                ['Scope', 'One target, one decision area, or one portfolio review'],
                ['Input', 'Repository, architecture notes, tickets, and data-room material'],
                ['Output', 'Decision record, evidence ledger, open questions, dossier'],
                ['Commercial', 'Scoped per deal; direct with the team'],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-line pb-4 last:border-b-0 last:pb-0">
                  <p className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-subtle">
                    {label}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-text">{value}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-[88rem] px-5 py-16 sm:px-8 lg:px-10">
          <Rule label="Where it fits" className="mb-8" />
          <div className="grid gap-3 lg:grid-cols-3">
            {[
              {
                eyebrow: 'Before signing',
                title: 'Pre-sign diligence',
                body: 'Replace the code-review appendix with a decision-level record the investment committee can read and challenge.',
              },
              {
                eyebrow: 'After close',
                title: 'Post-close review',
                body: 'Keep revisit obligations, decision debt, and unresolved risk visible after the deal team has moved on.',
              },
              {
                eyebrow: 'Across the portfolio',
                title: 'Recurring review',
                body: 'Give operating partners one place to see what each portfolio company has decided and what remains unproven.',
              },
            ].map((item) => (
              <Card key={item.title} className="flex h-full flex-col">
                <p className="eyebrow">{item.eyebrow}</p>
                <h2 className="mt-5 font-display text-2xl text-text">{item.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{item.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-bg">
        <div className="mx-auto max-w-[88rem] px-5 py-16 sm:px-8 lg:px-10">
          <Rule label="Engagements" className="mb-8" />
          <Card flush className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line font-mono text-[0.6rem] uppercase tracking-[0.14em] text-subtle">
                    <th className="px-5 py-3 font-normal">Engagement</th>
                    <th className="px-4 py-3 font-normal">Scope</th>
                    <th className="px-4 py-3 font-normal">Output</th>
                    <th className="px-5 py-3 font-normal">Commercial</th>
                  </tr>
                </thead>
                <tbody>
                  {ENGAGEMENTS.map((row) => (
                    <tr key={row.engagement} className="border-b border-line last:border-b-0">
                      <td className="px-5 py-4 font-display text-lg text-text">{row.engagement}</td>
                      <td className="px-4 py-4 text-sm text-muted">{row.scope}</td>
                      <td className="px-4 py-4 text-sm text-muted">{row.output}</td>
                      <td className="px-5 py-4 font-mono text-xs text-accent">{row.commercial}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="mt-3 text-xs leading-relaxed text-subtle">
            Engagements are scoped per target, available source material, and review cadence. Request a
            sprint for a written scope before any work begins.
          </p>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-[88rem] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16 lg:px-10">
          <div>
            <p className="eyebrow">The deliverable</p>
            <h2 className="mt-4 max-w-md text-4xl leading-[1.02] text-text">
              A record the other side of the table can read.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              Not a slide deck with a confidence score. A record of what the target chose, what supports it, and what remains unknown.
            </p>
          </div>
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {DELIVERABLES.map(([title, body], index) => (
              <div key={title} className="border-t border-line pt-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[0.62rem] text-accent">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-display text-lg text-text">{title}</h3>
                </div>
                <p className="mt-1 pl-7 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-bg">
        <div className="mx-auto grid max-w-[88rem] gap-6 px-5 py-16 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10">
          <Card>
            <p className="eyebrow">What we do not claim</p>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
              A dossier is a point-in-time record, not an audit opinion. It makes verification faster and more legible.
            </p>
          </Card>
          <Card className="flex flex-col justify-between">
            <div>
              <p className="eyebrow">Start with the sample</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Read the public dossier first. If it matches the way your deal team works, request
                a scoped sprint for a live target.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/diligence">
                <Button variant="primary">Read the sample</Button>
              </Link>
              <Link href="/feedback">
                <Button variant="secondary">Request a sprint</Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-[88rem] flex-col gap-6 px-5 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <p className="eyebrow">Next</p>
            <h2 className="mt-3 max-w-2xl text-3xl leading-tight text-text">
              Bring the evidence, not just the engineering opinion.
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/feedback">
              <Button variant="primary" size="lg">
                Request a sprint
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
