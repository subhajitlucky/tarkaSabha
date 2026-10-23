'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { BarList, DonutChart, MetricCard } from '@/components/ui/DataViz'
import { EmptyState, PageHeader } from '@/components/ui/EmptyState'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import {
  DebtBadge,
  DecisionStatusBadge,
  ImpactBadge,
  RoleBadge,
} from '@/components/workspaces/badges'
import { formatDate } from '@/components/workspaces/format'
import { MemberRow, WorkspaceMember } from '@/components/workspaces/MemberRow'
import { WorkspaceDossierPanel } from '@/components/workspaces/WorkspaceDossierPanel'
import {
  DECISION_IMPACTS,
  WORKSPACE_ROLES,
  canEditDecisions,
  canManageWorkspace,
} from '@/lib/workspace-roles'
import { DecisionSummary, WorkspaceDetail, WorkspaceSourceSummary } from '@/types'

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [notFound, setNotFound] = useState(false)

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [impact, setImpact] = useState('MEDIUM')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('REVIEWER')
  const [inviting, setInviting] = useState(false)
  const [memberError, setMemberError] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [creatingInviteLink, setCreatingInviteLink] = useState(false)
  const [inviteLinkError, setInviteLinkError] = useState('')
  const [copiedInviteLink, setCopiedInviteLink] = useState(false)

  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceRef, setSourceRef] = useState('')
  const [ingestingSource, setIngestingSource] = useState(false)
  const [sourceError, setSourceError] = useState('')

  const loading = authLoading || (isAuthenticated && !loaded)

  useEffect(() => {
    if (authLoading || !isAuthenticated || !id) return

    let cancelled = false

    const loadWorkspace = async () => {
      setLoaded(false)
      setLoadError('')
      setNotFound(false)
      try {
        const res = await fetch(`/api/workspaces/${id}`, { cache: 'no-store' })
        const data = await res.json().catch(() => null)

        if (cancelled) return

        if (res.status === 404) {
          setNotFound(true)
          setWorkspace(null)
          return
        }

        if (!res.ok) {
          setLoadError(data?.error || 'Could not load this workspace.')
          return
        }

        setWorkspace(data as WorkspaceDetail)
      } catch (error) {
        console.error('Failed to fetch workspace', error)
        if (!cancelled) setLoadError('Could not load this workspace.')
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }

    loadWorkspace()
    return () => {
      cancelled = true
    }
  }, [authLoading, id, isAuthenticated])

  const handleInviteMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!workspace) return

    setInviting(true)
    setMemberError('')
    setInviteLinkError('')

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setMemberError(data?.error || 'Could not add the member.')
        return
      }

      const created = data as WorkspaceMember
      setWorkspace((current) =>
        current
          ? { ...current, memberships: [...current.memberships, created] }
          : current
      )
      setInviteEmail('')
      setInviteLink('')
    } catch (error) {
      console.error('Failed to invite member', error)
      setMemberError('Could not add the member.')
    } finally {
      setInviting(false)
    }
  }

  const createInviteLink = async () => {
    if (!workspace) return
    setCreatingInviteLink(true)
    setInviteLinkError('')
    setCopiedInviteLink(false)

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setInviteLinkError(data?.error || 'Could not create the invite link.')
        return
      }

      setInviteLink(`${window.location.origin}${data.path}`)
    } catch (error) {
      console.error('Failed to create invite link', error)
      setInviteLinkError('Could not create the invite link.')
    } finally {
      setCreatingInviteLink(false)
    }
  }

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopiedInviteLink(true)
    } catch {
      setInviteLinkError('Could not copy automatically. Select the link and copy it manually.')
    }
  }

  const handleMemberUpdated = (member: WorkspaceMember) => {
    setWorkspace((current) =>
      current
        ? {
            ...current,
            memberships: current.memberships.map((item) =>
              item.id === member.id ? { ...item, role: member.role } : item
            ),
          }
        : current
    )
  }

  const handleMemberRemoved = (memberId: string) => {
    setWorkspace((current) =>
      current
        ? {
            ...current,
            memberships: current.memberships.filter((item) => item.id !== memberId),
          }
        : current
    )
  }

  const ingestSource = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!workspace) return

    setIngestingSource(true)
    setSourceError('')

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sourceUrl, ref: sourceRef }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setSourceError(data?.error || 'Could not ingest the repository.')
        return
      }

      setWorkspace((current) =>
        current
          ? { ...current, sources: [data as WorkspaceSourceSummary, ...current.sources] }
          : current
      )
      setSourceUrl('')
      setSourceRef('')
    } catch (error) {
      console.error('Failed to ingest source', error)
      setSourceError('Could not ingest the repository.')
    } finally {
      setIngestingSource(false)
    }
  }

  const handleCreateDecision = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!workspace) return

    setCreating(true)
    setFormError('')

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, summary, impact }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setFormError(data?.error || 'Could not add the decision.')
        return
      }

      const created = data as DecisionSummary
      setWorkspace((current) =>
        current
          ? {
              ...current,
              decisions: [created, ...current.decisions],
              _count: { decisions: current.decisions.length + 1 },
              updatedAt: new Date().toISOString(),
            }
          : current
      )
      setTitle('')
      setSummary('')
      setImpact('MEDIUM')
    } catch (error) {
      console.error('Failed to create decision', error)
      setFormError('Could not add the decision.')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[90rem] px-5 py-10">
        <p className="py-20 text-center font-mono text-xs uppercase tracking-[0.14em] text-subtle">
          Loading…
        </p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <EmptyState
          title="Sign in to open this workspace"
          description="Workspace material is private to its members."
          action={
            <Link href={`/login?callbackUrl=${encodeURIComponent(`/workspaces/${id}`)}`}>
              <Button variant="primary">Sign in</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <EmptyState
          title="Workspace not found"
          description="It may have been removed, or you may not be a member of this room."
          action={
            <Link href="/workspaces">
              <Button variant="secondary">Back to workspaces</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <p role="alert" className="rounded-[4px] border border-line bg-surface p-5 text-sm text-danger">
          {loadError || 'Could not load this workspace.'}
        </p>
      </div>
    )
  }

  const canEdit = canEditDecisions(workspace.role)
  const canManage = canManageWorkspace(workspace.role)
  const canManageOwners = workspace.role === 'OWNER'
  const ownerCount = workspace.memberships.filter((member) => member.role === 'OWNER').length
  const assignableRoles = canManageOwners
    ? WORKSPACE_ROLES
    : WORKSPACE_ROLES.filter((role) => role !== 'OWNER')
  const decisionCount = workspace.decisions.length
  const evidenceCount = workspace.decisions.reduce(
    (total, decision) => total + (decision._count?.evidence ?? 0),
    0
  )
  const memberCount = workspace.memberships.length
  const sourceCount = workspace.sources.length
  const fileCount = workspace.sources.reduce((total, source) => total + source.fileCount, 0)
  const approvedCount = workspace.decisions.filter(
    (decision) => decision.status === 'APPROVED'
  ).length
  const inReviewCount = workspace.decisions.filter(
    (decision) => decision.status === 'IN_REVIEW'
  ).length
  const draftCount = workspace.decisions.filter(
    (decision) => decision.status === 'DRAFT'
  ).length
  const archivedCount = workspace.decisions.filter(
    (decision) => decision.status === 'ARCHIVED'
  ).length
  const decisionsWithEvidence = workspace.decisions.filter(
    (decision) => (decision._count?.evidence ?? 0) > 0
  ).length
  const approvalCount = workspace.decisions.reduce(
    (total, decision) => total + (decision._count?.approvals ?? 0),
    0
  )
  const dossierCount = workspace.dossiers.length
  const latestDossier = workspace.dossiers[0]
  const statusSegments = [
    { label: 'Approved', value: approvedCount, color: 'var(--chart-1)' },
    { label: 'In review', value: inReviewCount, color: 'var(--chart-2)' },
    { label: 'Draft', value: draftCount, color: 'var(--chart-3)' },
    { label: 'Archived', value: archivedCount, color: 'var(--text-subtle)' },
  ]
  const impactItems = DECISION_IMPACTS.map((value) => ({
    label: value,
    value: workspace.decisions.filter((decision) => decision.impact === value).length,
    meta: `${workspace.decisions.filter((decision) => decision.impact === value).length} decision${workspace.decisions.filter((decision) => decision.impact === value).length === 1 ? '' : 's'}`,
    color:
      value === 'LOW'
        ? 'var(--chart-1)'
        : value === 'MEDIUM'
          ? 'var(--chart-3)'
          : value === 'HIGH'
            ? 'var(--chart-4)'
            : 'var(--danger)',
  }))

  return (
    <div className="mx-auto max-w-[90rem] px-5 py-10">
      <div className="mb-6">
        <Link
          href="/workspaces"
          className="font-mono text-xs uppercase tracking-[0.12em] text-subtle transition-colors hover:text-accent"
        >
          ← All workspaces
        </Link>
      </div>

      <PageHeader
        eyebrow="Decision workspace"
        title={workspace.name}
        lede={workspace.description || 'No workspace description yet.'}
        actions={<RoleBadge role={workspace.role} />}
      />

      <nav
        aria-label="Workspace sections"
        className="mb-8 flex items-center gap-5 border-b border-line"
      >
        <span className="border-b-2 border-accent py-3 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-text">
          Overview
        </span>
        <Link
          href={`/workspaces/${workspace.id}/insights`}
          className="border-b-2 border-transparent py-3 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted transition-colors hover:text-text"
        >
          Insights
        </Link>
        <Link
          href={`/workspaces/${workspace.id}/activity`}
          className="border-b-2 border-transparent py-3 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted transition-colors hover:text-text"
        >
          Activity
        </Link>
      </nav>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Decisions"
          value={decisionCount}
          detail={`${approvedCount} approved · ${inReviewCount + draftCount} open`}
          accent="var(--chart-1)"
        />
        <MetricCard
          label="Evidence items"
          value={evidenceCount}
          detail={`${decisionsWithEvidence} of ${decisionCount} decisions covered`}
          accent="var(--chart-2)"
        />
        <MetricCard
          label="Sources"
          value={sourceCount}
          detail={`${fileCount} files ingested`}
          accent="var(--chart-3)"
        />
        <MetricCard
          label="Members"
          value={memberCount}
          detail={`${ownerCount} owner${ownerCount === 1 ? '' : 's'} on record`}
          accent="var(--chart-4)"
        />
      </div>

      <div className="mb-8 grid gap-3 lg:grid-cols-3">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Decision status</p>
              <h2 className="mt-2 text-xl text-text">Where the record stands</h2>
            </div>
            <span className="font-mono text-xs text-subtle">{decisionCount}</span>
          </div>
          {decisionCount > 0 ? (
            <DonutChart
              className="mt-5"
              size="sm"
              segments={statusSegments}
              centerValue={decisionCount}
              centerLabel="decisions"
            />
          ) : (
            <p className="mt-5 text-sm leading-relaxed text-muted">
              Add a decision to see its review state.
            </p>
          )}
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Risk breakdown</p>
              <h2 className="mt-2 text-xl text-text">Deal impact by decision</h2>
            </div>
            <span className="font-mono text-xs text-subtle">{decisionCount}</span>
          </div>
          {decisionCount > 0 ? (
            <BarList className="mt-5" items={impactItems} maxValue={Math.max(1, decisionCount)} />
          ) : (
            <p className="mt-5 text-sm leading-relaxed text-muted">
              Impact distribution will appear as decisions are added.
            </p>
          )}
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Record coverage</p>
              <h2 className="mt-2 text-xl text-text">What is evidenced</h2>
            </div>
            <span className="font-mono text-xs text-subtle">{approvalCount} approval{approvalCount === 1 ? '' : 's'}</span>
          </div>
          <div className="mt-5 space-y-4">
            {[
              {
                label: 'Evidence coverage',
                value: `${decisionsWithEvidence}/${decisionCount}`,
                pct: decisionCount > 0 ? (decisionsWithEvidence / decisionCount) * 100 : 0,
                color: 'var(--chart-2)',
              },
              {
                label: 'Approved decisions',
                value: `${approvedCount}/${decisionCount}`,
                pct: decisionCount > 0 ? (approvedCount / decisionCount) * 100 : 0,
                color: 'var(--chart-1)',
              },
              {
                label: 'Dossier versions',
                value: String(dossierCount),
                pct: dossierCount > 0 ? 100 : 0,
                color: 'var(--chart-3)',
              },
              {
                label: 'Sources on file',
                value: String(sourceCount),
                pct: sourceCount > 0 ? 100 : 0,
                color: 'var(--chart-4)',
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-muted">{item.label}</span>
                  <span className="font-mono text-xs text-text">{item.value}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          {latestDossier && (
            <Link
              href={`/workspaces/${workspace.id}/dossiers/${latestDossier.id}`}
              className="mt-5 inline-block font-mono text-xs text-accent transition-colors hover:text-accent-hover"
            >
              Open dossier v{latestDossier.version} →
            </Link>
          )}
        </Card>
      </div>

      <section aria-labelledby="sources-heading" className="mb-6">
        <Card className="space-y-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2
            id="sources-heading"
            className="font-mono text-xs uppercase tracking-[0.14em] text-subtle"
          >
            Sources
          </h2>
          <span className="font-mono text-xs text-subtle">{sourceCount}</span>
        </div>

        {canEdit && (
          <details className="border border-line bg-surface-2/40">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-text">
              Add a source
              <span className="font-mono text-xs text-accent">＋</span>
            </summary>
            <form
              onSubmit={ingestSource}
              className="grid gap-2 border-t border-line p-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto]"
            >
              <Input
                aria-label="GitHub repository URL"
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="https://github.com/owner/repo"
                required
              />
              <Input
                aria-label="Branch or ref"
                value={sourceRef}
                onChange={(event) => setSourceRef(event.target.value)}
                placeholder="Default branch"
                maxLength={200}
              />
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                disabled={ingestingSource || sourceUrl.trim().length === 0}
              >
                {ingestingSource ? 'Ingesting…' : 'Ingest repo'}
              </Button>
            </form>
          </details>
        )}

        {sourceError && (
          <p role="alert" className="mb-3 text-xs text-danger">
            {sourceError}
          </p>
        )}

        {workspace.sources.length === 0 ? (
          <div className="border-y border-line py-6 text-sm leading-relaxed text-muted">
            {canEdit
              ? 'No repository sources are on file. Ingest a public GitHub repository to snapshot its files, commits, pull requests, and issues.'
              : 'No repository sources are on file yet.'}
          </div>
        ) : (
          <div className="border-y border-line">
            {workspace.sources.map((source) => (
              <Link
                key={source.id}
                href={`/workspaces/${workspace.id}/sources/${source.id}`}
                className="group flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-1 py-4 transition-colors last:border-b-0 hover:bg-surface-2"
              >
                <span className="flex h-7 w-7 items-center justify-center border border-line bg-surface-2 font-mono text-[0.55rem] text-[var(--chart-2)]">
                  GH
                </span>
                <p className="text-lg text-text transition-colors group-hover:text-accent">
                  {source.owner}/{source.name}
                </p>
                <Badge
                  tone={
                    source.status === 'READY'
                      ? 'success'
                      : source.status === 'FAILED'
                        ? 'danger'
                        : 'warning'
                  }
                >
                  {source.status.charAt(0) + source.status.slice(1).toLowerCase()}
                </Badge>
                <span className="font-mono text-[0.62rem] text-subtle">
                  {source.ref}
                  {source.commitSha ? ` @ ${source.commitSha.slice(0, 7)}` : ''}
                </span>
                <span className="ml-auto font-mono text-[0.62rem] text-subtle">
                  {source.fileCount} files · {source.commitCount} commits ·{' '}
                  {source.pullRequestCount}{' '}
                  {source.pullRequestCount === 1 ? 'PR' : 'PRs'} · {source.issueCount}{' '}
                  {source.issueCount === 1 ? 'issue' : 'issues'}
                  <span className="ml-3">{formatDate(source.updatedAt)}</span>
                </span>
                {source.error && <p className="w-full text-xs text-danger">{source.error}</p>}
              </Link>
            ))}
          </div>
        )}
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-10">
          <Card flush className="overflow-hidden">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line p-5">
              <div>
                <p className="eyebrow">Decision register</p>
                <h2 className="mt-2 text-2xl text-text">What is under review</h2>
              </div>
              <span className="font-mono text-xs text-subtle">{decisionCount} decisions</span>
            </div>

            {workspace.decisions.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="No decisions in this room"
                  description={
                    canEdit
                      ? 'Add the first decision under review. Evidence and approvals will hang off it.'
                      : 'A reviewer or owner will add the first decision.'
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line font-mono text-[0.6rem] uppercase tracking-[0.14em] text-subtle">
                      <th className="px-5 py-3 font-normal">Decision</th>
                      <th className="px-3 py-3 font-normal">Status</th>
                      <th className="px-3 py-3 font-normal">Impact</th>
                      <th className="px-3 py-3 font-normal">Debt</th>
                      <th className="px-3 py-3 font-normal">Evidence</th>
                      <th className="px-5 py-3 font-normal">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workspace.decisions.map((decision, index) => (
                      <tr
                        key={decision.id}
                        className="group border-b border-line transition-colors last:border-b-0 hover:bg-surface-2"
                      >
                        <td className="max-w-[28rem] px-5 py-4">
                          <div className="flex items-baseline gap-3">
                            <span className="whitespace-nowrap font-mono text-[0.62rem] text-subtle">
                              D-{String(index + 1).padStart(2, '0')}
                            </span>
                            <Link
                              href={`/decisions/${decision.id}`}
                              className="break-words text-lg leading-tight text-text transition-colors group-hover:text-accent"
                            >
                              {decision.title}
                            </Link>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 pl-8">
                            <span className="text-xs text-subtle">
                              Owner {decision.owner?.name || 'unassigned'}
                            </span>
                            {decision.outcome && (
                              <Badge
                                tone={
                                  decision.outcome === 'VALIDATED'
                                    ? 'success'
                                    : decision.outcome === 'INVALIDATED'
                                      ? 'danger'
                                      : 'neutral'
                                }
                              >
                                {decision.outcome}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <DecisionStatusBadge status={decision.status} />
                        </td>
                        <td className="px-3 py-4">
                          <ImpactBadge impact={decision.impact} />
                        </td>
                        <td className="px-3 py-4">
                          <DebtBadge score={decision.debtScore ?? 0} />
                        </td>
                        <td className="px-3 py-4 font-mono text-sm text-text">
                          {decision._count?.evidence ?? 0}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-[0.62rem] uppercase tracking-[0.08em] text-subtle">
                          {formatDate(decision.updatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <WorkspaceDossierPanel
            workspaceId={workspace.id}
            initialDossiers={workspace.dossiers}
            canEdit={canEdit}
          />
        </div>

        <aside className="space-y-4">
          {canEdit ? (
            <Card className="p-0">
              <details>
                <summary className="cursor-pointer list-none p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="eyebrow">New decision</p>
                      <h2 className="mt-2 text-xl text-text">
                        What is under review?
                      </h2>
                    </div>
                    <span className="font-mono text-sm text-accent">＋</span>
                  </div>
                </summary>

              <form onSubmit={handleCreateDecision} className="space-y-4 border-t border-line p-4">
                <Field label="Decision">
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Proceed with Kestrel"
                    maxLength={200}
                    required
                  />
                </Field>

                <Field label="Context" hint="Optional. State the question and the stakes.">
                  <Textarea
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                    placeholder="The board needs a recommendation before the exclusivity window closes."
                    rows={4}
                    maxLength={2000}
                  />
                </Field>

                <Field label="Impact">
                  <Select value={impact} onChange={(event) => setImpact(event.target.value)}>
                    {DECISION_IMPACTS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                </Field>

                {formError && (
                  <p role="alert" className="text-xs text-danger">
                    {formError}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={creating || title.trim().length === 0}
                >
                  {creating ? 'Adding…' : 'Add decision'}
                </Button>
              </form>
              </details>
            </Card>
          ) : (
            <Card>
              <p className="eyebrow">View-only access</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                You can read this workspace, but only owners, admins, and reviewers can add
                decisions or evidence.
              </p>
            </Card>
          )}

          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow">Members</p>
              <span className="font-mono text-xs text-subtle">{memberCount}</span>
            </div>

            {canManage && (
              <details className="border-y border-line py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-text">
                  Invite or add a member
                  <span className="font-mono text-xs text-accent">＋</span>
                </summary>
                <form
                  onSubmit={handleInviteMember}
                  className="mt-3 space-y-2"
                >
                <Input
                  type="email"
                  aria-label="Member email"
                  value={inviteEmail}
                  onChange={(event) => {
                    setInviteEmail(event.target.value)
                    setInviteLink('')
                  }}
                  placeholder="reviewer@firm.com"
                  maxLength={254}
                  required
                />
                <Select
                  aria-label="Member role"
                  value={inviteRole}
                  onChange={(event) => {
                    setInviteRole(event.target.value)
                    setInviteLink('')
                  }}
                  className="w-full"
                >
                  {assignableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    variant="secondary"
                    disabled={inviting || inviteEmail.trim().length === 0}
                  >
                    {inviting ? 'Adding…' : 'Add account'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={createInviteLink}
                    disabled={creatingInviteLink || inviteEmail.trim().length === 0}
                  >
                    {creatingInviteLink ? 'Creating…' : 'Create link'}
                  </Button>
                </div>
                <p className="text-xs text-subtle">
                  Add an existing Tarka account instantly, or create a one-time link for someone
                  new.
                </p>
                {memberError && (
                  <p role="alert" className="text-xs text-danger">
                    {memberError}
                  </p>
                )}
                {inviteLinkError && (
                  <p role="alert" className="text-xs text-danger">
                    {inviteLinkError}
                  </p>
                )}
                {inviteLink && (
                  <div className="space-y-1.5 rounded-[3px] border border-line bg-surface-2 p-2">
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        aria-label="Invite link"
                        value={inviteLink}
                        className="min-w-0 flex-1 font-mono text-xs"
                        onFocus={(event) => event.target.select()}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={copyInviteLink}
                      >
                        {copiedInviteLink ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                    <p className="text-xs text-subtle">
                      Send this link. It expires in 7 days and works once.
                    </p>
                  </div>
                )}
                </form>
              </details>
            )}

            <ul className="space-y-4">
              {workspace.memberships.map((membership) => (
                <MemberRow
                  key={membership.id}
                  workspaceId={workspace.id}
                  membership={membership}
                  canManage={canManage}
                  canManageOwners={canManageOwners}
                  isLastOwner={membership.role === 'OWNER' && ownerCount <= 1}
                  onUpdated={handleMemberUpdated}
                  onRemoved={handleMemberRemoved}
                />
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  )
}
