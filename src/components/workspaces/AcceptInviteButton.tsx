'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export function AcceptInviteButton({
  token,
  workspaceId,
}: {
  token: string
  workspaceId: string
}) {
  const router = useRouter()
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')

  const accept = async () => {
    setAccepting(true)
    setError('')

    try {
      const res = await fetch(`/api/invites/${token}/accept`, { method: 'POST' })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'Could not accept the invitation.')
        return
      }

      router.push(`/workspaces/${workspaceId}`)
      router.refresh()
    } catch (err) {
      console.error('Failed to accept invitation', err)
      setError('Could not accept the invitation.')
    } finally {
      setAccepting(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="primary"
        className="w-full"
        onClick={accept}
        disabled={accepting}
      >
        {accepting ? 'Joining…' : 'Join workspace'}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
