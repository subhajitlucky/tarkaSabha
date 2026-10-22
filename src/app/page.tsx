import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const CASE_EVIDENCE = [
  {
    id: 'E-01',
    path: 'src/lib/crypto.ts',
    note: 'AES-256-GCM with random salt and IV',
    hash: 'a56947…',
  },
  {
    id: 'E-04',
    path: 'src/app/api/providers/route.ts',
    note: 'Encrypted before storage; masked in responses',
    hash: 'f08cce…',
  },
  {
    id: 'E-06',
    path: 'src/lib/__tests__/crypto.test.ts',
    note: 'Round-trip, legacy path, malformed input',
    hash: 'cc5287…',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Frame the decision',
    body: 'Name the choice under review, the owner, and the deal consequence.',
  },
  {
    n: '02',
    title: 'Attach the evidence',
    body: 'Source paths, commits, quotes, hashes. A claim without a source stays visible.',
  },
  {
    n: '03',
    title: 'Put it under pressure',
    body: 'Debt, contradictions, pins, and the agent review room test the reasoning.',
  },
  {
    n: '04',
    title: 'Close the record',
    body: 'Approve, share a redacted dossier, sign the export, schedule the revisit.',
  },
]

function CaseFile() {
  return (
    <div className="rise" style={{ animationDelay: '120ms' }}>
      <div className="relative border border-line bg-surface p-5 shadow-lift sm:p-6">
        <span
          aria-hidden="true"
          className="absolute -left-px top-7 h-24 w-px bg-accent shadow-[0_0_18px_var(--accent-glow)]"
        />
        <div className="flex items-center justify-between gap-3 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-subtle">
          <span>Case file</span>
          <span>D-001 / Security</span>
        </div>

        <div className="mt-7 flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-accent">
          <span className="h-1.5 w-1.5 bg-accent" />
          Verified
        </div>
        <h2 className="mt-3 max-w-sm text-3xl leading-[1.02] text-text">
          Provider keys are encrypted at rest.
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
          AES-256-GCM encryption, server-side decryption, masked responses. The control holds;
          the master-key lifecycle does not.
        </p>

        <div className="mt-6 space-y-3 border-t border-line pt-4">
          {CASE_EVIDENCE.map((item) => (
            <div key={item.id} className="grid grid-cols-[2.2rem_1fr_auto] items-start gap-2">
              <span className="font-mono text-[0.62rem] text-accent">{item.id}</span>
              <span>
                <span className="block break-all font-mono text-[0.68rem] text-text">
                  {item.path}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  {item.note}
                </span>
              </span>
              <span className="font-mono text-[0.6rem] text-subtle">{item.hash}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <div className="flex items-center justify-between gap-3 font-mono text-[0.62rem] uppercase tracking-[0.1em]">
            <span className="text-subtle">Decision debt</span>
            <span className="text-text">30 / 100</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden bg-surface-2">
            <div className="h-full w-[30%] bg-accent" />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-subtle">
          <span>SHA-256 2d1366…</span>
          <span className="text-success">Approved</span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-subtle">
        <span>Public sample · ebee93f</span>
        <Link href="/diligence" className="text-accent transition-colors hover:text-accent-hover">
          Open the case →
        </Link>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div className="overflow-hidden">
      <section className="relative border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
          <div className="rise">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="accent">Decision evidence</Badge>
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-subtle">
                For M&amp;A / PE
              </span>
            </div>

            <h1 className="mt-8 max-w-2xl text-[3.35rem] leading-[0.94] tracking-[-0.045em] text-text sm:text-7xl">
              The code remembers.
              <br />
              <span className="text-accent">Make it provable.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
              Tarka Sabha turns a target’s technical decisions into a source-backed dossier:
              evidence, contradictions, debt, approvals, and the questions to ask before you
              sign.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-2">
              <Link href="/workspaces">
                <Button variant="primary" size="lg">
                  Open the workspace
                </Button>
              </Link>
              <Link href="/diligence">
                <Button variant="secondary" size="lg">
                  See the sample dossier
                </Button>
              </Link>
            </div>

            <dl className="mt-12 grid max-w-xl grid-cols-3 border-t border-line pt-5">
              {[
                ['Source-backed', 'Evidence, not recall'],
                ['Explainable', 'Debt, pins, approvals'],
                ['Portable', 'Signed, redacted dossiers'],
              ].map(([title, body]) => (
                <div key={title} className="pr-4">
                  <dt className="font-display text-lg text-text">{title}</dt>
                  <dd className="mt-1 text-xs leading-relaxed text-subtle">{body}</dd>
                </div>
              ))}
            </dl>
          </div>

          <CaseFile />
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <p className="eyebrow">The record</p>
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-subtle">
              Frame → Evidence → Pressure → Close
            </span>
          </div>
          <div className="mt-8 grid border-t border-line sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="border-b border-line py-6 sm:border-r sm:px-5 sm:last:border-r-0 lg:border-b-0"
              >
                <span className="font-mono text-[0.65rem] text-accent">{step.n}</span>
                <h2 className="mt-4 font-display text-xl leading-tight text-text">
                  {step.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="flex flex-col justify-between p-6 sm:p-8">
              <div>
                <p className="eyebrow">Evidence, not a narrative</p>
                <h2 className="mt-4 max-w-xl text-3xl leading-[1.05] text-text sm:text-4xl">
                  Every claim arrives with its source coordinates.
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
                  A quote without a path is a story. Tarka keeps the path, commit, quote, hash,
                  confidence, and status together — and leaves unsupported claims visible.
                </p>
              </div>
              <div className="mt-8 space-y-3 border-t border-line pt-5">
                {CASE_EVIDENCE.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-mono text-[0.62rem] text-accent">{item.id}</span>
                    <span className="break-all font-mono text-xs text-text">{item.path}</span>
                    <span className="font-mono text-[0.6rem] text-subtle">{item.hash}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid gap-3">
              <Card className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow">Decision debt</p>
                    <p className="mt-3 font-display text-4xl text-text">30<span className="text-xl text-subtle">/100</span></p>
                  </div>
                  <Badge tone="success">Moderate</Badge>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  Evidence coverage, unresolved findings, approvals, state, and deal impact in
                  one explainable number.
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="eyebrow">Audit trail</p>
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                </div>
                <div className="mt-4 space-y-2 font-mono text-[0.65rem] text-muted">
                  <p><span className="text-accent">11:13</span> evidence.added · E-04</p>
                  <p><span className="text-accent">11:13</span> approval.recorded · approved</p>
                  <p><span className="text-accent">11:14</span> dossier.generated · v1</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            <span className="font-display text-lg text-text">The council is a room, not the product.</span>{' '}
            Agents can pressure-test a decision, but the decision, the evidence, and the approval
            record remain the durable artifact.
          </p>
          <Link href="/history">
            <Button variant="ghost" size="sm">
              Open review rooms →
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow">Before the next signature</p>
            <h2 className="mt-4 max-w-2xl text-4xl leading-[1.02] text-text sm:text-5xl">
              Bring the evidence pack, not just the code review.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
              Start with the public sample dossier, then open a workspace for the decision in
              front of you.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/diligence">
              <Button variant="primary" size="lg">
                Read the sample
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
