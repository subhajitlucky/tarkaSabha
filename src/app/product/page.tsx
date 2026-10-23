import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, Rule } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Product — Tarka Sabha',
  description:
    'A decision evidence workspace for technical M&A: decision records, source coordinates, approval trails, and versioned diligence dossiers.',
}

function RecordPreview() {
  return (
    <div className="relative border border-[#dce5e0] bg-white text-[#101714] shadow-[0_30px_90px_-44px_rgba(20,35,28,0.38)]">
      <div className="flex items-center justify-between gap-3 border-b border-[#e3eae6] px-4 py-3">
        <span className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-[#65716b]">
          Decision record
        </span>
        <span className="font-mono text-[0.55rem] text-[#7d8983]">SAMPLE · D-001 · VERIFIED</span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="border border-[#b7d4c8] bg-[#e8f2ed] px-1.5 py-0.5 font-mono text-[0.45rem] uppercase tracking-[0.1em] text-[#0f5b43]">
            Security
          </span>
          <span className="border border-[#dce5e0] px-1.5 py-0.5 font-mono text-[0.45rem] uppercase tracking-[0.1em] text-[#65716b]">
            High impact
          </span>
          <span className="border border-[#dce5e0] px-1.5 py-0.5 font-mono text-[0.45rem] uppercase tracking-[0.1em] text-[#65716b]">
            Approved
          </span>
        </div>

        <h2 className="mt-3 max-w-md font-display text-2xl leading-tight">
          Provider API keys are encrypted at rest with AES-256-GCM.
        </h2>
        <p className="mt-2 max-w-md text-xs leading-relaxed text-[#65716b]">
          The implementation is materially better than plaintext. The master-key lifecycle is
          still an open question for the deal team.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            ['Evidence', '4'],
            ['Approvals', '1'],
            ['Debt', '24'],
          ].map(([label, value]) => (
            <div key={label} className="border border-[#e3eae6] p-2">
              <p className="font-mono text-[0.45rem] uppercase tracking-[0.1em] text-[#7d8983]">
                {label}
              </p>
              <p className="mt-1 text-lg leading-none">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 border-l-2 border-[#0f5b43] pl-3">
          <p className="font-mono text-[0.45rem] uppercase tracking-[0.1em] text-[#7d8983]">
            Source coordinate
          </p>
          <p className="mt-1 font-mono text-[0.58rem] text-[#101714]">src/lib/crypto.ts</p>
          <p className="mt-1 text-[0.65rem] leading-relaxed text-[#65716b]">
            “AES-256-GCM with random salt and IV; versioned ciphertext format.”
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#e3eae6] pt-3 font-mono text-[0.48rem] uppercase tracking-[0.08em] text-[#7d8983]">
          <span>Owner · Asha Rao</span>
          <span>Hash · e8706d4f…</span>
        </div>
      </div>
    </div>
  )
}

const SURFACES = [
  {
    number: '01',
    title: 'Decision record',
    body: 'The choice, the owner, the deal impact, the status, and the reasoning that belongs in the data room.',
    detail: 'Question · owner · impact · status',
  },
  {
    number: '02',
    title: 'Evidence ledger',
    body: 'Every claim carries a source path, commit, quote, and where possible a SHA-256 hash. No unsourced confidence.',
    detail: 'Path · commit · quote · hash',
  },
  {
    number: '03',
    title: 'Approval trail',
    body: 'Who signed off, on which snapshot, and against which evidence. The trail survives personnel changes.',
    detail: 'Reviewer · snapshot · status',
  },
  {
    number: '04',
    title: 'Diligence dossier',
    body: 'A versioned, shareable record of what the workspace contains at a point in time — including what remains unresolved.',
    detail: 'Version · share link · expiry',
  },
]

const STEPS = [
  ['Ingest', 'Repository, docs, tickets, and architecture notes.'],
  ['Extract', 'Find the decisions already embedded in the code.'],
  ['Attach', 'Link each claim to a source coordinate and hash.'],
  ['Review', 'Pressure-test the reasoning in a review room.'],
  ['Publish', 'Generate a dossier that can travel without the chat.'],
]

export default function ProductPage() {
  return (
    <div>
      <section className="home-hero relative overflow-hidden border-b border-line">
        <div className="relative mx-auto grid max-w-[88rem] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14 lg:px-10 lg:py-24">
          <div className="rise">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-accent">
              The product
            </p>
            <h1 className="mt-5 max-w-xl text-[3.3rem] leading-[0.94] tracking-[-0.045em] text-text sm:text-7xl">
              The decision record is the product.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted">
              Tarka Sabha gives a technical diligence team one place to capture what was decided,
              prove it with source evidence, record approvals, and publish a dossier an investment
              committee can read.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              <Link href="/workspaces">
                <Button variant="primary" size="lg">
                  Open a workspace
                </Button>
              </Link>
              <Link href="/diligence">
                <Button variant="secondary" size="lg">
                  Read the sample dossier
                </Button>
              </Link>
            </div>
            <p className="mt-8 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-subtle">
              Private by default · BYOK · Expiring shares
            </p>
          </div>

          <div className="rise mt-2 lg:mt-0" style={{ animationDelay: '120ms' }}>
            <RecordPreview />
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-[88rem] px-5 py-16 sm:px-8 lg:px-10">
          <Rule label="The four surfaces" className="mb-8" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SURFACES.map((surface) => (
              <Card key={surface.number} className="flex h-full flex-col">
                <p className="font-mono text-[0.62rem] text-accent">{surface.number}</p>
                <h2 className="mt-5 font-display text-2xl text-text">{surface.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{surface.body}</p>
                <p className="mt-5 border-t border-line pt-3 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-subtle">
                  {surface.detail}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-bg">
        <div className="mx-auto grid max-w-[88rem] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16 lg:px-10">
          <div>
            <p className="eyebrow">Why a record</p>
            <h2 className="mt-4 max-w-md text-4xl leading-[1.02] text-text">
              A chat tells you what was discussed. A record tells you what was decided.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              The transcript is useful while the room is open. The decision, evidence, and
              approvals are what survive the meeting — and what a buyer or board actually needs.
            </p>
            <Link href="/diligence" className="mt-6 inline-block">
              <Button variant="secondary" size="sm">
                See the record →
              </Button>
            </Link>
          </div>

          <Card flush className="overflow-hidden self-start">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line font-mono text-[0.6rem] uppercase tracking-[0.14em] text-subtle">
                    <th className="px-5 py-3 font-normal">Chat log</th>
                    <th className="px-5 py-3 font-normal">Decision record</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Lives in a thread', 'Lives in a workspace'],
                    ['Says what was discussed', 'Records what was decided'],
                    ['No evidence coordinates', 'Path, commit, quote, and hash'],
                    ['Ends when the room closes', 'Survives as a versioned dossier'],
                    ['The loudest voice wins', 'The record names the owner and approval'],
                  ].map(([chat, record]) => (
                    <tr key={chat} className="border-b border-line last:border-b-0">
                      <td className="px-5 py-4 text-sm text-subtle">{chat}</td>
                      <td className="px-5 py-4 text-sm text-text">{record}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-[88rem] px-5 py-16 sm:px-8 lg:px-10">
          <Rule label="From source to dossier" className="mb-8" />
          <div className="grid gap-3 md:grid-cols-5">
            {STEPS.map(([title, body], index) => (
              <div key={title} className="border border-line bg-bg p-5">
                <p className="font-mono text-[0.62rem] text-accent">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h2 className="mt-6 font-display text-xl text-text">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-bg">
        <div className="mx-auto grid max-w-[88rem] gap-6 px-5 py-16 sm:px-8 lg:grid-cols-3 lg:px-10">
          {[
            {
              eyebrow: 'Technical M&A',
              title: 'Pre-sign diligence',
              body: 'Turn an engineering review into a source-backed record of what the target has chosen, where the evidence is thin, and what to ask before signing.',
            },
            {
              eyebrow: 'Portfolio operations',
              title: 'Post-close review',
              body: 'Keep revisit obligations, decision debt, and unresolved risks visible after the deal closes, when the original deal team has moved on.',
            },
            {
              eyebrow: 'Technical advisory',
              title: 'A shared evidence surface',
              body: 'Give operators, advisors, and investment teams one record to review — without forwarding a chat transcript or a folder of screenshots.',
            },
          ].map((item) => (
            <Card key={item.title} className="flex h-full flex-col">
              <p className="eyebrow">{item.eyebrow}</p>
              <h2 className="mt-4 font-display text-2xl text-text">{item.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{item.body}</p>
              <Link
                href="/teams"
                className="mt-5 inline-block font-mono text-xs text-accent transition-colors hover:text-accent-hover"
              >
                How we work together →
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-[88rem] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
          <div>
            <p className="eyebrow">Trust by default</p>
            <h2 className="mt-4 max-w-xl text-4xl leading-[1.02] text-text">
              Diligence material should not leak through its own tooling.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
              Workspaces are private. Provider keys are bring-your-own and encrypted before
              storage. Share links are hashed and expire. Reports and dossiers carry a content
              hash, so the record can be checked later.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Private by default', 'Access is scoped to workspace membership.'],
              ['BYOK', 'Keys are encrypted with AES-256-GCM.'],
              ['Hashed shares', 'Public links expire and are revocable.'],
              ['Readable limits', 'Every dossier states what it cannot prove.'],
            ].map(([title, body]) => (
              <div key={title} className="border border-line p-4">
                <p className="text-sm font-semibold text-text">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-bg">
        <div className="mx-auto flex max-w-[88rem] flex-col gap-6 px-5 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <p className="eyebrow">Next</p>
            <h2 className="mt-3 max-w-2xl text-3xl leading-tight text-text">
              Read the sample record, then bring a live deal.
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/diligence">
              <Button variant="primary" size="lg">
                Read the sample dossier
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
