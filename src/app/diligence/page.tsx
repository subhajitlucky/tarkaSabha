import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, Rule } from '@/components/ui/Card'
import { BarList, DonutChart, MetricCard } from '@/components/ui/DataViz'
import { PageHeader } from '@/components/ui/EmptyState'

export const metadata: Metadata = {
  title: 'Decision diligence for technical M&A — Tarka Sabha',
  description:
    'A source-backed decision dossier for technical M&A: what the target decided, the evidence behind it, the open questions, and what remains unresolved before you sign.',
}

const INVENTORY = [
  {
    id: 'D-001',
    title: 'Encrypt provider API keys at rest with AES-256-GCM',
    area: 'Security',
    status: 'Verified',
    impact: 'Medium–High',
  },
  {
    id: 'D-002',
    title: 'Use deterministic round-robin speaker order',
    area: 'Product / reliability',
    status: 'Candidate',
    impact: 'Low–Medium',
  },
  {
    id: 'D-003',
    title: 'Run debates through a server-side runner with atomic claims',
    area: 'Reliability',
    status: 'Candidate',
    impact: 'Medium',
  },
]

const EVIDENCE = [
  {
    id: 'E-01',
    source: 'src/lib/crypto.ts',
    proof: 'AES-256-GCM with random salt and IV; versioned ciphertext format.',
  },
  {
    id: 'E-02',
    source: 'src/lib/crypto.ts',
    proof: 'Versioned and legacy decryption paths are both present.',
  },
  {
    id: 'E-03',
    source: 'src/app/api/providers/route.ts',
    proof: 'GET excludes the key and returns a placeholder.',
  },
  {
    id: 'E-04',
    source: 'src/app/api/providers/route.ts',
    proof: 'POST encrypts before storage and masks the response.',
  },
  {
    id: 'E-05',
    source: 'src/lib/llm-provider.ts',
    proof: 'Keys are decrypted only server-side before a provider call.',
  },
  {
    id: 'E-06',
    source: 'src/lib/__tests__/crypto.test.ts',
    proof: 'Round-trip, random ciphertext, legacy support, malformed input, and masking tests.',
  },
]

const OPEN_QUESTIONS = [
  'Where is ENCRYPTION_KEY stored in production, and who can read it?',
  'Is there a documented key-rotation procedure and a migration plan for legacy ciphertext?',
  'Are database backups encrypted, and who has access to them?',
  'Does the acquirer require KMS/HSM-backed or per-tenant keys?',
  'Is there an incident history for credential exposure?',
  'Are provider keys scoped or restricted on the provider side?',
]


const RISK_DECISIONS = [
  { id: 'D-001', title: 'Key encryption', row: 0, col: 2 },
  { id: 'D-003', title: 'Server-side runner', row: 1, col: 1 },
  { id: 'D-002', title: 'Speaker order', row: 2, col: 1 },
]

const RISK_ROWS = ['High impact', 'Medium impact', 'Low impact']
const RISK_COLS = ['Thin evidence', 'Partial evidence', 'Strong evidence']

