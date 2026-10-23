import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, Rule } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Privacy — Tarka Sabha',
  description:
    'Plain-language privacy summary for Tarka Sabha: account data, workspace content, provider keys, feedback, and sharing.',
}

const ROWS = [
  [
    'Account identity',
    'Name and email provided by your sign-in provider. Used to authenticate you, attribute activity, and send workspace invitations.',
  ],
  [
    'Workspace content',
    'Decisions, evidence, notes, and dossier content. Private to workspace membership unless you deliberately create a share link.',
  ],
  [
    'Provider keys',
    'Encrypted with AES-256-GCM before storage. Keys are not returned to the browser. A review-room call sends the necessary prompt to the provider you configured, under that provider’s terms.',
  ],
  [
    'Source material',
    'Repository and document snapshots, source coordinates, and hashes. A share link can be configured to redact source paths.',
  ],
  [
    'Feedback',
    'The message and optional email you submit. Used to respond and improve the product.',
  ],
  [
    'Operational logs',
    'Standard server logs needed to run and secure the service. They are not a marketing profile.',
  ],
]

export default function PrivacyPage() {
  return (
    <div>
      <section className="home-hero border-b border-line">
        <div className="mx-auto max-w-[88rem] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-accent">
            Privacy
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl leading-[0.96] tracking-[-0.045em] text-text sm:text-6xl lg:text-7xl">
            Privacy, in plain language.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Tarka Sabha holds diligence material. This page explains what the service stores, why
            it stores it, and how sharing works. It is a plain-language summary, not a substitute
            for a signed data-processing agreement.
          </p>
        </div>
      </section>

      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-[88rem] px-5 py-16 sm:px-8 lg:px-10">
          <Rule label="What we store" className="mb-8" />
          <Card flush className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line font-mono text-[0.6rem] uppercase tracking-[0.14em] text-subtle">
                    <th className="px-5 py-3 font-normal">Data</th>
                    <th className="px-5 py-3 font-normal">Purpose and handling</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map(([data, purpose]) => (
                    <tr key={data} className="border-b border-line last:border-b-0">
                      <td className="px-5 py-4 text-sm font-semibold text-text">{data}</td>
                      <td className="px-5 py-4 text-sm leading-relaxed text-muted">{purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      <section className="bg-bg">
        <div className="mx-auto grid max-w-[88rem] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-10">
          <div>
            <p className="eyebrow">Your choices</p>
            <h2 className="mt-3 max-w-md text-4xl leading-[1.02] text-text">
              Private material should have an exit.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              We do not sell personal data. Workspace content is not used for advertising. If you
              need a workspace removed, a key deleted, or a copy of your data, contact us.
            </p>
          </div>
          <div className="space-y-4">
            {[
              ['Workspace deletion', 'Remove a workspace and its dependent decisions, evidence, sources, and dossiers.'],
              ['Key deletion', 'Remove a provider key and its encrypted ciphertext.'],
              ['Share revocation', 'Revoke an active dossier or report link; expired links stop working automatically.'],
              ['Data request', 'Ask for a copy of the account and workspace data we hold about you.'],
            ].map(([title, body]) => (
              <div key={title} className="border-t border-line pt-4">
                <h3 className="font-display text-xl text-text">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-[88rem] flex-col gap-6 px-5 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <p className="eyebrow">Questions</p>
            <h2 className="mt-3 max-w-2xl text-3xl leading-tight text-text">
              Ask before the data room opens.
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/feedback">
              <Button variant="primary" size="lg">
                Contact us
              </Button>
            </Link>
            <Link href="/security">
              <Button variant="secondary" size="lg">
                Security controls
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
