import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, Rule } from '@/components/ui/Card'
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

      <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Decisions in inventory', value: '3' },
          { label: 'Fully analyzed', value: '1' },
          { label: 'Evidence items', value: '8' },
          { label: 'Open questions', value: '6' },
        ].map((stat) => (
          <Card key={stat.label} className="py-4">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-subtle">
              {stat.label}
            </p>
            <p className="mt-1 font-display text-2xl text-text">{stat.value}</p>
          </Card>
        ))}
      </div>

      <section className="mb-12">
        <Rule label="What the dossier answers" className="mb-6" />
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: 'What was decided',
              body: 'A ranked inventory of the architectural and operational choices already embedded in the code.',
            },
            {
              title: 'What proves it',
              body: 'Source paths, commits, quotes, and hashes tied to each finding. No unsourced claims.',
            },
            {
              title: 'What does not add up',
              body: 'Contradictions, unsupported claims, and residual risk called out separately from the evidence.',
            },
            {
              title: 'What to ask next',
              body: 'Diligence questions and requests that a buyer can put in the data room or send to management.',
            },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="font-display text-base text-text">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <Rule label="Decision inventory" className="mb-6" />
        <ul className="space-y-2">
          {INVENTORY.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[4px] border border-line bg-surface p-4"
            >
              <span className="font-mono text-xs text-accent">{item.id}</span>
              <span className="text-sm text-text">{item.title}</span>
              <span className="font-mono text-xs text-subtle">{item.area}</span>
              <span className="ml-auto flex items-center gap-2">
                <Badge tone={item.status === 'Verified' ? 'success' : 'outline'}>
                  {item.status}
                </Badge>
                <span className="font-mono text-xs text-subtle">{item.impact}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12">
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
