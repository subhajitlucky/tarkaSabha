'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Persona, Chat, Provider, WorkspaceSummary } from '@/types'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Card, Rule } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

/** The four stages, used as both the hero specimen and the "how it works" list. */
const STAGES = [
  {
    n: '01',
    title: 'Frame the decision',
    body: 'Name what is under review, who owns it, and how much it matters to the deal.',
  },
  {
    n: '02',
    title: 'Attach the evidence',
    body: 'Record the code path, commit, document, or test — with the exact quote and a hash where possible.',
  },
  {
    n: '03',
    title: 'Convene a review room',
    body: 'When the record needs pressure, agents with distinct jobs test the reasoning and surface the gaps.',
  },
  {
    n: '04',
    title: 'Move the decision',
    body: 'Track the decision through draft, review, and approval with the evidence still attached.',
  },
]

const CAPABILITIES = [
  {
    label: 'Decision record',
    body: 'A decision is the product object: title, context, owner, state, impact, and evidence.',
  },
  {
    label: 'Source-backed evidence',
    body: 'Path, commit, quote, hash, confidence, and status. A claim without a source stays visible as unsupported.',
  },
  {
    label: 'Role-scoped rooms',
    body: 'Owners, admins, reviewers, and viewers. Reviewers can edit decisions; viewers can only read.',
  },
  {
    label: 'Review rooms',
    body: 'The agent council is a room inside a decision, not a separate chat product.',
  },
  {
    label: 'Auditable runs',
    body: 'Every candidate is kept with its score and the judge’s reason. Nothing is a black box.',
  },
  {
    label: 'Your keys, encrypted',
    body: 'AES-256-GCM at rest, provider calls stay server-side, twelve providers supported.',
  },
]

export default function Home() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [chats, setChats] = useState<Chat[]>([])
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)
  const { isAuthenticated } = useAuth()
  // Derived rather than set inside an effect: authenticated, first pass not landed yet.
  const dataLoading = isAuthenticated && !dataLoaded

  const fetchPersonas = useCallback(async () => {
    const res = await fetch('/api/personas')
    const data = await res.json()
    setPersonas(data)
  }, [])

  const fetchProviders = useCallback(async () => {
    const res = await fetch('/api/providers')
    const data = await res.json()
    setProviders(data)
  }, [])

  const fetchChats = useCallback(async () => {
    const res = await fetch('/api/chats')
    const data = await res.json()
    setChats(data)
  }, [])

  const fetchWorkspaces = useCallback(async () => {
    const res = await fetch('/api/workspaces')
    if (!res.ok) return
    const data = await res.json()
    setWorkspaces(Array.isArray(data) ? data : [])
  }, [])

  const fetchData = useCallback(async () => {
    try {
      await Promise.all([fetchPersonas(), fetchProviders(), fetchChats(), fetchWorkspaces()])
    } finally {
      setDataLoaded(true)
    }
  }, [fetchPersonas, fetchProviders, fetchChats, fetchWorkspaces])

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated, fetchData])

  const stats = [
    { value: workspaces.length, label: 'Workspaces' },
    { value: chats.length, label: 'Review rooms' },
    { value: personas.length, label: 'Agents' },
    { value: providers.length, label: 'Providers' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-5">
      {/* ============================ masthead ============================ */}
      <section className="grid gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-24">
        <div className="rise">
          <Badge tone="accent" className="mb-6">
            Decision evidence workspace
          </Badge>

          <h1 className="text-[2.75rem] leading-[1.05] tracking-[-0.03em] text-text sm:text-6xl">
            A decision
            <br />
            <span className="text-accent">you can defend.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
            Tarka Sabha turns a deal decision into a source-backed record: the claims, the
            code and documents behind them, the open questions, and the approval trail. The
            agent council is now a review room inside that record.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/workspaces">
              <Button variant="primary" size="lg">
                Open workspaces
              </Button>
            </Link>
            <Link href={isAuthenticated ? '/history' : '/demo'}>
              <Button variant="secondary" size="lg">
                {isAuthenticated ? 'See your review rooms' : 'See a sample review'}
              </Button>
            </Link>
          </div>

          {isAuthenticated && (
            <dl className="mt-12 grid max-w-xl grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-6 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="eyebrow">{stat.label}</dt>
                  <dd className="mt-1 font-display text-3xl text-text tabular-nums">
                    {dataLoading ? '—' : stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Specimen: the pipeline, set as a printed procedure. */}
        <Card
          className="rise self-start lg:mt-4"
          style={{ '--i': 2 } as React.CSSProperties}
        >
          <Rule label="Procedure" className="mb-5" />
          <ol className="space-y-5">
            {STAGES.map((stage) => (
              <li key={stage.n} className="grid grid-cols-[2.5rem_1fr] gap-3">
                <span className="font-mono text-xs text-accent">{stage.n}</span>
                <span>
                  <span className="block font-display text-[0.9375rem] text-text">
                    {stage.title}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted">
                    {stage.body}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      {/* ============================ capability ========================== */}
      <section className="border-t border-line py-16">
        <Rule label="Capability" className="mb-10" />
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((item) => (
            <div key={item.label}>
              <h2 className="font-display text-[0.9375rem] text-text">{item.label}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================== closing =========================== */}
      <section className="border-t border-line py-20">
        <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="max-w-lg text-3xl leading-tight text-text sm:text-4xl">
              Stop shipping decisions without a record.
              <span className="text-accent"> Build the evidence pack.</span>
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
              Open a workspace for the next decision. Bring your own API key from any of
              twelve providers; keys are encrypted before they are stored and never leave
              the server.
            </p>
          </div>
          <Link href="/workspaces">
            <Button variant="primary" size="lg">
              Open a workspace
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
