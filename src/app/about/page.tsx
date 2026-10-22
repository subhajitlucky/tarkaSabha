import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, Rule } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/EmptyState'

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
    <div className="mx-auto max-w-3xl px-5 py-14">
      <PageHeader
        eyebrow="About"
        title="Evidence, on the record"
        lede="Tarka Sabha is a decision evidence workspace for technical diligence. Frame the decision, attach the source, test the claim, and leave an approval trail that someone else can read."
      />

      <div className="space-y-10">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="text-2xl text-text">{section.heading}</h2>
            <p className="mt-3 leading-relaxed text-muted">{section.body}</p>
          </section>
        ))}
      </div>

      <Card className="mt-12">
        <Rule label="On honesty" className="mb-4" />
        <p className="text-sm leading-relaxed text-muted">
          The platform is built to show its working rather than to sound certain. Every
          decision carries a debt score and a rationale; every report carries a hash; every
          approval covers a named snapshot. Where the evidence is thin, the record should say
          so — not invent a conclusion.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/diligence">
            <Button variant="primary" size="sm">
              Read the sample dossier
            </Button>
          </Link>
          <Link href="/workspaces">
            <Button variant="secondary" size="sm">
              Open a workspace
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
