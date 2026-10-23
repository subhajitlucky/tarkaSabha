import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, Rule } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Pricing — Tarka Sabha',
  description:
    'Scoped pricing for technical diligence sprints, private workspaces, and portfolio review. No fake self-serve checkout.',
}

const PLANS = [
  {
    name: 'Diligence sprint',
    eyebrow: 'One deal',
    description: 'A focused evidence pack for a live target or one decision area.',
    points: [
      'Decision inventory ranked by deal impact',
      'Evidence ledger with paths, quotes, and hashes',
      'Open questions and residual-risk register',
      'Dossier v1 for the investment committee',
    ],
    commercial: 'Scoped per deal',
    cta: 'Request a sprint',
    href: '/feedback',
  },
  {
    name: 'Private workspace',
    eyebrow: 'Recurring diligence',
    description: 'A private room for a deal team that needs the record to keep moving.',
    points: [
      'Private workspace and scoped membership',
      'Decision records, pins, and approvals',
      'Review rooms with agent transcripts',
      'Versioned dossiers and expiring share links',
    ],
    commercial: 'Scoped per team',
    cta: 'Open a workspace',
    href: '/workspaces',
    highlighted: true,
  },
  {
    name: 'Portfolio review',
    eyebrow: 'Across the fund',
    description: 'A repeatable review surface for operating partners and portfolio teams.',
    points: [
      'Cross-matter portfolio view',
      'Outcome checks and revisit obligations',
      'Decision debt across companies',
      'Audit trail and read-only stakeholder access',
    ],
    commercial: 'Scoped per portfolio',
    cta: 'Talk to us',
    href: '/feedback',
  },
]

const COMPARISON: Array<[string, boolean, boolean, boolean]> = [
  ['Decision records', true, true, true],
  ['Evidence coordinates and hashes', true, true, true],
  ['Approval trail', true, true, true],
  ['Versioned dossier', true, true, true],
  ['Private workspaces and roles', false, true, true],
  ['Review rooms with agents', false, true, true],
  ['Cross-matter portfolio view', false, false, true],
  ['Outcome and revisit tracking', false, false, true],
]

export default function PricingPage() {
  return (
    <div>
      <section className="home-hero border-b border-line">
        <div className="mx-auto grid max-w-[88rem] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:px-10 lg:py-24">
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-accent">
              Pricing
            </p>
            <h1 className="mt-5 max-w-2xl text-[3.3rem] leading-[0.94] tracking-[-0.045em] text-text sm:text-7xl">
              Pricing that follows the deal.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
              Technical diligence is not a seat-count problem. We scope the work around the target,
              the source material, the review cadence, and the record you need to defend.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              <Link href="/feedback">
                <Button variant="primary" size="lg">
                  Request a quote
                </Button>
              </Link>
              <Link href="/diligence">
                <Button variant="secondary" size="lg">
                  See the sample record
                </Button>
              </Link>
            </div>
            <p className="mt-8 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-subtle">
              Scoped per engagement · Written scope before work begins
            </p>
          </div>

          <Card className="self-start">
            <p className="eyebrow">What a quote covers</p>
            <div className="mt-4 divide-y divide-line">
              {[
                ['Targets', 'One live deal, one decision area, or a portfolio review.'],
                ['Sources', 'Repository, architecture notes, tickets, and data-room material.'],
                ['Record', 'Decision inventory, evidence ledger, open questions, and dossier.'],
                ['Cadence', 'A one-off sprint or an ongoing workspace for the deal team.'],
              ].map(([label, body]) => (
                <div key={label} className="py-4 first:pt-0 last:pb-0">
                  <p className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-subtle">
                    {label}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-text">{body}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-[88rem] px-5 py-16 sm:px-8 lg:px-10">
          <Rule label="Engagements" className="mb-8" />
          <div className="grid gap-4 xl:grid-cols-3">
            {PLANS.map((plan) => (
              <Card
                key={plan.name}
                raised={plan.highlighted}
                className={
                  plan.highlighted
                    ? 'flex h-full flex-col border-accent-line bg-surface'
                    : 'flex h-full flex-col bg-surface'
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="eyebrow">{plan.eyebrow}</p>
                  {plan.highlighted && <Badge tone="accent">Recurring</Badge>}
                </div>
                <h2 className="mt-5 font-display text-3xl text-text">{plan.name}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{plan.description}</p>
                <ul className="mt-6 flex-1 space-y-3 border-t border-line pt-5">
                  {plan.points.map((point) => (
                    <li key={point} className="flex gap-3 text-sm leading-relaxed text-muted">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent" />
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 border-t border-line pt-4">
                  <p className="font-mono text-xs uppercase tracking-[0.12em] text-subtle">
                    {plan.commercial}
                  </p>
                  <Link href={plan.href} className="mt-3 block">
                    <Button
                      variant={plan.highlighted ? 'primary' : 'secondary'}
                      className="w-full"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-bg">
        <div className="mx-auto max-w-[88rem] px-5 py-16 sm:px-8 lg:px-10">
          <Rule label="What is included" className="mb-8" />
          <Card flush className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line font-mono text-[0.6rem] uppercase tracking-[0.14em] text-subtle">
                    <th className="px-5 py-3 font-normal">Capability</th>
                    <th className="px-4 py-3 font-normal text-center">Sprint</th>
                    <th className="px-4 py-3 font-normal text-center">Workspace</th>
                    <th className="px-5 py-3 font-normal text-center">Portfolio</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map(([feature, sprint, workspace, portfolio]) => (
                    <tr key={feature} className="border-b border-line last:border-b-0">
                      <td className="px-5 py-4 text-sm text-text">{feature}</td>
                      {[sprint, workspace, portfolio].map((included, index) => (
                        <td key={index} className="px-4 py-4 text-center">
                          {included ? (
                            <span className="font-mono text-sm text-accent">✓</span>
                          ) : (
                            <span className="font-mono text-sm text-subtle">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="mt-3 max-w-3xl text-xs leading-relaxed text-subtle">
            A written scope confirms targets, source access, review cadence, and deliverables.
            Pricing is confirmed before work begins; there is no automated checkout for a
            diligence engagement.
          </p>
        </div>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-[88rem] gap-6 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:px-10">
          <div>
            <p className="eyebrow">Good fit</p>
            <h2 className="mt-3 text-3xl leading-tight text-text">
              You have a deal, a codebase, and a question that needs evidence.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
              Pricing is scoped to the work. Start with the sample dossier, then tell us the target,
              the decision area, and the timeline. We will come back with a written scope.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2 lg:justify-end">
            <Link href="/feedback">
              <Button variant="primary" size="lg">
                Request a quote
              </Button>
            </Link>
            <Link href="/teams">
              <Button variant="secondary" size="lg">
                For deal teams
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
