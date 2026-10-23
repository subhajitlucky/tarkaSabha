import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProductPreview } from '@/components/marketing/ProductPreview'

const EVIDENCE = [
  { id: 'E-01', source: 'architecture/infra.md', note: 'Data access and reliability decisions', kind: 'GitHub' },
  { id: 'E-02', source: 'ADR-003-aws.md', note: 'Cloud infrastructure trade-offs', kind: 'Docs' },
  { id: 'E-03', source: 'ENG-421', note: 'Decision discussion and rationale', kind: 'Jira' },
  { id: 'E-04', source: '#infrastructure', note: 'Operational constraints and risks', kind: 'Slack' },
]


export default function Home() {
  return (
    <div>
      <section className="home-hero relative overflow-hidden border-b border-line">
        <div className="relative mx-auto grid max-w-[88rem] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-14 lg:px-10 lg:py-24">
          <div className="rise">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-accent">
              Technical due diligence for private equity
            </p>
            <h1 className="mt-5 max-w-xl text-[3.4rem] leading-[0.94] tracking-[-0.045em] text-text sm:text-7xl">
              Less opinion.
              <br />
              <span className="text-accent">More evidence.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted">
              Decision evidence for software M&A.
            </p>
            <div className="hero-actions mt-8">
              <Link href="/workspaces">
                <Button variant="primary" size="lg">
                  Open a workspace
                </Button>
              </Link>
              <Link href="/diligence">
                <Button variant="secondary" size="lg">
                  View sample dossier
                </Button>
              </Link>
            </div>

            <div className="mt-12 grid max-w-lg grid-cols-1 gap-3 border-t border-line pt-5 sm:grid-cols-3 sm:gap-4">
              {[
                ['Source-backed', 'Every claim has a source'],
                ['Decision records', 'Trade-offs and ownership'],
                ['Dossier-ready', 'Shareable and printable'],
              ].map(([title, body]) => (
                <div key={title}>
                  <p className="text-xs font-semibold text-text">{title}</p>
                  <p className="mt-1 text-[0.65rem] leading-relaxed text-subtle">{body}</p>
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
              <h2 className="mt-4 max-w-md text-3xl leading-[1.08] text-text">
                Technical diligence that reads like a financial document.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
                Ingest the codebase and docs, capture the decisions already made, and publish an evidence-backed dossier.
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

      <section className="border-b border-line bg-bg">
        <div className="mx-auto max-w-[88rem] px-5 py-16 sm:px-8 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">The record</p>
              <h2 className="mt-3 max-w-2xl text-4xl leading-[1.02] text-text">
                One decision. Four surfaces.
              </h2>
            </div>
            <Link href="/product">
              <Button variant="secondary" size="sm">
                See the product
              </Button>
            </Link>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['01', 'Decision record', 'The choice, owner, impact, and review state in one place.', 'Owner · impact · status'],
              ['02', 'Evidence ledger', 'Every claim points to a path, commit, quote, and where possible a hash.', '4 sources attached'],
              ['03', 'Approval trail', 'Who signed off, on which snapshot, and what evidence they covered.', '1 approval'],
              ['04', 'Diligence dossier', 'A versioned record that can travel to the IC without the chat.', 'v1 · expiring share'],
            ].map(([number, title, body, detail]) => (
              <Card key={number} className="flex h-full flex-col bg-surface">
                <p className="font-mono text-[0.62rem] text-accent">{number}</p>
                <h3 className="mt-5 font-display text-xl text-text">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{body}</p>
                <p className="mt-5 border-t border-line pt-3 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-subtle">
                  {detail}
                </p>
              </Card>
            ))}
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
                Stronger consistency, better ecosystem support, and a simpler data stack.
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
                Every claim carries a path, quote, and hash.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-bg">
        <div className="mx-auto max-w-[88rem] px-5 py-16 sm:px-8 lg:px-10">
          <p className="eyebrow">FAQ</p>
          <h2 className="mt-3 max-w-2xl text-4xl leading-[1.02] text-text">
            Before you ask.
          </h2>
          <div className="mt-8 max-w-3xl border-y border-line">
            {[
              ['Is this another code review?', 'No. It records what the code has already chosen, who owns the choice, what supports it, and what remains unresolved.'],
              ['What do we need to start a sprint?', 'A target, source material, the decision area you care about, and the people who can answer production questions.'],
              ['How is private material handled?', 'Workspaces are private, share links expire, and provider keys are encrypted before storage.'],
              ['Does this replace the data room?', 'No. It is the decision layer beside the data room, with the open questions attached.'],
            ].map(([question, answer]) => (
              <details key={question} className="group border-b border-line last:border-b-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-base text-text">
                  {question}
                  <span className="font-mono text-sm text-accent transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pb-5 text-sm leading-relaxed text-muted">{answer}</p>
              </details>
            ))}
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
