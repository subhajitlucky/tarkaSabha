'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
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
      <div className="mx-auto max-w-3xl px-5 py-14">
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
      <div className="mx-auto max-w-3xl px-5 py-14">
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

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
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
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/workspaces/${workspace.id}/activity`}>
              <Button variant="ghost" size="sm">
                Activity
              </Button>
            </Link>
            <RoleBadge role={workspace.role} />
          </div>
        }
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Decisions', value: decisionCount },
          { label: 'Evidence items', value: evidenceCount },
          { label: 'Sources', value: sourceCount },
          { label: 'Members', value: memberCount },
        ].map((stat) => (
          <Card key={stat.label} className="py-4">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-subtle">
              {stat.label}
            </p>
            <p className="mt-1 font-display text-2xl text-text">{stat.value}</p>
          </Card>
        ))}
      </div>

      <section aria-labelledby="sources-heading" className="mb-8">
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
          <form
            onSubmit={ingestSource}
            className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_auto]"
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
        )}

        {sourceError && (
          <p role="alert" className="mb-3 text-xs text-danger">
            {sourceError}
          </p>
        )}

        {workspace.sources.length === 0 ? (
          <EmptyState
            title="No sources ingested"
            description={
              canEdit
                ? 'Ingest a public GitHub repository to snapshot its files, commits, pull requests, and issues.'
                : 'A reviewer or owner will ingest the repository sources.'
            }
          />
        ) : (
          <ul className="space-y-2">
            {workspace.sources.map((source) => (
              <li key={source.id}>
                <Link
                  href={`/workspaces/${workspace.id}/sources/${source.id}`}
                  className="group block rounded-[4px] border border-line bg-surface p-4 transition-colors hover:border-accent-line"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-base text-text transition-colors group-hover:text-accent">
                      {source.owner}/{source.name}
                    </p>
                    <Badge
                      tone={
                        source.status === 'READY'
                          ? 'success'
                          : source.status === 'FAILED'
                            ? 'danger'
                            : 'neutral'
                      }
                    >
                      {source.status}
                    </Badge>
                    <span className="ml-auto font-mono text-xs text-subtle">
                      {formatDate(source.updatedAt)}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-subtle">
                    {source.ref}
                    {source.commitSha ? ` @ ${source.commitSha.slice(0, 7)}` : ''}
                    <span className="mx-1.5">·</span>
                    {source.fileCount} files
                    <span className="mx-1.5">·</span>
                    {source.commitCount} commits
                    <span className="mx-1.5">·</span>
                    {source.pullRequestCount}{' '}
                    {source.pullRequestCount === 1 ? 'PR' : 'PRs'}
                    <span className="mx-1.5">·</span>
                    {source.issueCount}{' '}
                    {source.issueCount === 1 ? 'issue' : 'issues'}
                  </p>
                  {source.error && <p className="mt-1 text-xs text-danger">{source.error}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="decision-list-heading">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2
              id="decision-list-heading"
              className="font-mono text-xs uppercase tracking-[0.14em] text-subtle"
            >
              Decisions
            </h2>
            <span className="font-mono text-xs text-subtle">{decisionCount}</span>
          </div>

          {workspace.decisions.length === 0 ? (
            <EmptyState
              title="No decisions in this room"
              description={
                canEdit
                  ? 'Add the first decision under review. Evidence and approvals will hang off it.'
                  : 'A reviewer or owner will add the first decision.'
              }
            />
          ) : (
            <ul className="space-y-3">
              {workspace.decisions.map((decision) => (
                <li key={decision.id}>
                  <Link
                    href={`/decisions/${decision.id}`}
                    className="group flex h-full flex-col rounded-[4px] border border-line bg-surface p-5 transition-colors hover:border-accent-line"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <DecisionStatusBadge status={decision.status} />
                      <ImpactBadge impact={decision.impact} />
                      <DebtBadge score={decision.debtScore ?? 0} />
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
                      <span className="ml-auto font-mono text-xs text-subtle">
                        {formatDate(decision.updatedAt)}
                      </span>
                    </div>

                    <h3 className="mt-3 font-display text-lg leading-snug text-text transition-colors group-hover:text-accent">
                      {decision.title}
                    </h3>

                    {decision.summary && (
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
                        {decision.summary}
                      </p>
                    )}

                    <p className="mt-auto pt-4 font-mono text-xs uppercase tracking-[0.1em] text-subtle">
                      {decision._count?.evidence ?? 0}{' '}
                      {(decision._count?.evidence ?? 0) === 1
                        ? 'evidence item'
                        : 'evidence items'}
                      <span className="mx-1.5">·</span>
                      {decision._count?.approvals ?? 0}{' '}
                      {(decision._count?.approvals ?? 0) === 1 ? 'approval' : 'approvals'}
                      <span className="mx-1.5">·</span>
                      Owner {decision.owner?.name || 'unassigned'}
                      {decision.revisitAt && (
                        <>
                          <span className="mx-1.5">·</span>
                          Revisit {formatDate(decision.revisitAt)}
                        </>
                      )}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          {canEdit ? (
            <Card className="space-y-4">
              <div>
                <p className="eyebrow">New decision</p>
                <h2 className="mt-2 font-display text-xl text-text">What is under review?</h2>
              </div>

              <form onSubmit={handleCreateDecision} className="space-y-4">
                <Field label="Decision">
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Proceed with the Kestrel acquisition"
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
              <form
                onSubmit={handleInviteMember}
                className="space-y-2 border-b border-line pb-4"
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

      <div className="mt-10">
        <WorkspaceDossierPanel
          workspaceId={workspace.id}
          initialDossiers={workspace.dossiers}
          canEdit={canEdit}
        />
      </div>
    </div>
  )
}
