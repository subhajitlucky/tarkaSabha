import { cache } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { prisma } from '@/lib/prisma'
import type { CriterionScore } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, Rule } from '@/components/ui/Card'
import { EmptyState, PageHeader } from '@/components/ui/EmptyState'

export const dynamic = 'force-dynamic'

const getSharedChat = cache(async (id: string) => {
  return prisma.chat.findFirst({
    where: { id, isPublic: true },
    select: {
      id: true,
      title: true,
      topic: true,
      mode: true,
      objective: true,
      deliverableSpec: true,
      audience: true,
      createdAt: true,
      updatedAt: true,
      participants: {
        select: {
          persona: {
            select: {
              name: true,
              bio: true,
              role: true,
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
      messages: {
        select: {
          id: true,
          content: true,
          role: true,
          personaName: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      artifacts: {
        select: {
          id: true,
          title: true,
          content: true,
          score: true,
          breakdown: true,
          selected: true,
          round: true,
          angle: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const chat = await getSharedChat(id)

  if (!chat) {
    return { title: 'Shared council not found · Tarka Sabha' }
  }

  const description =
    chat.objective ||
    chat.topic ||
    'A read-only council run: roles, disagreement, a scored deliverable, and the candidates that lost.'

  return {
    title: `${chat.title} · Tarka Sabha`,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: chat.title,
      description,
      type: 'article',
    },
  }
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(value)
}

function breakdownOf(value: unknown): CriterionScore[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is CriterionScore => {
    if (!entry || typeof entry !== 'object') return false
    const candidate = entry as Partial<CriterionScore>
    return (
      typeof candidate.label === 'string' &&
      typeof candidate.score === 'number' &&
      typeof candidate.reason === 'string'
    )
  })
}

export default async function SharedChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const chat = await getSharedChat(id)

  if (!chat) notFound()

  const ranked = [...chat.artifacts].sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
  const best = ranked.find((artifact) => artifact.selected) ?? ranked[0]
  const others = ranked.filter((artifact) => artifact !== best)
  const breakdown = breakdownOf(best?.breakdown)

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <PageHeader
        eyebrow="Shared council record"
        title={chat.title}
        lede={chat.objective || chat.topic || 'A read-only record of a council run.'}
        actions={
          <Link href="/debate">
            <Button variant="primary">Convene your own</Button>
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge tone="accent">Public · read-only</Badge>
        <span className="text-xs text-subtle">Recorded {formatDate(chat.createdAt)}</span>
        <Link
          href="/about"
          className="text-sm text-muted underline decoration-line underline-offset-4 hover:text-accent"
        >
          How the council works
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card raised>
            <Rule label="Brief" className="mb-4" />
            <dl className="space-y-4">
              {chat.topic && (
                <div>
                  <dt className="eyebrow">Topic</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-text">{chat.topic}</dd>
                </div>
              )}
              <div>
                <dt className="eyebrow">Objective</dt>
                <dd className="mt-1 text-sm leading-relaxed text-text">
                  {chat.objective || 'No objective recorded.'}
                </dd>
              </div>
              {chat.deliverableSpec && (
                <div>
                  <dt className="eyebrow">Deliverable</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted">{chat.deliverableSpec}</dd>
                </div>
              )}
              {chat.audience && (
                <div>
                  <dt className="eyebrow">Audience</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted">{chat.audience}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card flush>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
              <Rule label="Transcript" className="flex-1" />
              <span className="text-xs text-subtle">
                {chat.messages.length} message{chat.messages.length === 1 ? '' : 's'}
              </span>
            </div>
            {chat.messages.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No transcript yet" description="This run was shared before any turns were recorded." />
              </div>
            ) : (
              <ol className="divide-y divide-line">
                {chat.messages.map((message) => {
                  const speaker =
                    message.personaName ||
                    (message.role === 'user' ? 'Participant' : message.role === 'system' ? 'System' : 'Council')
                  return (
                    <li key={message.id} className="p-5">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="font-display text-base text-text">{speaker}</span>
                        {message.personaName && <span className="eyebrow">Council member</span>}
                      </div>
                      <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-muted">
                        {message.content}
                      </p>
                    </li>
                  )
                })}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <Rule label="The council" className="mb-4" />
            {chat.participants.length === 0 ? (
              <p className="text-sm leading-relaxed text-muted">No council members recorded.</p>
            ) : (
              <ul className="space-y-4">
                {chat.participants.map(({ persona }) => (
                  <li key={persona.name}>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-display text-base text-text">{persona.name}</span>
                      {persona.role && <Badge tone="outline">{persona.role}</Badge>}
                    </div>
                    {persona.bio && (
                      <p className="mt-1 text-sm leading-relaxed text-muted">{persona.bio}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {best && (
            <Card>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Rule label="Selected answer" />
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {best.angle ? `${best.angle} candidate` : best.title}
                    {best.round ? ` · round ${best.round}` : ''}
                  </p>
                </div>
                {best.score != null && (
                  <span className="font-display text-3xl text-accent">{best.score.toFixed(1)}</span>
                )}
              </div>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-text">
                {best.content}
              </div>
              {breakdown.length > 0 && (
                <div className="mt-5 space-y-2.5 border-t border-line pt-4">
                  <p className="eyebrow mb-2">Rubric</p>
                  {breakdown.map((criterion) => (
                    <div key={criterion.label} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-3">
                      <span className="text-xs text-muted">{criterion.label}</span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <span
                          className="block h-full rounded-full bg-accent"
                          style={{ width: `${Math.max(0, Math.min(10, criterion.score)) * 10}%` }}
                        />
                      </span>
                      <span className="text-right font-mono text-xs text-muted">
                        {criterion.score.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {others.length > 0 && (
            <Card>
              <Rule label="Candidates considered" className="mb-4" />
              <ul className="space-y-3">
                {others.map((candidate) => (
                  <li key={candidate.id}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted">{candidate.angle || candidate.title}</span>
                      <span className="font-mono text-xs text-muted">
                        {candidate.score != null ? candidate.score.toFixed(1) : '—'}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-subtle">
                      {candidate.content}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <Card className="mt-6">
        <p className="text-sm leading-relaxed text-muted">
          This is a read-only snapshot shared by the owner. Provider keys, account details,
          and private settings are not included.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/debate">
            <Button variant="primary">Run a council</Button>
          </Link>
          <Link href="/demo">
            <Button variant="secondary">See a sample</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
