import Link from 'next/link'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, Rule } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/EmptyState'

const COUNCIL = [
  {
    name: 'Meera',
    role: 'Researcher',
    note: 'Brings evidence and flags uncertainty.',
  },
  {
    name: 'Arjun',
    role: 'Critic',
    note: 'Attacks the weakest part of the reasoning.',
  },
  {
    name: 'Leela',
    role: 'Planner',
    note: 'Turns the discussion into concrete steps.',
  },
  {
    name: 'Kabir',
    role: 'Synthesizer',
    note: 'Pulls the threads together.',
  },
]

const TRANSCRIPT = [
  {
    name: 'Meera',
    role: 'Researcher',
    text: 'The risk is cross-tenant reads, not just a missing filter. Every tenant table needs a policy, and the application role must not be able to bypass it.',
  },
  {
    name: 'Arjun',
    role: 'Critic',
    text: 'The draft assumes the app connects as the table owner. The owner bypasses RLS. A dedicated application role is part of the answer, not an optional hardening step.',
  },
  {
    name: 'Leela',
    role: 'Planner',
    text: 'Ship the policies, seed two tenants, and add a rolled-back probe to CI. The probe should fail the build if either tenant can read the other.',
  },
  {
    name: 'Kabir',
    role: 'Synthesizer',
    text: 'Recommendation: RLS as the boundary, a non-owner application role, and a two-tenant probe in CI. Keep the owner path for migrations only.',
  },
]

const RUBRIC = [
  { label: 'Grounding', score: 9 },
  { label: 'Coverage', score: 8 },
  { label: 'Decisiveness', score: 8 },
  { label: 'Honesty', score: 9 },
  { label: 'Fit', score: 8.5 },
]

const CANDIDATES = [
  { angle: 'Risk-aware', score: 8.5, selected: true },
  { angle: 'Actionable', score: 7.8, selected: false },
  { angle: 'Decisive', score: 7.7, selected: false },
]

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <PageHeader
        eyebrow="Sample review room"
        title="A review room, on the record"
        lede="A public, read-only example of a review run: roles, disagreement, a scored deliverable, and the candidates that lost."
        actions={
          <Link href="/debate">
            <Button variant="primary">Convene your own</Button>
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge tone="outline">Illustrative sample · not a live model run</Badge>
        <Link href="/about" className="text-sm text-muted underline decoration-line underline-offset-4 hover:text-accent">
          How the council works
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card raised>
            <Rule label="Objective" className="mb-4" />
            <h2 className="max-w-2xl text-2xl leading-snug text-text">
              Recommend a tenant-isolation model for a campus lost-and-found app.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              Deliverable: a one-page decision for the engineering lead. Audience: a
              small team shipping its first multi-tenant Postgres feature.
            </p>
          </Card>

          <Card flush>
            <div className="border-b border-line p-5">
              <Rule label="Transcript" />
            </div>
            <ol className="divide-y divide-line">
              {TRANSCRIPT.map((message) => (
                <li key={message.name} className="p-5">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-display text-base text-text">{message.name}</span>
                    <span className="eyebrow">{message.role}</span>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
                    {message.text}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <Rule label="The council" className="mb-4" />
            <ul className="space-y-4">
              {COUNCIL.map((member) => (
                <li key={member.name}>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-display text-base text-text">{member.name}</span>
                    <Badge tone="accent">{member.role}</Badge>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{member.note}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Rule label="Winner" />
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  The risk-aware draft won. It kept the owner bypass in the discussion
                  instead of optimizing it away.
                </p>
              </div>
              <span className="font-display text-3xl text-accent">8.5</span>
            </div>
            <div className="mt-5 space-y-2.5">
              {RUBRIC.map((criterion) => (
                <div key={criterion.label} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-3">
                  <span className="text-xs text-muted">{criterion.label}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${criterion.score * 10}%` }}
                    />
                  </span>
                  <span className="text-right font-mono text-xs text-muted">
                    {criterion.score.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <Rule label="Candidates" className="mb-4" />
            <ul className="space-y-2">
              {CANDIDATES.map((candidate) => (
                <li
                  key={candidate.angle}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className={candidate.selected ? 'text-text' : 'text-muted'}>
                    {candidate.angle}
                    {candidate.selected ? ' · selected' : ''}
                  </span>
                  <span className="font-mono text-xs text-muted">{candidate.score.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <Rule label="What the council changed" className="mb-4" />
        <div className="grid gap-4 sm:grid-cols-3">
          <p className="text-sm leading-relaxed text-muted">
            <span className="block font-display text-base text-text">The critic found the bypass.</span>
            The first draft optimized a filter while leaving the owner path open.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            <span className="block font-display text-base text-text">The researcher made it testable.</span>
            The recommendation included a two-tenant probe, not just a policy snippet.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            <span className="block font-display text-base text-text">The rubric chose the safer answer.</span>
            Grounding and honesty outweighed the more decisive but less complete draft.
          </p>
        </div>
      </Card>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link href="/debate">
          <Button variant="primary">Convene a council</Button>
        </Link>
        <Link href="/login?callbackUrl=/demo">
          <Button variant="secondary">Sign in to keep a record</Button>
        </Link>
      </div>
    </div>
  )
}
