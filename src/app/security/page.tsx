import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, Rule } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Security — Tarka Sabha',
  description:
    'How Tarka Sabha handles diligence material: private workspaces, encrypted provider keys, expiring shares, hashed artifacts, and explicit limits.',
}

export default function SecurityPage() {
  return (
    <div>
      <section className="home-hero border-b border-line">
        <div className="mx-auto max-w-[88rem] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-accent">
              Security
            </p>
            <Badge tone="outline">Controls and limits</Badge>
          </div>
          <h1 className="mt-5 max-w-4xl text-5xl leading-[0.96] tracking-[-0.045em] text-text sm:text-6xl lg:text-7xl">
            Security for diligence material.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            A diligence tool sees sensitive code and deal context. The controls should be explicit, sharing should expire, and limits should be written down.
          </p>
        </div>
      </section>

      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-[88rem] px-5 py-16 sm:px-8 lg:px-10">
          <Rule label="Controls" className="mb-8" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Private by default', 'Workspace access is scoped to membership. Public pages are read-only samples.'],
              ['BYOK', 'Provider keys are encrypted with AES-256-GCM before storage and never returned to the browser.'],
              ['Expiring shares', 'Shared dossiers and reports use hashed, revocable links with an expiry.'],
              ['Hashed artifacts', 'Dossiers and approvals carry a content hash so a snapshot can be checked later.'],
            ].map(([title, body]) => (
              <Card key={title} className="flex h-full flex-col">
                <p className="eyebrow">Control</p>
                <h2 className="mt-4 font-display text-xl text-text">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-bg">
        <div className="mx-auto grid max-w-[88rem] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-10">
          <div>
            <p className="eyebrow">Data boundaries</p>
            <h2 className="mt-3 max-w-md text-4xl leading-[1.02] text-text">
              What we store, and what we do not claim.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              A dossier is a record of what the workspace contains at a point in time. It is not an
              audit opinion, a runtime proof, or a guarantee of production configuration.
            </p>
          </div>

          <Card flush className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line font-mono text-[0.6rem] uppercase tracking-[0.14em] text-subtle">
                    <th className="px-5 py-3 font-normal">Data</th>
                    <th className="px-5 py-3 font-normal">Handling</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Account identity', 'Name and email from the sign-in provider; used for access and attribution.'],
                    ['Workspace content', 'Private to workspace membership; public sharing is opt-in and expiring.'],
                    ['Provider keys', 'Encrypted with AES-256-GCM; masked in API responses and never sent to the browser.'],
                    ['Source snapshots', 'Stored with commit/SHA metadata where available; hashed for verification.'],
                    ['Feedback', 'Used to respond to the report; email is optional for signed-in users.'],
                  ].map(([data, handling]) => (
                    <tr key={data} className="border-b border-line last:border-b-0">
                      <td className="px-5 py-4 text-sm font-semibold text-text">{data}</td>
                      <td className="px-5 py-4 text-sm leading-relaxed text-muted">{handling}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-[88rem] gap-6 px-5 py-16 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10">
          <Card>
            <p className="eyebrow">What we do not claim</p>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
              We do not claim certifications we have not completed. We do not claim that a static
              review proves runtime behavior, key custody, backup encryption, or production
              configuration. Those questions still belong in the data room and with the target’s
              security team.
            </p>
          </Card>
          <Card className="flex flex-col justify-between">
            <div>
              <p className="eyebrow">Report a concern</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                If you see a security issue or a shared link behaving unexpectedly, tell us
                directly. Include the record and the smallest reproduction you can.
              </p>
            </div>
            <Link href="/feedback" className="mt-6">
              <Button variant="primary" className="w-full">
                Send a security note
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      <section className="bg-bg">
        <div className="mx-auto flex max-w-[88rem] flex-col gap-6 px-5 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <p className="eyebrow">Next</p>
            <h2 className="mt-3 max-w-2xl text-3xl leading-tight text-text">
              Read the sample, then ask us the hard questions.
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/diligence">
              <Button variant="primary" size="lg">
                Read the sample
              </Button>
            </Link>
            <Link href="/feedback">
              <Button variant="secondary" size="lg">
                Talk to us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
