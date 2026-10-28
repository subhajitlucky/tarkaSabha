import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { buttonClasses } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DonutChart } from '@/components/ui/DataViz'
import { cx } from '@/components/ui/cx'
import { DiligenceNav } from '@/components/diligence/DiligenceNav'

export const metadata: Metadata = {
  title: 'Decision diligence for technical M&A — Tarka Sabha',
  description:
    'Read a complete sample decision dossier: three decisions, eight source-backed evidence items, six open questions, and the limits of the review. A public sample with no customer data.',
  alternates: { canonical: '/diligence' },
  openGraph: {
    type: 'article',
    title: 'Sample decision dossier — Tarka Sabha',
    description:
      'What the code decided, what proves it, and what remains unresolved. A source-backed diligence dossier built from a public repository at one commit.',
    url: '/diligence',
  },
}

const SNAPSHOT = {
  short: 'ebee93f',
  full: 'ebee93f5f842ecc3c293ed960a38b850a4f1e04c',
  date: '20 October 2026',
}

type InventoryItem = {
  id: string
  title: string
  area: string
  status: 'Verified' | 'Candidate'
  statusTone: 'success' | 'warning'
  impact: string
  evidence: string
  summary: string
  href: string | null
}

const INVENTORY: InventoryItem[] = [
  {
    id: 'D-001',
    title: 'Encrypt provider API keys at rest with AES-256-GCM',
    area: 'Security',
    status: 'Verified',
    statusTone: 'success',
    impact: 'Medium–High',
    evidence: 'E-01–E-06',
    summary:
      'Reversible, authenticated encryption; masked in responses; decrypted only server-side.',
    href: '#d-001',
  },
  {
    id: 'D-002',
    title: 'Use deterministic round-robin speaker order',
    area: 'Product / reliability',
    status: 'Candidate',
    statusTone: 'warning',
    impact: 'Low–Medium',
    evidence: '—',
    summary:
      'Listed to show the inventory format. Not analyzed in this sample.',
    href: null,
  },
  {
    id: 'D-003',
    title: 'Run debates through a server-side runner with atomic claims',
    area: 'Reliability',
    status: 'Candidate',
    statusTone: 'warning',
    impact: 'Medium',
    evidence: '—',
    summary:
      'Listed to show the inventory format. Not analyzed in this sample.',
    href: null,
  },
]

type EvidenceItem = {
  id: string
  source: string
  lines: string
  proof: string
  hashLabel: string
  hashTitle?: string
}

const EVIDENCE: EvidenceItem[] = [
  {
    id: 'E-01',
    source: 'src/lib/crypto.ts',
    lines: 'L31–L36, L60–L78',
    proof: 'AES-256-GCM; random salt and IV; versioned ciphertext format.',
    hashLabel: 'a5694781…',
    hashTitle:
      'a569478146f79df6f18dbc53688af8d6dd266fcb73b7f2c7d2292c921ce197b9',
  },
  {
    id: 'E-02',
    source: 'src/lib/crypto.ts',
    lines: 'L84–L108',
    proof: 'Versioned and legacy decryption paths are both present.',
    hashLabel: 'same file as E-01',
  },
  {
    id: 'E-03',
    source: 'src/app/api/providers/route.ts',
    lines: 'L48–L56',
    proof: 'GET excludes apiKey and returns a placeholder.',
    hashLabel: 'f08cce81…',
    hashTitle:
      'f08cce81b2bdacf564177c4c7b8b272a940f555d93fca81f7b7904963280a63a',
  },
  {
    id: 'E-04',
    source: 'src/app/api/providers/route.ts',
    lines: 'L120–L121, L147–L149',
    proof: 'POST encrypts before storage and masks the response.',
    hashLabel: 'same file as E-03',
  },
  {
    id: 'E-05',
    source: 'src/lib/llm-provider.ts',
    lines: 'L944–L960',
    proof: 'Keys are decrypted only server-side before a provider call.',
    hashLabel: '69d2cc33…',
    hashTitle:
      '69d2cc3384323c21dd711bd444a92fc057d1b5d81c6f421a9cc19c88e6903920',
  },
  {
    id: 'E-06',
    source: 'src/lib/__tests__/crypto.test.ts',
    lines: 'L19–L55',
    proof:
      'Round-trip, random ciphertext, legacy support, malformed input, and masking tests.',
    hashLabel: 'cc52878c…',
    hashTitle:
      'cc52878cbe31a1e364945e3d4fb500519a7eab8dece0c4b84ee6b69fb86a3272',
  },
  {
    id: 'E-07',
    source: 'README.md',
    lines: 'L191–L198',
    proof:
      'Public security claim: keys are encrypted before storage and masked when displayed.',
    hashLabel: '430f77fe…',
    hashTitle:
      '430f77fe7ec11a6255ca179c5008cb9ea958e219de6a6fbf371fbe099437029e',
  },
  {
    id: 'E-08',
    source: 'prisma/schema.prisma',
    lines: 'L72–L88',
    proof:
      'Provider.apiKey is a string field; the application stores ciphertext there.',
    hashLabel: '23539b24…',
    hashTitle:
      '23539b2490e254ef89567d9c973d42b96111e75e0eca5a5ab667c21e428b8a5a',
  },
]

const OPTIONS = [
  {
    name: 'Plaintext storage',
    why: 'Simplest implementation. Rejected because a database leak exposes every key.',
    outcome: 'Rejected',
    tone: 'neutral' as const,
  },
  {
    name: 'One-way hash',
    why: 'Protects the secret. Rejected because the server must recover the key to call the provider.',
    outcome: 'Rejected',
    tone: 'neutral' as const,
  },
  {
    name: 'Application-level AES-256-GCM',
    why: 'Reversible, authenticated encryption with no external dependency.',
    outcome: 'Chosen',
    tone: 'success' as const,
  },
  {
    name: 'KMS / envelope encryption',
    why: 'Stronger key custody and rotation. Not implemented; this is the residual gap.',
    outcome: 'Not implemented',
    tone: 'warning' as const,
  },
]

