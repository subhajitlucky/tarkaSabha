'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { headingSlug, MarkdownDocument } from '@/components/reports/MarkdownDocument'
import { PrintButton } from '@/components/reports/PrintButton'
import { DossierShareControl } from '@/components/workspaces/DossierShareControl'
import { formatDate } from '@/components/workspaces/format'
import { canEditDecisions } from '@/lib/workspace-roles'
import { WorkspaceDossierDetail } from '@/types'

export default function DossierPage() {
  const { id, dossierId } = useParams<{ id: string; dossierId: string }>()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [dossier, setDossier] = useState<WorkspaceDossierDetail | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  const loading = authLoading || (isAuthenticated && !loaded)

  useEffect(() => {
    if (authLoading || !isAuthenticated || !id || !dossierId) return

    let cancelled = false

    const loadDossier = async () => {
      setLoaded(false)
      setError('')
      setNotFound(false)

      try {
        const res = await fetch(`/api/dossiers/${dossierId}`, { cache: 'no-store' })
        const data = await res.json().catch(() => null)

        if (cancelled) return

        if (res.status === 404) {
          setNotFound(true)
          return
        }

        if (!res.ok) {
          setError(data?.error || 'Could not load this dossier.')
          return
        }

        if (data.workspaceId !== id) {
          setNotFound(true)
          return
        }

        setDossier(data as WorkspaceDossierDetail)
      } catch (err) {
        console.error('Failed to load dossier', err)
        if (!cancelled) setError('Could not load this dossier.')
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }

    loadDossier()
    return () => {
      cancelled = true
    }
  }, [authLoading, dossierId, id, isAuthenticated])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-14">
        <p className="py-20 text-center font-mono text-xs uppercase tracking-[0.14em] text-subtle">
          Loading…
        </p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-14">
        <EmptyState
          title="Sign in to view this dossier"
          description="Deal dossiers are private to their workspace."
          action={
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(
                `/workspaces/${id}/dossiers/${dossierId}`
              )}`}
            >
              <Button variant="primary">Sign in</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (notFound || !dossier) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-14">
        <EmptyState
          title={notFound ? 'Dossier not found' : 'Could not load this dossier'}
          description={error || 'It may have been removed, or you may not be a member of this workspace.'}
          action={
            <Link href={`/workspaces/${id}`}>
              <Button variant="secondary">Back to workspace</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const canEdit = canEditDecisions(dossier.role)

  const sections = Array.from(dossier.content.matchAll(/^##\s+(.+)$/gm)).map((match) =>
    match[1].trim()
  )

  return (
    <div className="mx-auto max-w-[90rem] px-5 py-14 print:max-w-none print:px-0">
      <div className="mb-6 print:hidden">
        <Link
          href={`/workspaces/${id}`}
          className="font-mono text-xs uppercase tracking-[0.12em] text-subtle transition-colors hover:text-accent"
        >
          ← Back to workspace
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-5 border-b border-line pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">Decision dossier</p>
          <h1 className="mt-3 max-w-4xl text-3xl leading-[1.02] text-text sm:text-4xl">
            {dossier.workspaceName}
          </h1>
          <p className="mt-3 font-mono text-xs leading-relaxed text-subtle">
            Technical due diligence · Version {dossier.version} · generated{' '}
            {formatDate(dossier.createdAt)}
            {dossier.generatedBy?.name ? ` by ${dossier.generatedBy.name}` : ''}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone={dossier.status === 'PUBLISHED' ? 'success' : 'warning'}>
              {dossier.status}
            </Badge>
            <Badge tone="outline">SHA-256 {dossier.contentHash.slice(0, 16)}…</Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <a href={`/api/dossiers/${dossier.id}?download=1`}>
            <Button variant="secondary" size="sm">
              Download .md
            </Button>
          </a>
          <a href={`/api/dossiers/${dossier.id}/export`}>
            <Button variant="secondary" size="sm">
              Signed JSON
            </Button>
          </a>
          <PrintButton />
        </div>
      </div>

      <details className="mb-4 border border-line bg-surface p-4 xl:hidden print:hidden">
        <summary className="cursor-pointer list-none font-mono text-xs uppercase tracking-[0.12em] text-subtle">
          Contents · {sections.length} sections
        </summary>
        <nav className="mt-3 space-y-2" aria-label="Dossier contents">
          {sections.map((section) => (
            <a
              key={section}
              href={`#${headingSlug(section)}`}
              className="block text-sm text-muted transition-colors hover:text-accent"
            >
              {section}
            </a>
          ))}
        </nav>
      </details>

      <div className="grid gap-6 xl:grid-cols-[12rem_minmax(0,1fr)_16rem]">
        <aside className="hidden xl:block print:hidden">
          <div className="sticky top-24">
            <p className="eyebrow">Contents</p>
            <nav className="mt-3 border-l border-line" aria-label="Dossier contents">
              {sections.map((section) => (
                <a
                  key={section}
                  href={`#${headingSlug(section)}`}
                  className="block border-l-2 border-transparent py-2 pl-3 text-sm leading-snug text-muted transition-colors hover:border-accent hover:bg-surface-2 hover:text-accent"
                >
                  {section}
                </a>
              ))}
            </nav>
            <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-subtle">
              The dossier is a point-in-time record. It is not an audit opinion or a guarantee of
              runtime behavior.
            </p>
          </div>
        </aside>

        <article className="min-w-0">
          <Card className="p-6 sm:p-9 print:border-0 print:p-0 print:shadow-none">
            <MarkdownDocument content={dossier.content} />
          </Card>
        </article>

        <aside className="space-y-4 print:hidden">
          <Card>
            <p className="eyebrow">Snapshot</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Version</dt>
                <dd className="font-mono text-xs text-text">v{dossier.version}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Status</dt>
                <dd>
                  <Badge tone={dossier.status === 'PUBLISHED' ? 'success' : 'warning'}>
                    {dossier.status}
                  </Badge>
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Generated</dt>
                <dd className="text-right text-xs text-text">{formatDate(dossier.createdAt)}</dd>
              </div>
              <div className="border-t border-line pt-3">
                <dt className="text-muted">Content hash</dt>
                <dd className="mt-1 break-all font-mono text-[0.62rem] leading-relaxed text-subtle">
                  {dossier.contentHash}
                </dd>
              </div>
            </dl>
            <Link
              href={`/workspaces/${id}`}
              className="mt-5 inline-block font-mono text-xs text-accent transition-colors hover:text-accent-hover"
            >
              Back to the workspace →
            </Link>
          </Card>

          {canEdit && (
            <Card>
              <DossierShareControl dossierId={dossier.id} />
            </Card>
          )}

          <Card>
            <p className="eyebrow">How to read this</p>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Start with the executive summary, then use the contents rail to inspect the decision
              inventory, evidence, contradictions, and open questions. A source path is a
              coordinate, not proof of runtime behavior.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  )
}
