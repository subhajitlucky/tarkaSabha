'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Field'
import { RoleBadge } from '@/components/workspaces/badges'
import { WORKSPACE_ROLES } from '@/lib/workspace-roles'

export interface WorkspaceMember {
  id: string
  role: string
  user: { name: string | null; email: string | null }
}

export function MemberRow({
  workspaceId,
  membership,
  canManage,
  canManageOwners,
  isLastOwner,
  onUpdated,
  onRemoved,
}: {
  workspaceId: string
  membership: WorkspaceMember
  canManage: boolean
  canManageOwners: boolean
  isLastOwner: boolean
  onUpdated: (member: WorkspaceMember) => void
  onRemoved: (memberId: string) => void
}) {
  const [role, setRole] = useState(membership.role)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState('')

  const canEditThisMember =
    canManage && (membership.role !== 'OWNER' || canManageOwners)
  const availableRoles = canManageOwners
    ? WORKSPACE_ROLES
    : WORKSPACE_ROLES.filter((value) => value !== 'OWNER')

  const saveRole = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${membership.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'Could not update the role.')
        return
      }

      onUpdated({ ...membership, role: data.role })
    } catch (err) {
      console.error('Failed to update member role', err)
      setError('Could not update the role.')
    } finally {
      setSaving(false)
    }
  }

  const removeMember = async () => {
    const label = membership.user.name || membership.user.email || 'this member'
    if (!window.confirm(`Remove ${label} from this workspace?`)) return

    setRemoving(true)
    setError('')
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${membership.id}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'Could not remove the member.')
        return
      }

      onRemoved(membership.id)
    } catch (err) {
      console.error('Failed to remove member', err)
      setError('Could not remove the member.')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <li className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-text">
            {membership.user.name || membership.user.email || 'Unnamed member'}
          </p>
          {membership.user.name && membership.user.email && (
            <p className="truncate font-mono text-xs text-subtle">{membership.user.email}</p>
          )}
        </div>
        {!canEditThisMember && <RoleBadge role={membership.role} />}
      </div>

      {canEditThisMember && (
        <div className="space-y-2">
          <Select
            aria-label={`Role for ${membership.user.name || membership.user.email || 'member'}`}
            value={role}
            onChange={(event) => setRole(event.target.value)}
            disabled={isLastOwner}
            className="w-full"
          >
            {availableRoles.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={saveRole}
              disabled={saving || role === membership.role || isLastOwner}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="danger"
              className="flex-1"
              onClick={removeMember}
              disabled={removing || isLastOwner}
              title={isLastOwner ? 'A workspace needs at least one owner' : undefined}
            >
              {removing ? 'Removing…' : 'Remove'}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </li>
  )
}
