'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Chat } from '@/types'
import { useAuth } from '@/components/AuthProvider'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { BarList, MetricCard } from '@/components/ui/DataViz'
import { EmptyState, PageHeader } from '@/components/ui/EmptyState'
import { formatDate, formatDateTime } from '@/components/workspaces/format'

const BLUEPRINT = [
  ['Brief', 'Objective, audience, deliverable spec', 'The question under review'],
  ['Council', 'Agents, roles, and tool access', 'Who is allowed to argue'],
  ['Debate', 'Transcript, disagreement, evidence calls', 'What was tested'],
  ['Verdict', 'Scored deliverable and selected candidate', 'What gets filed'],
]

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

  const totalSeats = chats.reduce(
    (total, chat) => total + (chat.participants?.length ?? 0),
    0
  )
  const running = chats.filter((chat) => chat.isAutoMode).length
  const latest = chats.reduce<string | null>((value, chat) => {
    if (!value) return chat.updatedAt.toString()
    return new Date(chat.updatedAt) > new Date(value) ? chat.updatedAt.toString() : value
  }, null)
  const chartItems = [...chats]
    .sort(
      (a, b) => (b.participants?.length ?? 0) - (a.participants?.length ?? 0)
    )
    .slice(0, 6)
    .map((chat, index) => ({
      label: chat.topic || chat.title,
      value: chat.participants?.length ?? 0,
      meta: `${chat.participants?.length ?? 0} agents`,
      color: `var(--chart-${(index % 5) + 1})`,
    }))

  return (
    <div className="mx-auto max-w-[90rem] px-5 py-14">
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
      ) : (
        <>
          <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Review rooms"
              value={chats.length}
              accent="var(--chart-1)"
              detail={`${running} running now`}
            />
            <MetricCard
              label="Council seats"
              value={totalSeats}
              accent="var(--chart-2)"
              detail={`Across ${chats.length} room${chats.length === 1 ? '' : 's'}`}
            />
            <MetricCard
              label="Latest review"
              value={latest ? formatDate(latest) : '—'}
              accent="var(--chart-3)"
              detail="Last activity in the record"
            />
            <MetricCard
              label="Mode"
              value={running > 0 ? 'Live' : chats.length > 0 ? 'Filed' : 'Ready'}
              accent="var(--chart-4)"
              detail="Server-run transcripts are preserved"
            />
          </div>

          {chats.length === 0 ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <Card flush className="overflow-hidden">
                <div className="border-b border-line p-5">
                  <p className="eyebrow">Review room blueprint</p>
                  <h2 className="mt-2 font-display text-2xl text-text">
                    What a room records
                  </h2>
                </div>
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line font-mono text-[0.6rem] uppercase tracking-[0.14em] text-subtle">
                      <th className="px-5 py-3 font-normal">Stage</th>
                      <th className="px-4 py-3 font-normal">What is captured</th>
                      <th className="px-5 py-3 font-normal">Durable output</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BLUEPRINT.map(([stage, captured, output]) => (
                      <tr key={stage} className="border-b border-line last:border-b-0">
                        <td className="px-5 py-4 font-mono text-xs text-accent">{stage}</td>
                        <td className="px-4 py-4 text-sm text-muted">{captured}</td>
                        <td className="px-5 py-4 text-sm text-text">{output}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>

              <Card className="self-start">
                <p className="eyebrow">Open the first room</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Give the council an objective and a deliverable. The transcript is filed here,
                  while the decision record remains the durable artifact.
                </p>
                <Link href="/debate" className="mt-5 block">
                  <Button variant="primary" className="w-full">
                    Open a review room
                  </Button>
                </Link>
                <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-subtle">
                  You need at least one provider key and one agent before a room can run.
                </p>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow">Council composition</p>
                    <h2 className="mt-2 font-display text-2xl text-text">
                      Agents per review room
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-subtle">{totalSeats} seats</span>
                </div>
                <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(14rem,0.7fr)]">
                  <BarList items={chartItems} />
                  <div className="border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                    <p className="eyebrow">On the record</p>
                    <div className="mt-3 space-y-4 text-sm">
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-muted">Rooms</span>
                        <span className="font-display text-xl text-text">{chats.length}</span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-muted">Running</span>
                        <span className="font-display text-xl text-text">{running}</span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-muted">Average council</span>
                        <span className="font-display text-xl text-text">
                          {(totalSeats / Math.max(1, chats.length)).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card flush className="overflow-hidden">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line p-5">
                  <div>
                    <p className="eyebrow">Review room register</p>
                    <h2 className="mt-2 font-display text-2xl text-text">
                      Filed transcripts
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-subtle">{chats.length} rooms</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-line font-mono text-[0.6rem] uppercase tracking-[0.14em] text-subtle">
                        <th className="px-5 py-3 font-normal">Room</th>
                        <th className="px-4 py-3 font-normal">Council</th>
                        <th className="px-4 py-3 font-normal">Messages</th>
                        <th className="px-4 py-3 font-normal">Status</th>
                        <th className="px-4 py-3 font-normal">Updated</th>
                        <th className="px-5 py-3 font-normal text-right">Open</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chats.map((chat) => {
                        const participants = chat.participants ?? []
                        return (
                          <tr
                            key={chat.id}
                            className="group border-b border-line transition-colors last:border-b-0 hover:bg-surface-2"
                          >
                            <td className="max-w-[26rem] px-5 py-4">
                              <Link
                                href={`/chat/${chat.id}`}
                                className="break-words font-display text-lg leading-tight text-text transition-colors group-hover:text-accent"
                              >
                                {chat.topic || chat.title}
                              </Link>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex -space-x-1.5">
                                  {participants.slice(0, 4).map((participant) => (
                                    <Avatar
                                      key={participant.id}
                                      name={participant.persona?.name ?? 'Agent'}
                                      size="xs"
                                      className="border-surface"
                                    />
                                  ))}
                                </div>
                                <span className="font-mono text-xs text-subtle">
                                  {participants.length}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 font-mono text-sm text-text">
                              {chat._count?.messages ?? 0}
                            </td>
                            <td className="px-4 py-4">
                              <Badge tone={chat.isAutoMode ? 'success' : 'outline'}>
                                {chat.isAutoMode ? 'Running' : 'Filed'}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 font-mono text-[0.62rem] uppercase tracking-[0.08em] text-subtle">
                              {formatDateTime(chat.updatedAt)}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <Link
                                href={`/chat/${chat.id}`}
                                className="font-mono text-xs text-accent transition-colors hover:text-accent-hover"
                              >
                                Open →
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
