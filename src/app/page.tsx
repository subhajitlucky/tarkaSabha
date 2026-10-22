import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const DECISIONS = [
  { id: 'DEC-012', title: 'Use PostgreSQL as primary database', area: 'Infrastructure', risk: 'Medium', status: 'Reviewed' },
  { id: 'DEC-014', title: 'Migrate from REST to GraphQL', area: 'Architecture', risk: 'Low', status: 'In review' },
  { id: 'DEC-019', title: 'Adopt Kubernetes for production', area: 'DevOps', risk: 'Medium', status: 'Open' },
  { id: 'DEC-021', title: 'Use Redis for session caching', area: 'Infrastructure', risk: 'Low', status: 'Reviewed' },
]

const EVIDENCE = [
  { id: 'E-01', source: 'architecture/infra.md', note: 'Data access and reliability decisions', kind: 'GitHub' },
  { id: 'E-02', source: 'ADR-003-aws.md', note: 'Cloud infrastructure trade-offs', kind: 'Docs' },
  { id: 'E-03', source: 'ENG-421', note: 'Decision discussion and rationale', kind: 'Jira' },
  { id: 'E-04', source: '#infrastructure', note: 'Operational constraints and risks', kind: 'Slack' },
]

function ProductPreview() {
  return (
    <div className="relative border border-[#dce5e0] bg-white text-[#101714] shadow-[0_32px_90px_-38px_rgba(0,0,0,0.75)]">
      <div className="flex items-center justify-between gap-3 border-b border-[#e3eae6] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center bg-[#0f5b43] font-display text-xs text-white">
            त
          </span>
          <span className="text-sm font-semibold">Tarka Sabha</span>
        </div>
        <span className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-[#7d8983]">
          Demo workspace
        </span>
      </div>

      <div className="grid grid-cols-[7rem_1fr]">
        <div className="border-r border-[#e3eae6] bg-[#f8faf9] p-3">
          <p className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-[#7d8983]">Workspace</p>
          <p className="mt-2 text-xs font-semibold">Project Kestrel</p>
          <div className="mt-4 space-y-1">
            {['Overview', 'Decisions', 'Evidence', 'Dossier', 'Team'].map((item, index) => (
              <div
                key={item}
                className={
                  index === 0
                    ? 'border-l-2 border-[#0f5b43] bg-[#e8f2ed] px-2 py-1.5 text-[0.65rem] font-medium text-[#0f5b43]'
                    : 'px-2 py-1.5 text-[0.65rem] text-[#65716b]'
                }
              >
                {item}
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-[#e3eae6] pt-3">
            <p className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-[#7d8983]">Team</p>
            <div className="mt-2 flex -space-x-1">
              {['AR', 'SP', 'MK'].map((initials) => (
                <span
                  key={initials}
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-white bg-[#dfece6] font-mono text-[0.45rem] text-[#0f5b43]"
                >
                  {initials}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Project Kestrel</h2>
                <span className="border border-[#b7d4c8] bg-[#e8f2ed] px-1.5 py-0.5 font-mono text-[0.45rem] uppercase tracking-[0.1em] text-[#0f5b43]">
                  In diligence
                </span>
              </div>
              <p className="mt-1 text-[0.62rem] text-[#65716b]">Payments infrastructure · Bengaluru · Series C</p>
            </div>
            <span className="border border-[#dce5e0] px-2 py-1 text-[0.55rem] text-[#65716b]">Share</span>
          </div>

          <div className="mt-3 flex gap-4 border-b border-[#e3eae6] text-[0.58rem]">
            {['Overview', 'Decisions', 'Evidence', 'Dossier'].map((tab, index) => (
              <span
                key={tab}
                className={
                  index === 0
                    ? 'border-b-2 border-[#0f5b43] pb-2 font-medium text-[#0f5b43]'
                    : 'pb-2 text-[#7d8983]'
                }
              >
                {tab}
              </span>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {[
              ['24', 'Decisions'],
              ['186', 'Evidence'],
              ['7', 'Open questions'],
              ['78%', 'Dossier'],
            ].map(([value, label]) => (
              <div key={label} className="border border-[#e3eae6] p-2">
                <p className="text-lg leading-none">{value}</p>
                <p className="mt-1 text-[0.48rem] text-[#7d8983]">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 border border-[#e3eae6]">
            <div className="flex items-center justify-between border-b border-[#e3eae6] px-2 py-1.5">
              <p className="text-[0.58rem] font-medium">Recent decisions</p>
              <span className="text-[0.5rem] text-[#0f5b43]">View all</span>
            </div>
            {DECISIONS.slice(0, 3).map((decision) => (
              <div key={decision.id} className="flex items-center gap-2 border-b border-[#eef3f0] px-2 py-1.5 last:border-b-0">
                <span className="font-mono text-[0.45rem] text-[#7d8983]">{decision.id}</span>
                <span className="min-w-0 flex-1 truncate text-[0.55rem]">{decision.title}</span>
                <span className="text-[0.45rem] text-[#7d8983]">{decision.risk}</span>
                <span className="border border-[#dce5e0] px-1 py-0.5 text-[0.42rem] text-[#65716b]">{decision.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden bg-[#080d0b] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_34rem_at_15%_0%,rgba(15,91,67,0.55),transparent_62%),radial-gradient(40rem_30rem_at_90%_25%,rgba(95,191,145,0.12),transparent_60%)]"
        />
        <div className="relative mx-auto grid max-w-[88rem] gap-12 px-5 sm:px-8 lg:px-10 py-16 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-14 lg:py-24">
          <div className="rise">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[#89e6bb]">
              Technical due diligence for private equity
            </p>
            <h1 className="mt-5 max-w-xl text-[3.4rem] leading-[0.94] tracking-[-0.045em] sm:text-7xl">
              Less opinion.
              <br />
              <span className="text-[#89e6bb]">More evidence.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-[#bdcfc4]">
              Tarka Sabha turns technical decisions into source-backed evidence and a diligence
              dossier — built for private-equity teams evaluating software acquisitions.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              <Link href="/workspaces">
                <Button variant="primary" size="lg">
                  Open a workspace
                </Button>
              </Link>
              <Link href="/diligence">
                <Button
                  variant="secondary"
                  size="lg"
                  className="border-white/20 bg-transparent text-white hover:border-white/40 hover:bg-white/5"
                >
                  View sample dossier
                </Button>
              </Link>
            </div>

            <div className="mt-12 grid max-w-lg grid-cols-1 gap-3 border-t border-white/10 pt-5 sm:grid-cols-3 sm:gap-4">
              {[
                ['Source-backed', 'Every claim has a source'],
                ['Decision records', 'Trade-offs and ownership'],
                ['Dossier-ready', 'Shareable and printable'],
              ].map(([title, body]) => (
                <div key={title}>
                  <p className="text-xs font-semibold text-white">{title}</p>
                  <p className="mt-1 text-[0.65rem] leading-relaxed text-[#8fa89b]">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rise hidden lg:block" style={{ animationDelay: '120ms' }}>
            <ProductPreview />
          </div>
        </div>
      </section>

      <section id="product" className="scroll-mt-24 border-b border-line bg-surface">
        <div className="mx-auto max-w-[88rem] px-5 sm:px-8 lg:px-10 py-16">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="eyebrow">From code to a convincing investment thesis</p>
              <h2 className="mt-4 max-w-md text-4xl leading-[1.02] text-text">
                Technical diligence that reads like a financial document.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
                Ingest the repository and docs, identify the decisions already embedded in the
                code, attach source evidence, and turn the whole record into a dossier an
                investment committee can read.
              </p>
              <Link href="/diligence" className="mt-6 inline-block">
                <Button variant="secondary" size="sm">
                  See the sample →
                </Button>
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['01', 'Ingest sources', 'Repositories, docs, tickets, and architecture notes.'],
                ['02', 'Extract decisions', 'Find and structure the choices already made.'],
                ['03', 'Verify with evidence', 'Link every claim to source material and a hash.'],
                ['04', 'Generate dossier', 'Produce a board-ready report with open questions.'],
              ].map(([number, title, body]) => (
                <div key={number} className="border border-line bg-surface p-5">
                  <p className="font-mono text-[0.62rem] text-accent">{number}</p>
                  <h3 className="mt-5 text-lg font-semibold text-text">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-bg">
        <div className="mx-auto max-w-[88rem] px-5 sm:px-8 lg:px-10 py-16">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <p className="eyebrow">Sample decision from a dossier</p>
                <Badge tone="success">Verified</Badge>
              </div>
              <h2 className="mt-5 text-3xl leading-tight text-text">
                Use PostgreSQL as the primary transactional database.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
                Stronger consistency and transactional guarantees for core payments. Better
                ecosystem support and operational maturity. Simplifies the data stack and
                reduces operational complexity.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['Infrastructure', 'Database', 'PostgreSQL'].map((tag) => (
                  <span key={tag} className="border border-line px-2 py-1 font-mono text-[0.6rem] text-muted">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-8 border-t border-line pt-4 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-subtle">
                Owned by Ananya Rao · Reviewed Oct 22, 2026
              </div>
            </Card>

            <Card className="p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <p className="eyebrow">Evidence</p>
                <span className="font-mono text-xs text-subtle">04</span>
              </div>
              <div className="mt-4 divide-y divide-line">
                {EVIDENCE.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 py-3">
                    <span className="font-mono text-[0.6rem] text-accent">{item.id}</span>
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[0.7rem] text-text">{item.source}</p>
                      <p className="mt-0.5 text-xs text-muted">{item.note}</p>
                    </div>
                    <span className="ml-auto font-mono text-[0.55rem] uppercase text-subtle">{item.kind}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-subtle">
                Every evidence item is linked to a source path, commit, quote, and where
                possible, a SHA-256 hash.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-[88rem] flex-col gap-8 px-5 sm:px-8 lg:px-10 py-14 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">Before the next signature</p>
            <h2 className="mt-3 max-w-2xl text-4xl leading-[1.02] text-text">
              Bring the evidence pack, not just the code review.
            </h2>
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
