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
import { DecisionPins } from '@/components/decisions/DecisionPins'
import { ReportShareControl } from '@/components/reports/ReportShareControl'
import {
  ConfidenceBadge,
  DebtBadge,
  DecisionStatusBadge,
  EvidenceStatusBadge,
  ImpactBadge,
  RoleBadge,
} from '@/components/workspaces/badges'
import { formatDate } from '@/components/workspaces/format'
import { scoreDecisionDebt } from '@/lib/decision-debt'
import {
  CONFIDENCES,
  DECISION_STATUSES,
  EVIDENCE_KINDS,
  EVIDENCE_STATUSES,
  MAX_APPROVAL_NOTE,
  MAX_OUTCOME_SUMMARY,
  OUTCOME_STATUSES,
  canEditDecisions,
} from '@/lib/workspace-roles'
import {
  ApprovalRecord,
  Chat,
  DecisionDetail,
  EvidenceRecord,
  ReportRecord,
  WorkspaceSnapshotOption,
} from '@/types'

function ApprovalBadge({ status }: { status: string }) {
  const tone = status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'danger' : 'neutral'
  return <Badge tone={tone}>{status}</Badge>
}

function withDebt(
  decision: DecisionDetail,
  patch: Partial<DecisionDetail>
): DecisionDetail {
  const next = { ...decision, ...patch }
  const debt = scoreDecisionDebt({
    status: next.status,
    impact: next.impact,
    evidence: next.evidence,
    approvals: next.approvals,
  })

  return {
    ...next,
    debtScore: debt.score,
    debtRationale: debt.rationale,
    scoredAt: new Date().toISOString(),
  }
}

