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
        eyebrow="Review rooms"
        title="Past review rooms"
        lede="Every review room you have convened, with the agents who sat on it."
        actions={
          <Link href="/debate">
            <Button variant="primary">New review</Button>
          </Link>
        }
      />

      {loading ? (
        <p className="py-20 text-center font-mono text-xs uppercase tracking-[0.14em] text-subtle">
          Loading…
        </p>
      ) : !isAuthenticated ? (
        <EmptyState
          title="Sign in to see your review rooms"
          description="Your review rooms are private to your account. Sign in to open the record, or look at the public sample first."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link href="/login?callbackUrl=/history">
                <Button variant="primary">Sign in</Button>
              </Link>
              <Link href="/demo">
                <Button variant="secondary">See a sample review</Button>
              </Link>
            </div>
          }
        />
      ) : chats.length === 0 ? (
        <EmptyState
          title="No review rooms yet"
          description="Open a review room, give the agents an objective, and the transcript will be filed here."
          action={
            <Link href="/debate">
              <Button variant="primary">Open the first one</Button>
            </Link>
          }
        />
      ) : (
        <div className="border-y border-line">
          {chats.map((chat) => {
            const participants = chat.participants ?? []
            return (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-line px-1 py-4 transition-colors last:border-b-0 hover:bg-surface-2"
              >
                <div className="min-w-0">
                  <h2 className="truncate font-display text-xl leading-tight text-text transition-colors group-hover:text-accent">
                    {chat.topic || chat.title}
                  </h2>
                  <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-subtle">
                    {participants.length} agent{participants.length === 1 ? '' : 's'}
                    <span className="mx-1.5">·</span>
                    {new Date(chat.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {chat.isAutoMode && <Badge tone="success">Running</Badge>}
                  <span className="font-mono text-sm text-accent opacity-0 transition-opacity group-hover:opacity-100">
                    →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