const DECISION_PARAMETERS = [
  ['Salt', 'Random 16 bytes, generated per encryption'],
  ['Key derivation', 'scrypt(masterKey, salt) → 32-byte key'],
  ['IV', 'Random 16 bytes, generated per encryption'],
  ['Key source', 'ENCRYPTION_KEY, at least 32 characters'],
]

const TRAIL = [
  ['0ae89cf', 'Original implementation', '28 Dec 2025'],
  ['103aa15', 'Key-handling refactor', '4 Jan 2026'],
  ['e68477a', 'Security hardening', '11 Oct 2026'],
  ['ebee93f', 'Snapshot reviewed', '20 Oct 2026'],
]

const CLAIMS = [
  {
    claim: '“API keys are encrypted before storage.”',
    where: 'README.md L193',
    verified: true,
    note: 'Code encrypts before prisma.provider.create.',
  },
  {
    claim: '“Masked when displayed.”',
    where: 'README.md L193',
    verified: true,
    note: 'GET returns a placeholder; POST masks the stored value.',
  },
  {
    claim: '“Provider calls stay server-side.”',
    where: 'README.md L194',
    verified: true,
    note: 'getLLMResponse runs server-side; no client provider call found in scope.',
  },
  {
    claim: 'Key rotation is supported.',
    where: 'Not claimed',
    verified: false,
    note: 'No key ID or rotation path found.',
  },
]

const RESIDUAL_RISKS = [
  {
    title: 'Single master key, no key ID or rotation',
    body: 'ENCRYPTION_KEY is one environment value. There is no key version in the ciphertext, no KMS/HSM integration, and no rotation procedure. Rotating the key would require decrypting and re-encrypting every record.',
  },
  {
    title: 'Legacy ciphertext remains decryptable',
    body: 'The legacy format derives the key with a fixed salt ("salt"), which is weaker than the per-record salt in v2. Supporting it is reasonable for migration, but the migration end date is not documented.',
  },
  {
    title: 'Build-time dummy key',
    body: 'getEncryptionKey() returns a fixed placeholder during the Next.js production build if ENCRYPTION_KEY is missing. Runtime calls fail closed, but a build can succeed without the production key. This is an operational footgun, not a plaintext leak.',
  },
  {
    title: 'POST response masks ciphertext',
    body: 'cryptoService.maskKey(newProvider.apiKey) is applied to the encrypted value, so the last four characters are ciphertext, not the plaintext key. This is not a leak, but the response semantics are misleading.',
  },
  {
    title: 'Database and backup access',
    body: 'The control protects against a database dump that contains only ciphertext. It does not protect against an attacker who obtains both the database and the master key. Backup encryption and key custody sit outside the repository.',
  },
]

const DILIGENCE_REQUESTS = [
  {
    priority: 'High',
    tone: 'danger' as const,
    question: 'Where is the master key stored?',
    why: 'A database dump plus the key defeats the control.',
    request: 'KMS / config inventory, IAM policy',
  },
  {
    priority: 'High',
    tone: 'danger' as const,
    question: 'Is there a rotation plan?',
    why: 'The ciphertext has no key ID.',
    request: 'Runbook, migration plan',
  },
  {
    priority: 'Medium',
    tone: 'warning' as const,
    question: 'Are backups encrypted?',
    why: 'Backups are a common leak path.',
    request: 'Backup policy, access list',
  },
  {
    priority: 'Medium',
    tone: 'warning' as const,
    question: 'Is legacy ciphertext still active?',
    why: 'The fixed-salt legacy format is weaker.',
    request: 'Migration status, record counts',
  },
  {
    priority: 'Low',
    tone: 'neutral' as const,
    question: 'Why does POST mask ciphertext?',
    why: 'The response semantics are confusing.',
    request: 'Confirm client expectations',
  },
]

const ALSO_ASK = [
  'Is there an incident history for credential exposure?',
  'Are provider keys scoped or restricted at the provider side?',
]

const REVISIT = [
  'A key-rotation requirement from a customer or auditor.',
  'A move to KMS/HSM or per-tenant keys.',
  'A provider-key incident.',
  'A new provider that needs a different credential shape.',
  'A compliance requirement for key-custody evidence.',
]

const IN_SCOPE = [
  'src/lib/crypto.ts',
  'src/app/api/providers/route.ts',
  'src/lib/llm-provider.ts',
  'src/lib/__tests__/crypto.test.ts',
  'prisma/schema.prisma',
  'README.md',
]

const OUT_OF_SCOPE = [
  'Runtime infrastructure',
  'Production key management',
  'Database backups and access controls',
  'Cloud IAM',
  'Provider-side logging',
  'Incident history',
  'Customer interviews',
]

const METHOD = [
  'Static review of the public repository at one commit.',
  'Read the crypto module, provider route, provider adapter, tests, schema, and README.',
  'Checked Git history for the original implementation and later hardening.',
  'Did not execute the application.',
  'Did not access production infrastructure, databases, or backups.',
  'Did not interview the founder. Used no customer data.',
]

const REDACTION = [
  'No personal data, customer names, or proprietary code is included.',
  'A real dossier would remove secrets, PII, and customer identifiers before sharing.',
  'Share links should expire after seven days, be watermarked, and log access.',
]

