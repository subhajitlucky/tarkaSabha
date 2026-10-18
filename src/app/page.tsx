'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Persona, Chat, Provider } from '@/types'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Card, Rule } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

/** The four stages, used as both the hero specimen and the "how it works" list. */
const STAGES = [
  {
    n: '01',
    title: 'State the outcome',
    body: 'Give the council an objective, the shape of the deliverable you want, and who it is for.',
  },
  {
    n: '02',
    title: 'Assign roles',
    body: 'A researcher brings evidence, a critic attacks the weakest reasoning, a synthesizer pulls the threads together.',
  },
  {
    n: '03',
    title: 'Let them work',
    body: 'Agents run server-side with real tools — web search, page reading, exact arithmetic — so claims get checked, not recalled.',
  },
  {
    n: '04',
    title: 'Read the verdict',
    body: 'Several drafts are scored against a rubric. You get the winner, its score, and the candidates that lost.',
  },
]

const CAPABILITIES = [
  {
    label: 'Server-side turns',
    body: 'Debates keep advancing after you close the tab. The browser renders; it does not drive.',
  },
  {
    label: 'Real tools',
    body: 'Web search, page reading and a parser-based calculator. Tool output is untrusted and never reaches the system prompt.',
  },
  {
    label: 'Role-shaped agents',
    body: 'Not just personalities. Each participant has a job that changes what it is told to do.',
  },
  {
    label: 'Rubric scoring',
    body: 'Grounding, coverage, decisiveness, honesty, fit. Weighted, so decisiveness cannot buy off invented facts.',
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

  const fetchData = useCallback(async () => {
    try {
      await Promise.all([fetchPersonas(), fetchProviders(), fetchChats()])
    } finally {
      setDataLoaded(true)
    }
  }, [fetchPersonas, fetchProviders, fetchChats])

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated, fetchData])

  const stats = [
    { value: chats.length, label: 'Councils' },
    { value: personas.length, label: 'Agents' },
    { value: providers.length, label: 'Providers' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-5">
      {/* ============================ masthead ============================ */}
      <section className="grid gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-24">
        <div className="rise">
          <Badge tone="accent" className="mb-6">
            Brahmodya Protocol
          </Badge>

          <h1 className="text-[2.75rem] leading-[1.05] tracking-[-0.03em] text-text sm:text-6xl">
            A council of
            <br />
            <span className="text-accent">reasoning</span> agents.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
            Describe an outcome. Assemble agents with distinct jobs and the tools to
            check their own claims. They deliberate, and you read the deliverable they
            argue their way to — scored, and with the runners-up kept.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/debate">
              <Button variant="primary" size="lg">
                Convene a council
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="secondary" size="lg">
                Open the archive
              </Button>
            </Link>
          </div>

          {isAuthenticated && (
            <dl className="mt-12 grid max-w-md grid-cols-3 border-t border-line pt-6">
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
                  <span className="mt-1 block text-[0.8125rem] leading-relaxed text-muted">
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
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted">
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
              Stop asking one model for an answer.
              <span className="text-accent"> Convene a council.</span>
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
              Bring your own API key from any of twelve providers. Keys are encrypted
              before they are stored and never leave the server.
            </p>
          </div>
          <Link href="/debate">
            <Button variant="primary" size="lg">
              Start now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