function RiskMatrix() {
  return (
    <div>
      <div className="flex gap-3">
        <div className="flex w-16 shrink-0 flex-col justify-around pb-7 font-mono text-[0.52rem] uppercase tracking-[0.1em] text-subtle">
          <span>High</span>
          <span>Medium</span>
          <span>Low</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-3 overflow-hidden border-l border-t border-line">
            {RISK_ROWS.flatMap((row, rowIndex) =>
              RISK_COLS.map((col, colIndex) => {
                const items = RISK_DECISIONS.filter(
                  (decision) => decision.row === rowIndex && decision.col === colIndex
                )
                const isThinHighRisk = rowIndex === 0 && colIndex < 2
                const isManagedHighRisk = rowIndex === 0 && colIndex === 2
                return (
                  <div
                    key={`${row}-${col}`}
                    className={[
                      'min-h-[72px] border-b border-r border-line p-2',
                      isThinHighRisk
                        ? 'bg-danger-soft'
                        : isManagedHighRisk
                          ? 'bg-accent-soft'
                          : rowIndex === 2
                            ? 'bg-surface-2/50'
                            : 'bg-surface',
                    ].join(' ')}
                  >
                    <div className="flex flex-wrap gap-1">
                      {items.map((decision) => (
                        <span
                          key={decision.id}
                          title={decision.title}
                          className="border border-line bg-surface px-1.5 py-0.5 font-mono text-[0.55rem] text-text"
                        >
                          {decision.id}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[0.52rem] uppercase tracking-[0.1em] text-subtle">
            {RISK_COLS.map((col) => (
              <span key={col}>{col}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-4 text-[0.65rem] text-muted">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 bg-danger-soft ring-1 ring-danger/30" />
          High impact, thin evidence
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 bg-accent-soft ring-1 ring-accent/30" />
          High impact, strong evidence
        </span>
      </div>
    </div>
  )
}

export default function DiligencePage() {
  return (
    <div className="mx-auto max-w-[88rem] px-5 sm:px-8 lg:px-10 py-14">
      <PageHeader
        eyebrow="Decision diligence"
        title="Know what the code decided before you sign."
        lede="A decision diligence sprint turns a target’s technical decisions into a source-backed dossier: what was decided, the evidence behind it, what contradicts the story, and what is still unresolved."
        actions={
          <Link href="/diligence-sample.md" download>
            <Button variant="primary">Download sample dossier</Button>
          </Link>
        }
      />

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <Badge tone="accent">Public sample</Badge>
        <Badge tone="outline">Tarka Sabha repository</Badge>
        <Badge tone="outline">Snapshot ebee93f</Badge>
        <Badge tone="outline">No customer data</Badge>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Decisions in inventory"
          value="3"
          detail="2 candidates · 1 verified"
        />
        <MetricCard
          label="Fully analyzed"
          value="1 / 3"
          detail="33% of the inventory"
        />
        <MetricCard
          label="Evidence items"
          value="8"
          detail="6 shown in the sample record"
        />
        <MetricCard
          label="Open questions"
          value="6"
          detail="Key custody, rotation, backups, scope"
        />
      </div>

      <section className="mb-12">
        <Rule label="Dossier snapshot" className="mb-6" />
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Decision coverage</p>
                <h2 className="mt-2 font-display text-2xl leading-tight text-text">
                  One decision is fully analyzed.
                </h2>
              </div>
              <Badge tone="outline">Sample</Badge>
            </div>

            <DonutChart
              className="mt-6"
              segments={[
                { label: 'Analyzed', value: 1, color: 'var(--accent)' },
                { label: 'Candidate', value: 2, color: 'var(--tone-3)' },
              ]}
              centerValue="3"
              centerLabel="decisions"
            />

            <div className="mt-6 space-y-3 border-t border-line pt-5">
              {[
                ['Evidence items', '8'],
                ['Open questions', '6'],
                ['Fully analyzed', '1 of 3'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted">{label}</span>
                  <span className="font-mono text-xs text-text">{value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Decision risk map</p>
                <h2 className="mt-2 font-display text-2xl leading-tight text-text">
                  Where the evidence is thin
                </h2>
              </div>
              <Badge tone="outline">Deal impact × evidence</Badge>
            </div>
            <div className="mt-6">
              <RiskMatrix />
            </div>
          </Card>
        </div>
      </section>

      <section className="mb-12">
        <Rule label="Diligence sprint" className="mb-6" />
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ['01', 'Ingest', '8 source files', 'Repository, docs, tickets, and architecture notes.'],
            ['02', 'Extract', '3 decisions', 'Find the choices already embedded in the code.'],
            ['03', 'Verify', '8 evidence items', 'Tie each claim to a path, quote, and hash.'],
            ['04', 'Publish', 'v1 dossier', 'Package the record with open questions attached.'],
          ].map(([number, title, metric, body]) => (
            <Card key={number} className="flex h-full flex-col">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[0.62rem] text-accent">{number}</span>
                <span className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-subtle">
                  {metric}
                </span>
              </div>
              <h2 className="mt-5 font-display text-xl text-text">{title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <Rule label="What the dossier answers" className="mb-6" />
        <Card flush className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line font-mono text-[0.6rem] uppercase tracking-[0.14em] text-subtle">
                  <th className="px-5 py-3 font-normal">Question</th>
                  <th className="px-4 py-3 font-normal">What the dossier gives you</th>
                  <th className="px-5 py-3 font-normal">Sample output</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['What was decided', 'A ranked inventory of the architectural and operational choices already embedded in the code.', '3 decisions'],
                  ['What proves it', 'Source paths, commits, quotes, and hashes tied to each finding. No unsourced claims.', '8 evidence items'],
                  ['What does not add up', 'Contradictions, unsupported claims, and residual risk called out separately from the evidence.', '2 residual risks'],
                  ['What to ask next', 'Diligence questions and requests a buyer can put in the data room or send to management.', '6 questions'],
                ].map(([question, answer, output]) => (
                  <tr key={question} className="border-b border-line last:border-b-0">
                    <td className="px-5 py-4 text-sm font-semibold text-text">{question}</td>
                    <td className="px-4 py-4 text-sm leading-relaxed text-muted">{answer}</td>
                    <td className="px-5 py-4 font-mono text-xs text-accent">{output}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section className="mb-12">
        <Rule label="Decision inventory" className="mb-6" />
        <Card flush className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line font-mono text-[0.6rem] uppercase tracking-[0.14em] text-subtle">
                  <th className="px-5 py-3 font-normal">ID</th>
                  <th className="px-4 py-3 font-normal">Decision</th>
                  <th className="px-4 py-3 font-normal">Area</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-5 py-3 font-normal text-right">Impact</th>
                </tr>
              </thead>
              <tbody>
                {INVENTORY.map((item) => (
                  <tr key={item.id} className="border-b border-line last:border-b-0">
                    <td className="px-5 py-4 font-mono text-xs text-accent">{item.id}</td>
                    <td className="px-4 py-4 text-sm text-text">{item.title}</td>
                    <td className="px-4 py-4 font-mono text-xs text-subtle">{item.area}</td>
                    <td className="px-4 py-4">
                      <Badge tone={item.status === 'Verified' ? 'success' : 'outline'}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-xs text-subtle">
                      {item.impact}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section id="decision-d-001" className="mb-12 scroll-mt-24">
        <Rule label="Sample decision record — D-001" className="mb-6" />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="space-y-5">
            <div>
              <p className="eyebrow">Finding</p>
              <h2 className="mt-2 font-display text-2xl leading-tight text-text">
                Provider API keys are encrypted at rest with AES-256-GCM.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Keys are encrypted before storage, masked in API responses, and decrypted only
                server-side before a provider call. The control is materially better than
                plaintext, but the master-key lifecycle is not visible in the repository.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="eyebrow">Deal impact</p>
                <p className="mt-1 text-sm text-text">Medium–High</p>
              </div>
              <div>
                <p className="eyebrow">Confidence</p>
                <p className="mt-1 text-sm text-text">
                  High for implementation; Medium for production custody
                </p>
              </div>
            </div>

            <div>
              <p className="eyebrow">Recommended diligence question</p>
              <blockquote className="mt-2 border-l-2 border-accent-line pl-3 text-sm leading-relaxed text-text">
                Where is ENCRYPTION_KEY stored, who can read it, and how would the target rotate
                it without re-encrypting every provider record?
              </blockquote>
            </div>

            <div>
              <p className="eyebrow">Residual risk</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                A single environment-based master key has no key ID or rotation mechanism. A
                master-key leak compromises every stored provider key; legacy ciphertext uses a
                weaker fixed-salt derivation.
              </p>
            </div>
          </Card>

          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow">Evidence</p>
              <span className="font-mono text-xs text-subtle">{EVIDENCE.length}</span>
            </div>
            <ul className="space-y-3">
              {EVIDENCE.map((item) => (
                <li key={item.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-accent">{item.id}</span>
                    <span className="break-all font-mono text-xs text-muted">{item.source}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{item.proof}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="mb-12">
        <Rule label="What remains unresolved" className="mb-6" />
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <h2 className="font-display text-xl text-text">Six questions the buyer should ask</h2>
            <ol className="mt-4 space-y-3">
              {OPEN_QUESTIONS.map((question, index) => (
                <li key={question} className="flex gap-3 text-sm leading-relaxed text-muted">
                  <span className="font-mono text-xs text-accent">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>{question}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="space-y-6">
            <Card>
              <p className="eyebrow">Question themes</p>
              <h2 className="mt-2 font-display text-xl text-text">Where diligence is thin</h2>
              <BarList
                className="mt-5"
                items={[
                  { label: 'Key custody', value: 2, meta: '2 questions' },
                  { label: 'Rotation', value: 1, meta: '1 question' },
                  { label: 'Backups', value: 1, meta: '1 question' },
                  { label: 'Incident history', value: 1, meta: '1 question' },
                  { label: 'Provider scope', value: 1, meta: '1 question' },
                ]}
              />
            </Card>

            <Card className="space-y-3">
              <p className="eyebrow">Method and limits</p>
              <p className="text-sm leading-relaxed text-muted">
                Static review of the public repository at commit <code className="font-mono text-xs">ebee93f</code>.
                It does not prove runtime behavior, key custody, backup encryption, or production
                configuration. It is a sample of the artifact, not a full diligence engagement.
              </p>
              <p className="text-sm leading-relaxed text-muted">
                No customer data, personal data, or real credentials are included. A real dossier
                would remove secrets, PII, and customer identifiers before sharing.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-t border-line pt-10">
        <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="max-w-xl text-3xl leading-tight text-text sm:text-4xl">
              Bring the evidence pack to the next deal.
              <span className="text-accent"> Not just a code review.</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
              Design-partner diligence sprints are scoped per deal. Start with the sample, then
              tell us what you need to know before signing.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/feedback">
              <Button variant="primary" size="lg">
                Request a sprint
              </Button>
            </Link>
            <Link href="/diligence-sample.md" download>
              <Button variant="secondary" size="lg">
                Download sample
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
