'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Chat } from '@/types'
import { useAuth } from '@/components/AuthProvider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState, PageHeader } from '@/components/ui/EmptyState'

export default function HistoryPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [loaded, setLoaded] = useState(false)
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const loading = authLoading || (isAuthenticated && !loaded)

  useEffect(() => {
    if (authLoading || !isAuthenticated) return

    let cancelled = false

    const loadChats = async () => {
      try {
        const res = await fetch('/api/chats')
        if (cancelled) return
        if (!res.ok) {
          // 401 is handled by the auth provider; just render an empty list.
          if (res.status === 401) setChats([])
          return
        }
        const data = await res.json()
        if (cancelled) return
        setChats(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error('Failed to fetch history', e)
        if (!cancelled) setChats([])
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }

    loadChats()
    return () => {
      cancelled = true
    }
  }, [authLoading, isAuthenticated])

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <PageHeader
        eyebrow="Archive"
        title="Past proceedings"
        lede="Every council you have convened, with the agents who sat on it."
        actions={
          <Link href="/debate">
            <Button variant="primary">New council</Button>
          </Link>
        }
      />

      {loading ? (
        <p className="py-20 text-center font-mono text-xs uppercase tracking-[0.14em] text-subtle">
          Loading…
        </p>
      ) : !isAuthenticated ? (
        <EmptyState
          title="Sign in to see your archive"
          description="Your councils are private to your account. Sign in to open the record, or look at the public sample first."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link href="/login?callbackUrl=/history">
                <Button variant="primary">Sign in</Button>
              </Link>
              <Link href="/demo">
                <Button variant="secondary">See a sample council</Button>
              </Link>
            </div>
          }
        />
      ) : chats.length === 0 ? (
        <EmptyState
          title="Nothing on the record yet"
          description="Convene a council, give the agents an objective, and the transcript will be filed here."
          action={
            <Link href="/debate">
              <Button variant="primary">Convene the first one</Button>
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {chats.map((chat) => {
            const participants = chat.participants ?? []
            return (
              <li key={chat.id}>
                <Link
                  href={`/chat/${chat.id}`}
                  className="group flex h-full flex-col rounded-[4px] border border-line bg-surface p-4 transition-colors hover:border-accent-line"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex -space-x-1.5">
                      {participants.slice(0, 3).map((participant, index) => (
                        <span
                          key={participant.id ?? index}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface-2 font-mono text-xs text-muted"
                        >
                          {(participant.persona?.name || '?')
                            .split(/\s+/)
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((word) => word[0]?.toUpperCase() || '')
                            .join('')}
                        </span>
                      ))}
                      {participants.length > 3 && (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface-2 font-mono text-xs text-subtle">
                          +{participants.length - 3}
                        </span>
                      )}
                    </div>
                    {chat.isAutoMode && <Badge tone="success">Running</Badge>}
                  </div>

                  <h2 className="font-display text-[0.9375rem] leading-snug text-text transition-colors group-hover:text-accent">
                    {chat.topic || chat.title}
                  </h2>

                  <p className="mt-auto pt-3 font-mono text-xs uppercase tracking-[0.1em] text-subtle">
                    {participants.length} agent{participants.length === 1 ? '' : 's'}
                    <span className="mx-1.5">·</span>
                    {new Date(chat.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