export default function DecisionPage() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [decision, setDecision] = useState<DecisionDetail | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [notFound, setNotFound] = useState(false)

  const [statusDraft, setStatusDraft] = useState('DRAFT')
  const [savingStatus, setSavingStatus] = useState(false)
  const [statusError, setStatusError] = useState('')

  const [reviewRooms, setReviewRooms] = useState<Chat[]>([])
  const [selectedRoom, setSelectedRoom] = useState('')
  const [attachingRoom, setAttachingRoom] = useState(false)
  const [roomError, setRoomError] = useState('')

  const [approvalNote, setApprovalNote] = useState('')
  const [recordingApproval, setRecordingApproval] = useState<string | null>(null)
  const [approvalError, setApprovalError] = useState('')

  const [generatingReport, setGeneratingReport] = useState(false)
  const [reportError, setReportError] = useState('')

  const [outcomeDraft, setOutcomeDraft] = useState('')
  const [outcomeSummaryDraft, setOutcomeSummaryDraft] = useState('')
  const [revisitAtDraft, setRevisitAtDraft] = useState('')
  const [savingOutcome, setSavingOutcome] = useState(false)
  const [outcomeError, setOutcomeError] = useState('')

  const [snapshots, setSnapshots] = useState<WorkspaceSnapshotOption[]>([])
  const [selectedSnapshotId, setSelectedSnapshotId] = useState('')
  const [kind, setKind] = useState('CODE')
  const [source, setSource] = useState('')
  const [commit, setCommit] = useState('')
  const [quote, setQuote] = useState('')
  const [sha256, setSha256] = useState('')
  const [evidenceStatus, setEvidenceStatus] = useState('VERIFIED')
  const [confidence, setConfidence] = useState('MEDIUM')
  const [addingEvidence, setAddingEvidence] = useState(false)
  const [evidenceError, setEvidenceError] = useState('')

  const loading = authLoading || (isAuthenticated && !loaded)

  useEffect(() => {
    if (authLoading || !isAuthenticated || !id) return

    let cancelled = false

    const loadDecision = async () => {
      setLoaded(false)
      setLoadError('')
      setNotFound(false)

      try {
        const [res, roomsRes] = await Promise.all([
          fetch(`/api/decisions/${id}`, { cache: 'no-store' }),
          fetch('/api/chats?limit=50', { cache: 'no-store' }),
        ])
        const data = await res.json().catch(() => null)

        if (cancelled) return

        if (res.status === 404) {
          setNotFound(true)
          setDecision(null)
          return
        }

        if (!res.ok) {
          setLoadError(data?.error || 'Could not load this decision.')
          return
        }

        if (roomsRes.ok) {
          const rooms = await roomsRes.json().catch(() => null)
          setReviewRooms(Array.isArray(rooms) ? rooms : [])
        }

        const loadedDecision = data as DecisionDetail
        setDecision(loadedDecision)
        setStatusDraft(loadedDecision.status)
        setOutcomeDraft(loadedDecision.outcome || '')
        setOutcomeSummaryDraft(loadedDecision.outcomeSummary || '')
        setRevisitAtDraft(loadedDecision.revisitAt?.slice(0, 10) || '')

        if (loadedDecision.role !== 'VIEWER') {
          const snapshotsRes = await fetch(
            `/api/workspaces/${loadedDecision.workspaceId}/snapshots`,
            { cache: 'no-store' }
          )
          if (snapshotsRes.ok) {
            const list = await snapshotsRes.json().catch(() => null)
            if (!cancelled) setSnapshots(Array.isArray(list) ? list : [])
          }
        }
      } catch (error) {
        console.error('Failed to fetch decision', error)
        if (!cancelled) setLoadError('Could not load this decision.')
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }

    loadDecision()
    return () => {
      cancelled = true
    }
  }, [authLoading, id, isAuthenticated])

  const handleSaveStatus = async () => {
    if (!decision) return
    setSavingStatus(true)
    setStatusError('')

    try {
      const res = await fetch(`/api/decisions/${decision.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusDraft }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setStatusError(data?.error || 'Could not update the review state.')
        return
      }

      setDecision((current) =>
        current
          ? withDebt(current, { status: data.status, updatedAt: data.updatedAt })
          : current
      )
    } catch (error) {
      console.error('Failed to update decision status', error)
      setStatusError('Could not update the review state.')
    } finally {
      setSavingStatus(false)
    }
  }

  const selectSnapshot = (snapshotId: string) => {
    setSelectedSnapshotId(snapshotId)
    const snapshot = snapshots.find((item) => item.id === snapshotId)
    if (!snapshot) return

    setSource(snapshot.path)
    setCommit(
      snapshot.kind === 'COMMIT'
        ? snapshot.sha ?? ''
        : snapshot.source.commitSha ?? ''
    )
    setSha256(snapshot.sha256 ?? '')

    if (snapshot.kind === 'COMMIT') {
      setKind('COMMIT')
    } else if (snapshot.kind === 'PULL_REQUEST' || snapshot.kind === 'ISSUE') {
      setKind('OTHER')
    } else {
      setKind(/\.(md|mdx|rst|txt|adoc)$/i.test(snapshot.path) ? 'DOC' : 'CODE')
    }
  }

  const handleAddEvidence = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!decision) return

    setAddingEvidence(true)
    setEvidenceError('')

    try {
      const res = await fetch(`/api/decisions/${decision.id}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          source,
          commit,
          quote,
          sha256,
          status: evidenceStatus,
          confidence,
          snapshotId: selectedSnapshotId || null,
        }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setEvidenceError(data?.error || 'Could not add the evidence.')
        return
      }

      const created = data as EvidenceRecord
      setDecision((current) =>
        current
          ? withDebt(current, { evidence: [created, ...current.evidence] })
          : current
      )
      setSource('')
      setCommit('')
      setQuote('')
      setSha256('')
      setEvidenceStatus('VERIFIED')
      setConfidence('MEDIUM')
      setSelectedSnapshotId('')
    } catch (error) {
      console.error('Failed to add evidence', error)
      setEvidenceError('Could not add the evidence.')
    } finally {
      setAddingEvidence(false)
    }
  }

  const saveReviewRoom = async (reviewRoomId: string | null) => {
    if (!decision) return
    setAttachingRoom(true)
    setRoomError('')

    try {
      const res = await fetch(`/api/decisions/${decision.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewRoomId }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setRoomError(data?.error || 'Could not update the review room.')
        return
      }

      setDecision((current) =>
        current
          ? {
              ...current,
              reviewRoom: data.reviewRoom,
              updatedAt: data.updatedAt,
            }
          : current
      )
      setSelectedRoom('')
    } catch (error) {
      console.error('Failed to update review room', error)
      setRoomError('Could not update the review room.')
    } finally {
      setAttachingRoom(false)
    }
  }

  const recordApproval = async (status: 'APPROVED' | 'REJECTED') => {
    if (!decision) return
    setRecordingApproval(status)
    setApprovalError('')

    try {
      const res = await fetch(`/api/decisions/${decision.id}/approvals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note: approvalNote }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setApprovalError(data?.error || 'Could not record the approval.')
        return
      }

      const created = data as ApprovalRecord
      setDecision((current) =>
        current
          ? withDebt(current, { approvals: [created, ...current.approvals] })
          : current
      )
      setApprovalNote('')
    } catch (error) {
      console.error('Failed to record approval', error)
      setApprovalError('Could not record the approval.')
    } finally {
      setRecordingApproval(null)
    }
  }

  const generateReport = async () => {
    if (!decision) return
    setGeneratingReport(true)
    setReportError('')

    try {
      const res = await fetch(`/api/decisions/${decision.id}/reports`, {
        method: 'POST',
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setReportError(data?.error || 'Could not generate the report.')
        return
      }

      const created = data as ReportRecord
      setDecision((current) =>
        current ? { ...current, reports: [created, ...current.reports] } : current
      )
    } catch (error) {
      console.error('Failed to generate report', error)
      setReportError('Could not generate the report.')
    } finally {
      setGeneratingReport(false)
    }
  }

  const saveOutcome = async () => {
    if (!decision) return
    setSavingOutcome(true)
    setOutcomeError('')

    try {
      const res = await fetch(`/api/decisions/${decision.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome: outcomeDraft || null,
          outcomeSummary: outcomeSummaryDraft,
          revisitAt: revisitAtDraft || null,
        }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setOutcomeError(data?.error || 'Could not save the outcome.')
        return
      }

      setDecision((current) =>
        current
          ? {
              ...current,
              outcome: data.outcome,
              outcomeSummary: data.outcomeSummary,
              outcomeAt: data.outcomeAt,
              revisitAt: data.revisitAt,
              updatedAt: data.updatedAt,
            }
          : current
      )
    } catch (err) {
      console.error('Failed to save outcome', err)
      setOutcomeError('Could not save the outcome.')
    } finally {
      setSavingOutcome(false)
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
          title="Sign in to open this decision"
          description="Decision records are private to workspace members."
          action={
            <Link href={`/login?callbackUrl=${encodeURIComponent(`/decisions/${id}`)}`}>
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
          title="Decision not found"
          description="It may have been removed, or you may not be a member of its workspace."
          action={
            <Link href="/workspaces">
              <Button variant="secondary">Back to workspaces</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (!decision) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-14">
        <p role="alert" className="rounded-[4px] border border-line bg-surface p-5 text-sm text-danger">
          {loadError || 'Could not load this decision.'}
        </p>
      </div>
    )
  }

  const canEdit = canEditDecisions(decision.role)

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <div className="mb-6 flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-subtle">
        <Link href="/workspaces" className="transition-colors hover:text-accent">
          Workspaces
        </Link>
        <span>/</span>
        <Link
          href={`/workspaces/${decision.workspace.id}`}
          className="transition-colors hover:text-accent"
        >
          {decision.workspace.name}
        </Link>
      </div>

      <PageHeader
        eyebrow="Decision record"
        title={decision.title}
        lede={decision.summary || 'No context has been added to this decision yet.'}
        actions={<RoleBadge role={decision.role} />}
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="py-4">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-subtle">State</p>
            <div className="mt-2">
              <DecisionStatusBadge status={decision.status} />
            </div>
          </Card>
          <Card className="py-4">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-subtle">Impact</p>
            <div className="mt-2">
              <ImpactBadge impact={decision.impact} />
            </div>
          </Card>
          <Card className="py-4">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-subtle">Debt</p>
            <div className="mt-2">
              <DebtBadge score={decision.debtScore} />
            </div>
          </Card>
          <Card className="py-4">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-subtle">Owner</p>
            <p className="mt-2 truncate text-sm text-text">
              {decision.owner?.name || decision.owner?.email || 'Unassigned'}
            </p>
          </Card>
          <Card className="py-4">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-subtle">Updated</p>
            <p className="mt-2 text-sm text-text">{formatDate(decision.updatedAt)}</p>
          </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-10">
          <section aria-labelledby="evidence-heading">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2
              id="evidence-heading"
              className="font-mono text-xs uppercase tracking-[0.14em] text-subtle"
            >
              Evidence
            </h2>
            <span className="font-mono text-xs text-subtle">{decision.evidence.length}</span>
          </div>

          {decision.evidence.length === 0 ? (
            <EmptyState
              title="No evidence on the record"
              description={
                canEdit
                  ? 'Add a source-backed quote from code, a commit, a document, or a test. The source and quote are the minimum.'
                  : 'A reviewer or owner will add the evidence for this decision.'
              }
            />
          ) : (
            <ul className="space-y-3">
              {decision.evidence.map((item) => (
                <li key={item.id}>
                  <Card className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="outline">{item.kind}</Badge>
                      <EvidenceStatusBadge status={item.status} />
                      <ConfidenceBadge confidence={item.confidence} />
                      <span className="ml-auto font-mono text-xs text-subtle">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <p className="break-words font-mono text-xs text-muted">{item.source}</p>

                    {item.snapshot && (
                      <a
                        href={item.snapshot.url || item.snapshot.path}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block font-mono text-xs text-accent transition-colors hover:underline"
                      >
                        Linked snapshot · {item.snapshot.path}
                      </a>
                    )}

                    <blockquote className="border-l-2 border-accent-line pl-3 text-sm leading-relaxed text-text whitespace-pre-wrap">
                      {item.quote}
                    </blockquote>

                    {(item.commit || item.sha256) && (
                      <div className="space-y-1 border-t border-line pt-2 font-mono text-xs text-subtle">
                        {item.commit && <p className="break-all">commit {item.commit}</p>}
                        {item.sha256 && <p className="break-all">sha256 {item.sha256}</p>}
                      </div>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          )}
          </section>

          <DecisionPins
            decisionId={decision.id}
            initialPins={decision.pins}
            canEdit={canEdit}
          />
        </div>

        <aside className="space-y-4">
          <Card className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="eyebrow">Decision debt</p>
              <DebtBadge score={decision.debtScore} />
            </div>
            <p className="font-display text-2xl text-text">{decision.debtScore}/100</p>
            <p className="whitespace-pre-line text-xs leading-relaxed text-muted">
              {decision.debtRationale || 'No debt rationale recorded yet.'}
            </p>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="eyebrow">Outcome & revisit</p>
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

            {canEdit ? (
              <>
                <Field label="Outcome">
                  <Select
                    value={outcomeDraft}
                    onChange={(event) => setOutcomeDraft(event.target.value)}
                  >
                    <option value="">Not recorded</option>
                    {OUTCOME_STATUSES.map((outcome) => (
                      <option key={outcome} value={outcome}>
                        {outcome}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Revisit date">
                  <Input
                    type="date"
                    value={revisitAtDraft}
                    onChange={(event) => setRevisitAtDraft(event.target.value)}
                  />
                </Field>
                <Field label="Outcome summary">
                  <Textarea
                    value={outcomeSummaryDraft}
                    onChange={(event) => setOutcomeSummaryDraft(event.target.value)}
                    placeholder="What happened when the decision was tested in practice?"
                    rows={3}
                    maxLength={MAX_OUTCOME_SUMMARY}
                  />
                </Field>
                {outcomeError && (
                  <p role="alert" className="text-xs text-danger">
                    {outcomeError}
                  </p>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={saveOutcome}
                  disabled={savingOutcome}
                >
                  {savingOutcome ? 'Saving…' : 'Save outcome'}
                </Button>
              </>
            ) : (
              <div className="space-y-2 text-sm leading-relaxed text-muted">
                <p>Outcome: {decision.outcome || 'Not recorded'}</p>
                <p>
                  Revisit:{' '}
                  {decision.revisitAt ? formatDate(decision.revisitAt) : 'Not scheduled'}
                </p>
                {decision.outcomeSummary && <p>{decision.outcomeSummary}</p>}
              </div>
            )}
          </Card>

          {canEdit ? (
            <Card className="space-y-4">
              <div>
                <p className="eyebrow">Review state</p>
                <h2 className="mt-2 font-display text-xl text-text">Move the decision</h2>
              </div>

              <Field label="State">
                <Select
                  value={statusDraft}
                  onChange={(event) => setStatusDraft(event.target.value)}
                >
                  {DECISION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll('_', ' ')}
                    </option>
                  ))}
                </Select>
              </Field>

              {statusError && (
                <p role="alert" className="text-xs text-danger">
                  {statusError}
                </p>
              )}

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleSaveStatus}
                disabled={savingStatus || statusDraft === decision.status}
              >
                {savingStatus ? 'Saving…' : 'Save state'}
              </Button>
            </Card>
          ) : (
            <Card>
              <p className="eyebrow">View-only access</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                You can read this decision and its evidence, but reviewers, admins, and owners
                make changes.
              </p>
            </Card>
          )}

          {canEdit && (
            <Card className="space-y-4">
              <div>
                <p className="eyebrow">Add evidence</p>
                <h2 className="mt-2 font-display text-xl text-text">Put a source on record</h2>
              </div>

              <form onSubmit={handleAddEvidence} className="space-y-4">
                <Field
                  label="Source snapshot"
                  hint={
                    snapshots.length === 0
                      ? 'No snapshots ingested yet. Add a source from the workspace first.'
                      : 'Optional. Locks the source path, commit, and hash to an ingested snapshot.'
                  }
                >
                  <Select
                    aria-label="Source snapshot"
                    value={selectedSnapshotId}
                    onChange={(event) => selectSnapshot(event.target.value)}
                  >
                    <option value="">Manual source</option>
                    {snapshots.map((snapshot) => (
                      <option key={snapshot.id} value={snapshot.id}>
                        {snapshot.source.owner}/{snapshot.source.name} · {snapshot.kind} ·{' '}
                        {snapshot.path}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Kind">
                  <Select value={kind} onChange={(event) => setKind(event.target.value)}>
                    {EVIDENCE_KINDS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Source" hint="Path, document, or URL.">
                  <Input
                    value={source}
                    onChange={(event) => {
                      setSource(event.target.value)
                      setSelectedSnapshotId('')
                    }}
                    placeholder="src/auth/session.ts:42"
                    maxLength={500}
                    required
                  />
                </Field>

                <Field label="Quote" hint="The exact line or passage that supports the claim.">
                  <Textarea
                    value={quote}
                    onChange={(event) => setQuote(event.target.value)}
                    placeholder="Sessions are validated on every request."
                    rows={4}
                    maxLength={2000}
                    required
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <Field label="Commit" hint="Optional.">
                    <Input
                      value={commit}
                      onChange={(event) => setCommit(event.target.value)}
                      placeholder="a1b2c3d"
                      maxLength={120}
                    />
                  </Field>

                  <Field label="SHA-256" hint="Optional.">
                    <Input
                      value={sha256}
                      onChange={(event) => setSha256(event.target.value)}
                      placeholder="64-character hash"
                      maxLength={128}
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <Field label="Evidence status">
                    <Select
                      value={evidenceStatus}
                      onChange={(event) => setEvidenceStatus(event.target.value)}
                    >
                      {EVIDENCE_STATUSES.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Confidence">
                    <Select
                      value={confidence}
                      onChange={(event) => setConfidence(event.target.value)}
                    >
                      {CONFIDENCES.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                {evidenceError && (
                  <p role="alert" className="text-xs text-danger">
                    {evidenceError}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={addingEvidence || !source.trim() || !quote.trim()}
                >
                  {addingEvidence ? 'Adding…' : 'Add evidence'}
                </Button>
              </form>
            </Card>
          )}

          <Card className="space-y-3">
            <p className="eyebrow">Review room</p>
            {decision.reviewRoom ? (
              <>
                <p className="text-sm leading-relaxed text-text">{decision.reviewRoom.title}</p>
                <Link href={`/chat/${decision.reviewRoom.id}`}>
                  <Button variant="secondary" className="w-full">
                    Open review room
                  </Button>
                </Link>
                {canEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => saveReviewRoom(null)}
                    disabled={attachingRoom}
                  >
                    {attachingRoom ? 'Detaching…' : 'Detach'}
                  </Button>
                )}
              </>
            ) : canEdit ? (
              <>
                <p className="text-sm leading-relaxed text-muted">
                  Attach a review room to keep the transcript with this decision.
                </p>
                {reviewRooms.length === 0 ? (
                  <Link href="/debate">
                    <Button variant="secondary" className="w-full">
                      Create a review room
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Select
                      aria-label="Review room"
                      value={selectedRoom}
                      onChange={(event) => setSelectedRoom(event.target.value)}
                    >
                      <option value="">Choose a room…</option>
                      {reviewRooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.title || room.topic || 'Untitled review'}
                        </option>
                      ))}
                    </Select>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={() => saveReviewRoom(selectedRoom)}
                      disabled={!selectedRoom || attachingRoom}
                    >
                      {attachingRoom ? 'Attaching…' : 'Attach review room'}
                    </Button>
                  </>
                )}
              </>
            ) : (
              <p className="text-sm leading-relaxed text-muted">No review room attached.</p>
            )}
            {roomError && (
              <p role="alert" className="text-xs text-danger">
                {roomError}
              </p>
            )}
          </Card>

          <Card className="space-y-3">
            <p className="eyebrow">Approvals</p>

            {canEdit && (
              <div className="space-y-2 border-b border-line pb-3">
                <Textarea
                  aria-label="Approval note"
                  value={approvalNote}
                  onChange={(event) => setApprovalNote(event.target.value)}
                  placeholder="Why are you approving or rejecting this decision?"
                  rows={2}
                  maxLength={MAX_APPROVAL_NOTE}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() => recordApproval('APPROVED')}
                    disabled={recordingApproval !== null}
                  >
                    {recordingApproval === 'APPROVED' ? 'Approving…' : 'Approve'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() => recordApproval('REJECTED')}
                    disabled={recordingApproval !== null}
                  >
                    {recordingApproval === 'REJECTED' ? 'Rejecting…' : 'Reject'}
                  </Button>
                </div>
                <p className="text-xs text-subtle">
                  Records your role and a SHA-256 hash of the decision and evidence snapshot.
                </p>
                {approvalError && (
                  <p role="alert" className="text-xs text-danger">
                    {approvalError}
                  </p>
                )}
              </div>
            )}

            {decision.approvals.length === 0 ? (
              <p className="text-sm leading-relaxed text-muted">No approvals recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {decision.approvals.map((approval) => (
                  <li key={approval.id} className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-text">
                        {approval.actor?.name || approval.actor?.email || 'Reviewer'}
                      </span>
                      <ApprovalBadge status={approval.status} />
                    </div>
                    <p className="font-mono text-xs uppercase tracking-[0.1em] text-subtle">
                      {approval.role}
                      <span className="mx-1.5">·</span>
                      {formatDate(approval.decidedAt || approval.createdAt)}
                    </p>
                    {approval.note && (
                      <p className="text-sm leading-relaxed text-muted">{approval.note}</p>
                    )}
                    {approval.contentHash && (
                      <p
                        className="break-all font-mono text-[0.65rem] text-subtle"
                        title={approval.contentHash}
                      >
                        hash {approval.contentHash.slice(0, 16)}…
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow">Reports</p>
              <span className="font-mono text-xs text-subtle">{decision.reports.length}</span>
            </div>

            {canEdit && (
              <div className="space-y-2 border-b border-line pb-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={generateReport}
                  disabled={generatingReport || decision.evidence.length === 0}
                >
                  {generatingReport ? 'Generating…' : 'Generate evidence report'}
                </Button>
                {decision.evidence.length === 0 && (
                  <p className="text-xs text-subtle">
                    Add at least one evidence item before generating a report.
                  </p>
                )}
                {reportError && (
                  <p role="alert" className="text-xs text-danger">
                    {reportError}
                  </p>
                )}
              </div>
            )}

            {decision.reports.length === 0 ? (
              <p className="text-sm leading-relaxed text-muted">No report generated yet.</p>
            ) : (
              <ul className="space-y-4">
                {decision.reports.map((report) => (
                  <li key={report.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-text">Version {report.version}</p>
                      <Badge tone={report.status === 'PUBLISHED' ? 'success' : 'neutral'}>
                        {report.status}
                      </Badge>
                    </div>
                    <p className="font-mono text-xs text-subtle">
                      {formatDate(report.createdAt)}
                      {report.contentHash && ` · ${report.contentHash.slice(0, 12)}…`}
                    </p>
                    <a
                      href={`/api/reports/${report.id}`}
                      className="inline-block font-mono text-xs text-accent transition-colors hover:underline"
                    >
                      Download .md
                    </a>
                    {canEdit && <ReportShareControl reportId={report.id} />}
                    {report.content && (
                      <details>
                        <summary className="cursor-pointer font-mono text-xs text-muted">
                          Preview
                        </summary>
                        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-[3px] border border-line bg-surface-2 p-3 font-mono text-xs leading-relaxed text-muted">
                          {report.content}
                        </pre>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </div>
  )
}
