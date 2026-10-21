'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/components/workspaces/format'
import { WorkspaceDossierSummary } from '@/types'

export function WorkspaceDossierPanel({
  workspaceId,
  initialDossiers,
  canEdit,
}: {
  workspaceId: string
  initialDossiers: WorkspaceDossierSummary[]
  canEdit: boolean
}) {
  const [dossiers, setDossiers] = useState(initialDossiers)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setGenerating(true)
    setError('')

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/dossiers`, {
        method: 'POST',
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'Could not generate the dossier.')
        return
      }

      setDossiers((current) => [
        {
          id: data.id,
          version: data.version,
          status: data.status,
          contentHash: data.contentHash,
          createdAt: data.createdAt,
        },
        ...current,
      ])
    } catch (err) {
      console.error('Failed to generate dossier', err)
      setError('Could not generate the dossier.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <section aria-labelledby="dossiers-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2
          id="dossiers-heading"
          className="font-mono text-xs uppercase tracking-[0.14em] text-subtle"
        >
          Decision dossier
        </h2>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-subtle">{dossiers.length}</span>
          {canEdit && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={generate}
              disabled={generating}
            >
              {generating ? 'Generating…' : 'Generate dossier'}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-3 text-xs text-danger">
          {error}
        </p>
      )}

      {dossiers.length === 0 ? (
        <EmptyState
          title="No dossier generated"
          description={
            canEdit
              ? 'Generate a versioned deal-level dossier from every decision, evidence item, pin, approval, and debt score.'
              : 'An owner or reviewer will generate the deal dossier.'
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {dossiers.map((dossier) => (
            <li key={dossier.id}>
              <div className="flex h-full flex-col rounded-[4px] border border-line bg-surface p-4 transition-colors hover:border-accent-line">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-base text-text">Version {dossier.version}</p>
                  <Badge tone={dossier.status === 'PUBLISHED' ? 'success' : 'neutral'}>
                    {dossier.status}
                  </Badge>
                </div>
                <p className="mt-1 font-mono text-xs text-subtle">
                  {formatDate(dossier.createdAt)}
                  <span className="mx-1.5">·</span>
                  {dossier.contentHash.slice(0, 12)}…
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/workspaces/${workspaceId}/dossiers/${dossier.id}`}
                    className="font-mono text-xs text-accent transition-colors hover:underline"
                  >
                    Open dossier
                  </Link>
                  <a
                    href={`/api/dossiers/${dossier.id}?download=1`}
                    className="font-mono text-xs text-muted transition-colors hover:text-accent"
                  >
                    Download .md
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