const STATS = [
  {
    value: '03',
    label: 'Decisions in inventory',
    detail: '2 candidates · 1 verified',
  },
  {
    value: '1 / 3',
    label: 'Fully analyzed',
    detail: 'D-001 has a complete record',
  },
  {
    value: '08',
    label: 'Evidence items',
    detail: 'Pinned to snapshot ebee93f',
  },
  {
    value: '06',
    label: 'Open questions',
    detail: '5 carry a document request',
  },
]

const RISK_DECISIONS = [
  { id: 'D-001', short: 'Key encryption', row: 0, col: 2 },
  { id: 'D-003', short: 'Server runner', row: 1, col: 0 },
  { id: 'D-002', short: 'Speaker order', row: 2, col: 0 },
]

const RISK_ROWS = ['High', 'Medium', 'Low']
const RISK_COLS = ['Thin evidence', 'Partial evidence', 'Strong evidence']

function LockIcon() {
  return (
    <svg
      className="mt-0.5 h-3.5 w-3.5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function SectionHeading({
  number,
  eyebrow,
  title,
  description,
  meta,
}: {
  number: string
  eyebrow: string
  title: string
  description?: string
  meta?: string
}) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4 sm:mb-9">
      <div className="max-w-3xl">
        <p className="flex items-center gap-3 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-subtle">
          <span className="text-accent">{number}</span>
          <span aria-hidden="true" className="h-px w-7 bg-line-strong" />
          {eyebrow}
        </p>
        <h2 className="mt-4 max-w-2xl font-display text-[2rem] leading-[1.03] text-text sm:text-[2.6rem]">
          {title}
        </h2>
        {description && (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            {description}
          </p>
        )}
      </div>
      {meta && (
        <p className="shrink-0 pt-1 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-subtle">
          {meta}
        </p>
      )}
    </div>
  )
}

function CoverSheet() {
  return (
    <article className="border border-line border-t-2 border-t-accent bg-bg shadow-[var(--shadow-lift)]">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <span className="font-mono text-[0.56rem] uppercase tracking-[0.16em] text-subtle">
          Dossier / 001
        </span>
        <span className="font-mono text-[0.56rem] text-subtle">v0.1</span>
      </div>

      <div className="flex items-start justify-between gap-4 px-5 pb-5 pt-6 sm:px-6">
        <div>
          <p className="eyebrow">Decision dossier</p>
          <p className="mt-2 font-display text-[1.7rem] leading-tight text-text sm:text-[1.9rem]">
            Provider-credential security
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            A static review of decisions already embedded in the code.
          </p>
        </div>
        <span className="mt-1 shrink-0 -rotate-3 border-2 border-accent/50 px-2.5 py-1 font-mono text-[0.54rem] font-bold uppercase tracking-[0.18em] text-accent">
          Sample
        </span>
      </div>

      <dl className="mx-5 grid grid-cols-2 gap-x-4 gap-y-4 border-y border-line py-5 sm:mx-6">
        <div className="col-span-2">
          <dt className="font-mono text-[0.54rem] uppercase tracking-[0.12em] text-subtle">
            Target
          </dt>
          <dd className="mt-1 break-all font-mono text-[0.66rem] leading-relaxed text-text">
            github.com/subhajitlucky/tarkaSabha
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[0.54rem] uppercase tracking-[0.12em] text-subtle">
            Snapshot
          </dt>
          <dd
            className="mt-1 font-mono text-xs text-text"
            title={SNAPSHOT.full}
          >
            {SNAPSHOT.short}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[0.54rem] uppercase tracking-[0.12em] text-subtle">
            Reviewed
          </dt>
          <dd className="mt-1 text-xs text-text">21 Oct 2026</dd>
        </div>
        <div>
          <dt className="font-mono text-[0.54rem] uppercase tracking-[0.12em] text-subtle">
            Scope
          </dt>
          <dd className="mt-1 text-xs text-text">Provider credentials</dd>
        </div>
        <div>
          <dt className="font-mono text-[0.54rem] uppercase tracking-[0.12em] text-subtle">
            Artifact
          </dt>
          <dd className="mt-1 text-xs text-text">Sample self-audit</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 sm:px-6">
        <span className="flex items-center gap-2 font-mono text-[0.56rem] uppercase tracking-[0.1em] text-text">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-success"
          />
          1 of 3 analyzed
        </span>
        <span className="font-mono text-[0.56rem] text-subtle">
          8 evidence items
        </span>
      </div>
    </article>
  )
}

function Fact({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-text">{value}</dd>
      {detail && (
        <dd className="mt-1 text-xs leading-relaxed text-subtle">{detail}</dd>
      )}
    </div>
  )
}

