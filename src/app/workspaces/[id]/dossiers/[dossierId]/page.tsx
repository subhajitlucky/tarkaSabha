'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, PageHeader } from '@/components/ui/EmptyState'
import { MarkdownDocument } from '@/components/reports/MarkdownDocument'
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

  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <div className="mb-6 print:hidden">
        <Link
          href={`/workspaces/${id}`}
          className="font-mono text-xs uppercase tracking-[0.12em] text-subtle transition-colors hover:text-accent"
        >
          ← Back to workspace
        </Link>
      </div>

      <PageHeader
        eyebrow="Decision dossier"
        title="Decision Diligence Dossier"
        lede={`${dossier.workspaceName} · Version ${dossier.version} · generated ${formatDate(
          dossier.createdAt
        )}${dossier.generatedBy?.name ? ` by ${dossier.generatedBy.name}` : ''}`}
        actions={
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
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge tone={dossier.status === 'PUBLISHED' ? 'success' : 'neutral'}>
          {dossier.status}
        </Badge>
        <Badge tone="outline">SHA-256 {dossier.contentHash.slice(0, 16)}…</Badge>
      </div>

      {canEdit && (
        <Card className="mb-6 p-4 print:hidden">
          <DossierShareControl dossierId={dossier.id} />
        </Card>
      )}

      <Card className="p-6 sm:p-9">
        <MarkdownDocument content={dossier.content} />
      </Card>
    </div>
  )
}
