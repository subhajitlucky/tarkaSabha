'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import { formatDate } from '@/components/workspaces/format'

interface ShareSummary {
  id: string
  expiresAt: string
  redactSources: boolean
  viewCount: number
  createdAt: string
}

export function DossierShareControl({ dossierId }: { dossierId: string }) {
  const [shares, setShares] = useState<ShareSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [expiresInDays, setExpiresInDays] = useState('7')
  const [redactSources, setRedactSources] = useState(false)
  const [creating, setCreating] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [newLink, setNewLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadShares = async () => {
      try {
        const res = await fetch(`/api/dossiers/${dossierId}/shares`, { cache: 'no-store' })
        const data = await res.json().catch(() => null)
        if (!cancelled && res.ok && Array.isArray(data)) setShares(data)
      } catch (err) {
        console.error('Failed to load dossier shares', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadShares()
    return () => {
      cancelled = true
    }
  }, [dossierId])

  const createShare = async () => {
    setCreating(true)
    setError('')
    setCopied(false)

    try {
      const res = await fetch(`/api/dossiers/${dossierId}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expiresInDays: Number(expiresInDays),
          redactSources,
        }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'Could not create the share link.')
        return
      }

      setNewLink(`${window.location.origin}${data.path}`)
      setShares((current) => [
        {
          id: data.id,
          expiresAt: data.expiresAt,
          redactSources: data.redactSources,
          viewCount: data.viewCount ?? 0,
          createdAt: data.createdAt,
        },
        ...current,
      ])
    } catch (err) {
      console.error('Failed to create dossier share', err)
      setError('Could not create the share link.')
    } finally {
      setCreating(false)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(newLink)
      setCopied(true)
    } catch {
      setError('Could not copy automatically. Select the link and copy it manually.')
    }
  }

  const revokeShare = async (shareId: string) => {
    setRevoking(shareId)
    setError('')

    try {
      const res = await fetch(`/api/dossier-shares/${shareId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Could not revoke the link.')
        return
      }
      setShares((current) => current.filter((share) => share.id !== shareId))
    } catch (err) {
      console.error('Failed to revoke dossier share', err)
      setError('Could not revoke the link.')
    } finally {
      setRevoking(null)
    }
  }

  return (
    <details>
      <summary className="cursor-pointer font-mono text-xs text-muted transition-colors hover:text-accent">
        Share dossier
      </summary>

      <div className="mt-3 space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <Select
            aria-label="Dossier share expiry"
            value={expiresInDays}
            onChange={(event) => setExpiresInDays(event.target.value)}
          >
            <option value="1">1 day</option>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
          </Select>
          <label className="flex items-center gap-2 text-xs leading-relaxed text-muted">
            <input
              type="checkbox"
              checked={redactSources}
              onChange={(event) => setRedactSources(event.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--accent)]"
            />
            Redact source paths
          </label>
        </div>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={createShare}
          disabled={creating}
        >
          {creating ? 'Creating…' : 'Create dossier link'}
        </Button>

        {newLink && (
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <Input
                readOnly
                aria-label="New dossier share link"
                value={newLink}
                className="min-w-0 flex-1 font-mono text-xs"
                onFocus={(event) => event.target.select()}
              />
              <Button type="button" size="sm" variant="primary" onClick={copyLink}>
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="text-xs text-subtle">
              Copy this now. The full link is not shown again after you leave this page.
            </p>
          </div>
        )}

        {loading ? (
          <p className="text-xs text-subtle">Loading links…</p>
        ) : shares.length > 0 ? (
          <ul className="space-y-2">
            {shares.map((share) => (
              <li
                key={share.id}
                className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted"
              >
                <span>
                  Expires {formatDate(share.expiresAt)}
                  <span className="mx-1.5">·</span>
                  {share.viewCount} {share.viewCount === 1 ? 'view' : 'views'}
                  {share.redactSources && (
                    <>
                      <span className="mx-1.5">·</span>
                      redacted
                    </>
                  )}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={() => revokeShare(share.id)}
                  disabled={revoking === share.id}
                >
                  {revoking === share.id ? 'Revoking…' : 'Revoke'}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-subtle">No active share links.</p>
        )}

        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    </details>
  )
}