function RecordBlock({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <section className="border-t border-line pt-6">
      <p className="eyebrow">{label}</p>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function RiskMatrix() {
  return (
    <figure>
      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">
          Decision risk map: deal impact by evidence strength.
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="w-12 border border-line bg-surface-2 p-1.5"
            >
              <span className="sr-only">Deal impact</span>
            </th>
            {RISK_COLS.map((col) => (
              <th
                key={col}
                scope="col"
                className="border border-line bg-surface-2 px-1.5 py-2 text-left font-mono text-[0.5rem] font-semibold uppercase leading-tight tracking-[0.08em] text-subtle sm:text-[0.56rem]"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RISK_ROWS.map((row, rowIndex) => (
            <tr key={row}>
              <th
                scope="row"
                className="border border-line bg-surface-2 px-1.5 py-2 text-left font-mono text-[0.5rem] font-semibold uppercase leading-tight tracking-[0.08em] text-subtle sm:text-[0.56rem]"
              >
                {row}
              </th>
              {RISK_COLS.map((col, colIndex) => {
                const items = RISK_DECISIONS.filter(
                  (decision) =>
                    decision.row === rowIndex && decision.col === colIndex
                )
                const tone =
                  rowIndex === 0 && colIndex < 2
                    ? 'risk-high'
                    : rowIndex === 0 && colIndex === 2
                      ? 'risk-managed'
                      : 'risk-neutral'

                return (
                  <td
                    key={col}
                    className={cx(
                      'h-[88px] border border-line p-1.5 align-top sm:h-[96px] sm:p-2',
                      tone
                    )}
                  >
                    <div className="flex flex-col items-start gap-1">
                      {items.map((decision) => (
                        <span
                          key={decision.id}
                          title={`${decision.id} — ${decision.short}`}
                          className="max-w-full border border-line bg-surface px-1 py-0.5 sm:px-1.5 sm:py-1"
                        >
                          <span className="block font-mono text-[0.52rem] font-semibold text-accent">
                            {decision.id}
                          </span>
                          <span className="mt-0.5 hidden truncate text-[0.58rem] leading-tight text-text sm:block">
                            {decision.short}
                          </span>
                        </span>
                      ))}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.65rem] text-muted">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 risk-high ring-1 ring-danger/30" />
          High impact, thin evidence
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 risk-managed ring-1 ring-accent/30" />
          High impact, strong evidence
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 risk-neutral ring-1 ring-line-strong" />
          Candidate, no evidence attached
        </span>
      </figcaption>
    </figure>
  )
}

function ScopeList({
  label,
  count,
  children,
}: {
  label: string
  count: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
        <p className="eyebrow">{label}</p>
        <span className="font-mono text-[0.56rem] text-subtle">{count}</span>
      </div>
      <ul className="mt-3 space-y-2.5">{children}</ul>
    </div>
  )
}

export default function DiligencePage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage:
              'radial-gradient(ellipse 90% 80% at 78% 8%, black, transparent 72%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 90% 80% at 78% 8%, black, transparent 72%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-44 h-[32rem] w-[32rem] rounded-full bg-accent-soft blur-3xl"
        />

        <div className="relative mx-auto max-w-[88rem] px-5 py-10 sm:px-8 lg:px-10 lg:py-16">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <p className="flex items-center gap-2 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-subtle">
              <span aria-hidden="true" className="h-1.5 w-1.5 bg-accent" />
              Tarka Sabha
              <span aria-hidden="true" className="text-line-strong">
                /
              </span>
              Diligence
              <span aria-hidden="true" className="text-line-strong">
                /
              </span>
              Sample 01
            </p>
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-subtle">
              Public artifact · No customer data
            </p>
          </div>

          <div className="grid gap-10 pt-9 lg:grid-cols-[1.12fr_0.88fr] lg:items-start lg:gap-14 lg:pt-14">
            <div className="rise">
              <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-accent">
                Decision diligence · Public sample dossier
              </p>
              <h1 className="mt-5 max-w-2xl text-balance text-[2.9rem] leading-[0.96] text-text sm:text-6xl lg:text-[4.7rem]">
                Know what the code decided{' '}
                <span className="text-accent">before you sign.</span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
                A source-backed dossier of what the target decided, what proves
                it, and what remains unresolved — read from a public repository
                at a single commit.
              </p>

              <div className="hero-actions mt-8">
                <a
                  href="/diligence-sample.md"
                  download
                  className={buttonClasses({
                    variant: 'primary',
                    size: 'lg',
                    className: 'hero-action',
                  })}
                >
                  Download sample dossier
                </a>
                <a
                  href="#d-001"
                  className={buttonClasses({
                    variant: 'secondary',
                    size: 'lg',
                    className: 'hero-action',
                  })}
                >
                  Read decision D-001
                  <span aria-hidden="true">↓</span>
                </a>
              </div>

              <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-subtle">
                <LockIcon />
                <span>
                  Sample self-audit. No customer data, personal data, or real
                  credentials are included.
                </span>
              </p>
            </div>

            <div className="rise" style={{ animationDelay: '120ms' }}>
              <CoverSheet />
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line sm:grid-cols-4 lg:mt-14">
            {STATS.map((stat) => (
              <div key={stat.label} className="bg-surface px-4 py-5 sm:px-5">
                <p className="font-display text-3xl leading-none text-text sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-2 font-mono text-[0.56rem] uppercase tracking-[0.14em] text-subtle">
                  {stat.label}
                </p>
                <p className="mt-1 text-[0.7rem] leading-relaxed text-muted">
                  {stat.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DiligenceNav />

      <section id="brief" className="scroll-mt-32 border-b border-line bg-bg">
        <div className="mx-auto max-w-[88rem] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <SectionHeading
            number="01"
            eyebrow="Executive brief"
            title="The control is real. The key lifecycle is the gap."
            meta="D-001 · Verified"
          />

          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <p className="font-display text-2xl leading-snug text-text sm:text-[1.75rem]">
              Provider API keys are encrypted before storage, masked in API
              responses, and decrypted only server-side before a provider call.
            </p>
            <div>
              <p className="text-sm leading-relaxed text-muted">
                That is materially better than plaintext. A plaintext store
                would expose every customer’s provider account and potentially
                their data.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                The control is supported by code, tests, and a checked README
                claim. The gap is the master-key lifecycle: where the key lives,
                who can read it, and how it rotates is not visible in the
                repository.
              </p>
              <div className="mt-6 border-l-2 border-accent-line pl-4">
                <p className="eyebrow">What a buyer should do</p>
                <p className="mt-2 text-sm leading-relaxed text-text">
                  Ask for key-custody and rotation evidence. Consider a
                  reps/warranty on key management, and an integration question if
                  the acquirer requires KMS/HSM-backed keys.
                </p>
                <a
                  href="#d-001"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-accent transition-opacity hover:opacity-80"
                >
                  Read the D-001 record
                  <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-line py-4 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-subtle">
            <span>08 evidence items</span>
            <span aria-hidden="true" className="text-line-strong">
              →
            </span>
            <span>04 claims checked</span>
            <span aria-hidden="true" className="text-line-strong">
              →
            </span>
            <span className="text-warning">01 unsupported claim</span>
            <span aria-hidden="true" className="text-line-strong">
              →
            </span>
            <span>05 document requests</span>
          </div>
        </div>
      </section>

      <section
        id="inventory"
        className="scroll-mt-32 border-b border-line bg-surface"
      >
        <div className="mx-auto max-w-[88rem] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <SectionHeading
            number="02"
            eyebrow="Decision inventory"
            title="Three decisions. One full record."
            description="The register ranks decisions by deal impact. Only D-001 is analyzed; D-002 and D-003 are candidates that demonstrate the inventory format."
            meta="1 verified · 2 candidates"
          />

          <div className="border-t border-line">
            {INVENTORY.map((decision) => (
              <article
                key={decision.id}
                className="grid grid-cols-[2.5rem_1fr] gap-x-3 gap-y-3 border-b border-line py-5 sm:grid-cols-[3rem_1fr_auto] sm:items-start"
              >
                <span className="pt-0.5 font-mono text-xs text-accent">
                  {decision.id}
                </span>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {decision.href ? (
                      <a
                        href={decision.href}
                        className="font-display text-xl leading-snug text-text transition-colors hover:text-accent sm:text-2xl"
                      >
                        {decision.title}
                      </a>
                    ) : (
                      <h3 className="font-display text-xl leading-snug text-text sm:text-2xl">
                        {decision.title}
                      </h3>
                    )}
                    <Badge tone={decision.statusTone}>{decision.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {decision.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-subtle">
                    <span>{decision.area}</span>
                    <span>Impact {decision.impact}</span>
                    <span>Evidence {decision.evidence}</span>
                  </div>
                </div>

                <div className="col-start-2 sm:col-start-3 sm:justify-self-end sm:text-right">
                  {decision.href ? (
                    <a
                      href={decision.href}
                      className="inline-flex items-center gap-2 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-text transition-colors hover:text-accent"
                    >
                      Open record
                      <span aria-hidden="true">→</span>
                    </a>
                  ) : (
                    <span className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-subtle">
                      Not analyzed
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-subtle">
            D-002 and D-003 are listed to show the inventory format. They are not
            analyzed in this sample.
          </p>

          <div className="mt-8 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <Card className="flex flex-col p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">Coverage</p>
                  <h3 className="mt-2 font-display text-2xl leading-tight text-text">
                    One record in full.
                  </h3>
                </div>
                <span className="font-display text-3xl leading-none text-accent">
                  1 / 3
                </span>
              </div>

              <DonutChart
                className="mt-6"
                segments={[
                  { label: 'Analyzed', value: 1, color: 'var(--chart-1)' },
                  { label: 'Candidate', value: 2, color: 'var(--chart-3)' },
                ]}
                centerValue="3"
                centerLabel="decisions"
              />

              <div className="mt-6 space-y-2 border-t border-line pt-4 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Core evidence for D-001</span>
                  <span className="font-mono text-text">6 items</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Supporting artifacts</span>
                  <span className="font-mono text-text">2 items</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">D-002 / D-003 evidence</span>
                  <span className="font-mono text-subtle">—</span>
                </div>
              </div>
              <p className="mt-auto pt-6 text-xs leading-relaxed text-subtle">
                Coverage measures analysis, not cleanliness. Two candidates have
                no evidence attached.
              </p>
            </Card>

            <Card className="flex flex-col p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">Exposure map</p>
                  <h3 className="mt-2 font-display text-2xl leading-tight text-text">
                    Where the evidence is thin
                  </h3>
                </div>
                <span className="font-mono text-[0.56rem] uppercase tracking-[0.1em] text-subtle">
                  Deal impact × evidence
                </span>
              </div>

              <div className="mt-5 flex-1">
                <RiskMatrix />
              </div>

              <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-subtle">
                D-002 and D-003 have no evidence attached. They sit in the
                thin-evidence column until analyzed.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section
        id="d-001"
        className="scroll-mt-32 border-b border-line bg-bg"
      >
        <div className="mx-auto max-w-[88rem] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <SectionHeading
            number="03"
            eyebrow="Decision record — D-001"
            title="One decision, read end to end."
            description="The choice, the implementation, and the options that were rejected — with the evidence attached."
            meta="Verified"
          />

          <article className="border border-line bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-2/60 px-5 py-3 sm:px-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold text-accent">
                  D-001
                </span>
                <Badge tone="success">Verified</Badge>
                <Badge tone="outline">Security</Badge>
                <Badge tone="warning">Medium–High impact</Badge>
              </div>
              <span className="font-mono text-[0.56rem] uppercase tracking-[0.12em] text-subtle">
                E-01 – E-06
              </span>
            </div>

            <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
              <div>
                <p className="eyebrow">Finding</p>
                <p className="mt-3 font-display text-[1.55rem] leading-snug text-text sm:text-[1.85rem]">
                  Provider API keys are encrypted before storage, masked in API
                  responses, and decrypted only server-side before a provider
                  call.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  A plaintext key store would expose every customer’s provider
                  account and potentially their data. The control is materially
                  better than plaintext, but the master-key lifecycle is not
                  visible in the repository.
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-5 border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                <Fact label="Deal impact" value="Medium–High" />
                <Fact
                  label="Confidence"
                  value="High / Medium"
                  detail="Implementation / production custody"
                />
                <Fact
                  label="Owner"
                  value="Founder / CTO"
                  detail="Self-approved in public repo"
                />
                <Fact
                  label="Snapshot"
                  value={SNAPSHOT.short}
                  detail="20 Oct 2026"
                />
              </dl>
            </div>

            <div className="grid border-t border-line lg:grid-cols-[1.4fr_0.6fr]">
              <div className="space-y-6 p-5 sm:p-7 lg:border-r lg:border-line">
                <RecordBlock label="Context">
                  <p className="text-sm leading-relaxed text-muted">
                    Tarka lets users bring their own LLM provider credentials.
                    The server stores those keys so it can make provider calls on
                    the user’s behalf. A plaintext store would expose paid
                    provider accounts, usage, and potentially customer content if
                    a key were abused.
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    The decision addresses credential confidentiality at rest,
                    safe display in the UI, server-side-only use, and backward
                    compatibility with earlier ciphertext.
                  </p>
                </RecordBlock>

                <RecordBlock label="Decision">
                  <p className="text-sm leading-relaxed text-muted">
                    Store provider keys encrypted with AES-256-GCM. New
                    ciphertext uses a versioned format:
                  </p>
                  <pre className="mt-3 overflow-x-auto border border-line bg-bg px-4 py-3 font-mono text-[0.7rem] leading-relaxed text-text">
                    <code>enc:v2:&lt;salt&gt;:&lt;iv&gt;:&lt;authTag&gt;:&lt;ciphertext&gt;</code>
                  </pre>

                  <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                    {DECISION_PARAMETERS.map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-[6px] border border-line bg-bg p-3"
                      >
                        <dt className="font-mono text-[0.54rem] uppercase tracking-[0.1em] text-subtle">
                          {label}
                        </dt>
                        <dd className="mt-1 text-xs leading-relaxed text-text">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <ul className="mt-5 space-y-2 text-sm leading-relaxed text-muted">
                    <li className="flex gap-2.5">
                      <span aria-hidden="true" className="text-accent">
                        ·
                      </span>
                      The authentication tag is stored with the ciphertext.
                    </li>
                    <li className="flex gap-2.5">
                      <span aria-hidden="true" className="text-accent">
                        ·
                      </span>
                      <span>
                        Legacy{' '}
                        <code className="font-mono text-[0.72rem]">
                          iv:authTag:ciphertext
                        </code>{' '}
                        values remain decryptable with a fixed-salt key.
                      </span>
                    </li>
                    <li className="flex gap-2.5">
                      <span aria-hidden="true" className="text-accent">
                        ·
                      </span>
                      API responses never return the plaintext key; reads use a
                      placeholder, and writes mask the stored value.
                    </li>
                  </ul>
                </RecordBlock>

                <RecordBlock label="Options considered">
                  <div className="overflow-hidden border border-line">
                    {OPTIONS.map((option) => (
                      <div
                        key={option.name}
                        className="grid gap-2 border-t border-line p-3 first:border-t-0 sm:grid-cols-[0.85fr_1.1fr_0.7fr] sm:items-center"
                      >
                        <p className="text-sm font-semibold text-text">
                          {option.name}
                        </p>
                        <p className="text-xs leading-relaxed text-muted">
                          {option.why}
                        </p>
                        <div className="sm:text-right">
                          <Badge tone={option.tone}>{option.outcome}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </RecordBlock>
              </div>

              <aside className="border-t border-line bg-surface-2/40 p-5 sm:p-7 lg:border-t-0">
                <div>
                  <p className="eyebrow">Recommended question</p>
                  <blockquote className="mt-3 border-l-2 border-accent pl-3 font-display text-xl leading-snug text-text">
                    Where is ENCRYPTION_KEY stored, who can read it, and how would
                    the target rotate it without re-encrypting every provider
                    record?
                  </blockquote>
                </div>

                <div className="mt-6 border-t border-line pt-5">
                  <p className="eyebrow">Suggested action</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Reps/warranty on key custody and rotation; integration
                    question if the acquirer requires KMS/HSM-backed keys.
                  </p>
                </div>

                <div className="mt-6 border-t border-line pt-5">
                  <p className="eyebrow">Record trail</p>
                  <ol className="mt-3 space-y-3">
                    {TRAIL.map(([commit, event, date]) => (
                      <li key={commit}>
                        <p className="font-mono text-[0.68rem] text-text">
                          {commit}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted">
                          {event}
                        </p>
                        <p className="mt-0.5 font-mono text-[0.54rem] uppercase tracking-[0.1em] text-subtle">
                          {date}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              </aside>
            </div>
          </article>
        </div>
      </section>

      <section
        id="evidence"
        className="scroll-mt-32 border-b border-line bg-surface"
      >
        <div className="mx-auto max-w-[88rem] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <SectionHeading
            number="04"
            eyebrow="Evidence ledger"
            title="Eight pieces of evidence. Every claim has coordinates."
            description="Six core items support D-001. Two supporting artifacts check the public claim and the storage shape. Each is tied to a file, a line range, and a SHA-256 hash at the snapshot commit."
            meta={`Pinned to ${SNAPSHOT.short}`}
          />

          <ol className="border-t border-line">
            {EVIDENCE.map((item) => (
              <li
                key={item.id}
                className="grid grid-cols-[2.5rem_1fr] gap-x-3 gap-y-2 border-b border-line py-4 lg:grid-cols-[2.5rem_1.05fr_1.35fr_9rem] lg:items-start"
              >
                <span className="pt-0.5 font-mono text-xs text-accent">
                  {item.id}
                </span>

                <div className="min-w-0">
                  <p className="break-all font-mono text-[0.7rem] leading-relaxed text-text">
                    {item.source}
                  </p>
                  <p className="mt-1 font-mono text-[0.56rem] uppercase tracking-[0.08em] text-subtle">
                    {item.lines} · {SNAPSHOT.short}
                  </p>
                </div>

                <p className="col-start-2 text-sm leading-relaxed text-muted lg:col-start-3">
                  {item.proof}
                </p>

                <div className="col-start-2 min-w-0 lg:col-start-4 lg:text-right">
                  <p className="hidden font-mono text-[0.52rem] uppercase tracking-[0.1em] text-subtle lg:block">
                    SHA-256
                  </p>
                  <p
                    className="break-all font-mono text-[0.58rem] leading-relaxed text-muted lg:mt-0.5"
                    title={item.hashTitle}
                  >
                    {item.hashLabel}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-4 text-xs leading-relaxed text-subtle">
            Evidence hashes are SHA-256 of the file at snapshot{' '}
            <span className="font-mono">{SNAPSHOT.short}</span>. Line numbers are
            from that snapshot.
          </p>

          <div className="mt-12 grid gap-8 lg:grid-cols-[0.4fr_0.6fr] lg:gap-14">
            <div>
              <p className="eyebrow">Claim check</p>
              <h3 className="mt-3 font-display text-2xl leading-tight text-text sm:text-3xl">
                What the README claims — and what the code shows.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                No contradiction with the README claim was found. The claim is
                supported by the code and tests.
              </p>
            </div>

            <div className="border-t border-line">
              {CLAIMS.map((item) => (
                <div
                  key={item.claim}
                  className="grid gap-2 border-b border-line py-4 sm:grid-cols-[1.3fr_auto] sm:items-start"
                >
                  <div>
                    <p className="text-sm font-semibold text-text">
                      {item.claim}
                    </p>
                    <p className="mt-1 font-mono text-[0.56rem] uppercase tracking-[0.1em] text-subtle">
                      {item.where}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      {item.note}
                    </p>
                  </div>
                  <Badge
                    tone={item.verified ? 'success' : 'warning'}
                    className="justify-self-start sm:justify-self-end"
                  >
                    {item.verified ? 'Verified' : 'Unsupported'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="questions"
        className="scroll-mt-32 border-b border-line bg-bg"
      >
        <div className="mx-auto max-w-[88rem] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <SectionHeading
            number="05"
            eyebrow="What remains unresolved"
            title="The honest list of what the code cannot prove."
            description="Residual risks stay attached to the record. The diligence requests turn each gap into a document a buyer can ask for."
            meta="5 risks · 6 questions"
          />

          <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:gap-14">
            <div>
              <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
                <p className="eyebrow">Residual risk register</p>
                <span className="font-mono text-[0.56rem] text-subtle">
                  05 items
                </span>
              </div>

              <ol>
                {RESIDUAL_RISKS.map((risk, index) => (
                  <li
                    key={risk.title}
                    className="grid grid-cols-[2rem_1fr] gap-3 border-b border-line py-4"
                  >
                    <span className="font-mono text-[0.6rem] text-subtle">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-text">
                        {risk.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">
                        {risk.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <aside className="space-y-4">
              <Card className="p-5">
                <p className="eyebrow">Request priority</p>
                <div className="mt-4 divide-y divide-line border-y border-line">
                  {[
                    ['High', '2', 'bg-danger'],
                    ['Medium', '2', 'bg-warning'],
                    ['Low', '1', 'bg-subtle'],
                  ].map(([label, count, color]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <span className="flex items-center gap-2 text-sm text-muted">
                        <span
                          aria-hidden="true"
                          className={cx('h-1.5 w-1.5', color)}
                        />
                        {label}
                      </span>
                      <span className="font-mono text-lg text-text">{count}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 font-mono text-[0.56rem] uppercase tracking-[0.12em] text-subtle">
                  5 requests · 6 questions
                </p>
              </Card>

              <Card className="p-5">
                <p className="eyebrow">Also on the question list</p>
                <ul className="mt-3 space-y-3">
                  {ALSO_ASK.map((question) => (
                    <li
                      key={question}
                      className="flex gap-2.5 text-sm leading-relaxed text-muted"
                    >
                      <span aria-hidden="true" className="text-accent">
                        ·
                      </span>
                      {question}
                    </li>
                  ))}
                </ul>
              </Card>
            </aside>
          </div>

          <div className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
              <div>
                <p className="eyebrow">Diligence requests</p>
                <h3 className="mt-2 font-display text-2xl leading-tight text-text sm:text-3xl">
                  Five requests for the data room.
                </h3>
              </div>
              <span className="font-mono text-[0.56rem] uppercase tracking-[0.12em] text-subtle">
                High → Low
              </span>
            </div>

            <ol>
              {DILIGENCE_REQUESTS.map((request, index) => (
                <li
                  key={request.question}
                  className="grid gap-3 border-b border-line py-4 md:grid-cols-[2rem_1.1fr_1fr_0.9fr] md:items-start"
                >
                  <span className="hidden pt-1 font-mono text-[0.6rem] text-subtle md:block">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <div className="flex flex-wrap items-start gap-2">
                    <Badge tone={request.tone}>{request.priority}</Badge>
                    <p className="min-w-0 flex-1 text-sm font-semibold leading-relaxed text-text">
                      {request.question}
                    </p>
                  </div>

                  <div>
                    <p className="eyebrow md:hidden">Why it matters</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted md:mt-0">
                      {request.why}
                    </p>
                  </div>

                  <div>
                    <p className="eyebrow md:hidden">Request</p>
                    <p className="mt-1 font-mono text-[0.62rem] leading-relaxed text-subtle md:mt-0 md:text-right">
                      {request.request}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-10 border-t border-line pt-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="eyebrow">Revisit D-001 when</p>
              <span className="font-mono text-[0.56rem] uppercase tracking-[0.12em] text-subtle">
                5 triggers
              </span>
            </div>
            <ul className="mt-4 grid gap-x-8 gap-y-2 text-sm leading-relaxed text-muted sm:grid-cols-2 lg:grid-cols-3">
              {REVISIT.map((trigger) => (
                <li key={trigger} className="flex gap-2.5">
                  <span aria-hidden="true" className="text-accent">
                    ·
                  </span>
                  {trigger}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section
        id="method"
        className="scroll-mt-32 border-b border-line bg-surface"
      >
        <div className="mx-auto max-w-[88rem] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <SectionHeading
            number="06"
            eyebrow="Method & limits"
            title="A static review. The limits are part of the record."
            description="The dossier is only useful if a buyer can see exactly what was reviewed, what was not, and how the evidence was pinned."
            meta={`Snapshot ${SNAPSHOT.short} · 21 Oct 2026`}
          />

          <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
            <ScopeList label="In scope" count="6 files + history">
              {IN_SCOPE.map((item) => (
                <li
                  key={item}
                  className="break-all font-mono text-[0.68rem] leading-relaxed text-muted"
                >
                  {item}
                </li>
              ))}
              <li className="text-sm leading-relaxed text-muted">
                Relevant Git history
              </li>
            </ScopeList>

            <ScopeList label="Out of scope" count="7 areas">
              {OUT_OF_SCOPE.map((item) => (
                <li
                  key={item}
                  className="flex gap-2.5 text-sm leading-relaxed text-muted"
                >
                  <span aria-hidden="true" className="text-subtle">
                    —
                  </span>
                  {item}
                </li>
              ))}
            </ScopeList>

            <div>
              <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
                <p className="eyebrow">Method</p>
                <span className="font-mono text-[0.56rem] text-subtle">
                  Static
                </span>
              </div>
              <ul className="mt-3 space-y-2.5">
                {METHOD.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2.5 text-sm leading-relaxed text-muted"
                  >
                    <span aria-hidden="true" className="text-accent">
                      ·
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 grid gap-3 border-y border-line bg-bg px-5 py-5 sm:grid-cols-[8rem_1fr] sm:items-start">
            <p className="eyebrow pt-0.5">Limitation</p>
            <p className="max-w-3xl text-sm leading-relaxed text-muted">
              This is a static review of a public repository at one commit. It
              does not prove runtime behavior, key custody, backup encryption, or
              production configuration. It is a sample of the artifact, not a
              full diligence engagement.
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card className="flex flex-col p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="eyebrow">Redaction & sharing</p>
                <span className="font-mono text-[0.56rem] text-subtle">
                  03 rules
                </span>
              </div>
              <ul className="mt-4 space-y-2.5">
                {REDACTION.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2.5 text-sm leading-relaxed text-muted"
                  >
                    <span aria-hidden="true" className="text-accent">
                      ·
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-auto border-t border-line pt-4 text-xs leading-relaxed text-subtle">
                The sample uses the public test string{' '}
                <code className="break-all font-mono text-[0.66rem]">
                  sk-live-super-secret-api-key
                </code>{' '}
                from the test suite. It is not a real credential.
              </p>
            </Card>

            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="eyebrow">Artifact record</p>
                <Badge tone="outline">v0.1</Badge>
              </div>
              <dl className="mt-4 divide-y divide-line border-y border-line">
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-sm text-muted">Artifact type</dt>
                  <dd className="text-right text-sm text-text">
                    Sample self-audit
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-sm text-muted">Prepared</dt>
                  <dd className="text-right text-sm text-text">21 Oct 2026</dd>
                </div>
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-sm text-muted">Snapshot</dt>
                  <dd
                    className="text-right font-mono text-xs text-text"
                    title={SNAPSHOT.full}
                  >
                    {SNAPSHOT.short}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-sm text-muted">Revision</dt>
                  <dd className="text-right text-sm text-text">
                    Initial sample for schema validation
                  </dd>
                </div>
              </dl>
              <a
                href="/diligence-sample.md"
                download
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent transition-opacity hover:opacity-80"
              >
                Download the full Markdown dossier
                <span aria-hidden="true">↓</span>
              </a>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-accent text-accent-ink print:bg-transparent print:text-text">
        <div className="mx-auto grid max-w-[88rem] gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end lg:px-10 lg:py-20">
          <div>
            <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-accent-ink/70 print:text-subtle">
              Next deal
            </p>
            <h2 className="mt-4 max-w-2xl font-display text-[2.4rem] leading-[1.02] sm:text-5xl">
              Bring the evidence pack to the next deal.{' '}
              <span className="text-accent-ink/75 print:text-accent">
                Not just a code review.
              </span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-accent-ink/80 print:text-muted">
              Design-partner diligence sprints are scoped per deal. Start with
              the sample, then tell us what you need to know before signing.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row print:hidden">
            <Link
              href="/feedback"
              className="inline-flex items-center justify-center gap-2 rounded-[6px] border border-accent-ink bg-accent-ink px-5 py-2.5 text-[0.9375rem] font-semibold text-accent transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
            >
              Request a sprint
              <span aria-hidden="true">→</span>
            </Link>
            <a
              href="/diligence-sample.md"
              download
              className="inline-flex items-center justify-center gap-2 rounded-[6px] border border-accent-ink/40 px-5 py-2.5 text-[0.9375rem] font-semibold text-accent-ink transition-colors hover:bg-accent-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
            >
              Download sample
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
