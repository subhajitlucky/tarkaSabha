import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, Rule } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Terms — Tarka Sabha',
  description:
    'Plain-language website and workspace terms for Tarka Sabha, including accounts, content, provider keys, and acceptable use.',
}

const TERMS = [
  {
    title: 'Using the service',
    body: 'You may use Tarka Sabha to evaluate technical decisions, collect evidence, review material, and produce diligence dossiers for lawful business purposes. You are responsible for the material you upload and for having the right to review it.',
  },
  {
    title: 'Accounts and access',
    body: 'Keep your account secure and tell us if access is compromised. Workspace roles control what members can read or change. You are responsible for the people you invite and the scope of access you give them.',
  },
  {
    title: 'Your content',
    body: 'You retain ownership of the content you put into a workspace. You grant us the limited right to store, process, and display it so the service can operate. We do not use workspace content for advertising.',
  },
  {
    title: 'Provider keys',
    body: 'Review rooms call the model provider you configure. Your provider terms and usage costs apply. Keys are encrypted at rest, but a key with broad permissions remains a sensitive credential; scope it accordingly.',
  },
  {
    title: 'Acceptable use',
    body: 'Do not use the service to break the law, infringe rights, distribute malware, or access material you are not authorized to review. Do not attempt to bypass workspace access controls or extract another customer’s data.',
  },
  {
    title: 'Availability and limits',
    body: 'The service is provided as-is while it evolves. A dossier records what a workspace contained at a point in time; it is not an audit opinion or a guarantee of runtime behavior. Paid engagements are governed by a written scope.',
  },
  {
    title: 'Ending use',
    body: 'You can stop using the service at any time. We may suspend access for abuse, security risk, or non-payment under a separate agreement. Provisions that should survive termination — including content ownership, disclaimers, and limitations — survive.',
  },
]

export default function TermsPage() {
  return (
    <div>
      <section className="home-hero border-b border-line">
        <div className="mx-auto max-w-[88rem] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-accent">
            Terms
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl leading-[0.96] tracking-[-0.045em] text-text sm:text-6xl lg:text-7xl">
            Terms, in plain language.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            These are the working terms for the Tarka Sabha website and workspace. A signed
            agreement governs paid diligence engagements. If something here is unclear, ask us
            before you rely on it.
          </p>
          <p className="mt-8 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-subtle">
            Last updated · October 2026
          </p>
        </div>
      </section>

      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-[88rem] px-5 py-16 sm:px-8 lg:px-10">
          <Rule label="The working terms" className="mb-8" />
          <div className="max-w-4xl">
            {TERMS.map((term, index) => (
              <section key={term.title} className="border-b border-line py-8 first:pt-0 last:border-b-0">
                <p className="font-mono text-xs tracking-[0.14em] text-accent">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h2 className="mt-3 font-display text-2xl text-text">{term.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{term.body}</p>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-bg">
        <div className="mx-auto grid max-w-[88rem] gap-6 px-5 py-12 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10">
          <Card>
            <p className="eyebrow">A note on legal text</p>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
              This page is a plain-language summary for the product website. It is not a substitute
              for an executed master services agreement, data-processing agreement, or legal advice.
              Paid engagements use a written scope and the agreement signed by both parties.
            </p>
          </Card>
          <Card className="flex flex-col justify-between">
            <div>
              <p className="eyebrow">Need the executed version?</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Ask us for the current agreement before a diligence engagement begins.
              </p>
            </div>
            <Link href="/feedback" className="mt-6">
              <Button variant="primary" className="w-full">
                Contact us
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-[88rem] flex-col gap-6 px-5 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <p className="eyebrow">Also read</p>
            <h2 className="mt-3 max-w-2xl text-3xl leading-tight text-text">
              Privacy and security are part of the record.
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/privacy">
              <Button variant="secondary" size="lg">
                Privacy
              </Button>
            </Link>
            <Link href="/security">
              <Button variant="primary" size="lg">
                Security
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
