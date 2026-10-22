'use client'

import { FormEvent, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { formatDate } from '@/components/workspaces/format'
import {
  MAX_PIN_EXPECTED,
  MAX_PIN_POINT,
  MAX_PIN_SCOPE,
  MAX_PIN_TEST,
  MAX_PIN_TRIGGER,
  MAX_PIN_VALUE,
} from '@/lib/workspace-roles'
import { DecisionPinRecord } from '@/types'

export function DecisionPins({
  decisionId,
  initialPins,
  canEdit,
}: {
  decisionId: string
  initialPins: DecisionPinRecord[]
  canEdit: boolean
}) {
  const [pins, setPins] = useState(initialPins)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [decisionPoint, setDecisionPoint] = useState('')
  const [chosenValue, setChosenValue] = useState('')
  const [separatingTest, setSeparatingTest] = useState('')
  const [expectedResult, setExpectedResult] = useState('')
  const [codeScope, setCodeScope] = useState('')
  const [supersessionTrigger, setSupersessionTrigger] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/decisions/${decisionId}/pins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decisionPoint,
          chosenValue,
          separatingTest,
          expectedResult,
          codeScope,
          supersessionTrigger,
        }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'Could not add the pin.')
        return
      }

      setPins((current) => [...current, data as DecisionPinRecord])
      setDecisionPoint('')
      setChosenValue('')
      setSeparatingTest('')
      setExpectedResult('')
      setCodeScope('')
      setSupersessionTrigger('')
      setOpen(false)
    } catch (err) {
      console.error('Failed to create decision pin', err)
      setError('Could not add the pin.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section aria-labelledby="pins-heading">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2
          id="pins-heading"
          className="font-mono text-xs uppercase tracking-[0.14em] text-subtle"
        >
          Decision pins
        </h2>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-subtle">{pins.length}</span>
          {canEdit && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setOpen((value) => !value)}
            >
              {open ? 'Cancel' : 'Add pin'}
            </Button>
          )}
        </div>
      </div>

      {open && canEdit && (
        <Card className="mb-3">
          <form onSubmit={submit} className="space-y-3">
            <Field label="Decision point">
              <Input
                value={decisionPoint}
                onChange={(event) => setDecisionPoint(event.target.value)}
                placeholder="Session validation point"
                maxLength={MAX_PIN_POINT}
                required
              />
            </Field>
            <Field label="Chosen value">
              <Textarea
                value={chosenValue}
                onChange={(event) => setChosenValue(event.target.value)}
                placeholder="Sessions are validated on every request."
                rows={2}
                maxLength={MAX_PIN_VALUE}
                required
              />
            </Field>
            <Field
              label="Separating test"
              hint="The input or test that distinguishes the chosen behavior from the alternative."
            >
              <Textarea
                value={separatingTest}
                onChange={(event) => setSeparatingTest(event.target.value)}
                placeholder="Request a protected route with no session cookie; expect 401."
                rows={2}
                maxLength={MAX_PIN_TEST}
                required
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Expected result">
                <Input
                  value={expectedResult}
                  onChange={(event) => setExpectedResult(event.target.value)}
                  placeholder="401 Unauthorized"
                  maxLength={MAX_PIN_EXPECTED}
                />
              </Field>
              <Field label="Code scope">
                <Input
                  value={codeScope}
                  onChange={(event) => setCodeScope(event.target.value)}
                  placeholder="src/middleware.ts"
                  maxLength={MAX_PIN_SCOPE}
                />
              </Field>
            </div>
            <Field label="Supersession trigger">
              <Textarea
                value={supersessionTrigger}
                onChange={(event) => setSupersessionTrigger(event.target.value)}
                placeholder="Revisit if session validation moves to the edge runtime."
                rows={2}
                maxLength={MAX_PIN_TRIGGER}
              />
            </Field>
            {error && (
              <p role="alert" className="text-xs text-danger">
                {error}
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={
                saving ||
                !decisionPoint.trim() ||
                !chosenValue.trim() ||
                !separatingTest.trim()
              }
            >
              {saving ? 'Adding…' : 'Add decision pin'}
            </Button>
          </form>
        </Card>
      )}

      {pins.length === 0 ? (
        <EmptyState
          title="No decision pins yet"
          description={
            canEdit
              ? 'A pin makes the decision testable: the chosen value, the separating test, and the expected result.'
              : 'A reviewer or owner will add a testable pin.'
          }
        />
      ) : (
        <div className="border-y border-line">
          {pins.map((pin) => (
            <div
              key={pin.id}
              className="space-y-2 border-b border-line py-5 last:border-b-0"
            >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg leading-snug text-text">
                    {pin.decisionPoint}
                  </h3>
                  <Badge tone={pin.status === 'ACTIVE' ? 'success' : 'outline'}>
                    {pin.status}
                  </Badge>
                  {pin.owner && (
                    <span className="ml-auto font-mono text-xs text-subtle">
                      {pin.owner.name || pin.owner.email || 'Owner'}
                    </span>
                  )}
                </div>

                <div>
                  <p className="eyebrow">Chosen value</p>
                  <p className="mt-1 text-sm leading-relaxed text-text">{pin.chosenValue}</p>
                </div>
                <div>
                  <p className="eyebrow">Separating test</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {pin.separatingTest}
                  </p>
                </div>
                {(pin.expectedResult || pin.codeScope) && (
                  <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-subtle">
                    {pin.expectedResult && <span>Expect: {pin.expectedResult}</span>}
                    {pin.codeScope && <span>Scope: {pin.codeScope}</span>}
                  </div>
                )}
                {pin.supersessionTrigger && (
                  <div>
                    <p className="eyebrow">Supersession trigger</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      {pin.supersessionTrigger}
                    </p>
                  </div>
                )}
                {(pin.lastRunAt || pin.lastRunResult) && (
                  <p className="font-mono text-xs text-subtle">
                    Last run {pin.lastRunAt ? formatDate(pin.lastRunAt) : '—'}
                    {pin.lastRunResult ? ` · ${pin.lastRunResult}` : ''}
                  </p>
                )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
