'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Chat } from '@/types'
import { useAuth } from '@/components/AuthProvider'
import { Avatar } from '@/components/ui/Avatar'

interface Feedback {
  id: string
  message: string
  type: string
  name?: string
  email?: string
  createdAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { session, isLoading: authLoading, isAuthenticated } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats?limit=6')
      if (res.ok) {
        const data = await res.json()
        setChats(data)
      }
    } catch (e) {
      console.error('Failed to fetch chats:', e)
    }
  }

  const fetchFeedback = async () => {
    try {
      const res = await fetch('/api/feedback')
      if (res.ok) {
        const data = await res.json()
        setFeedbacks(data)
      }
    } catch (e) {
      console.error('Failed to fetch feedback:', e)
    }
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?callbackUrl=/dashboard')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated) return

    const loadData = async () => {
      setLoading(true)
      try {
        await Promise.all([fetchChats(), fetchFeedback()])
      } catch (e) {
        console.error('Error loading dashboard data:', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [isAuthenticated])

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-[3px] border-2 border-accent/30 border-t-accent" />
      </div>
    )
  }

  const userName = session?.user?.name || 'User'
  const userEmail = session?.user?.email

  return (
    <div className={`min-h-screen py-12 ${'bg-bg text-text'}`}>
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Profile Section */}
        <div className="mb-10 rounded-[4px] border border-line bg-surface p-7">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <Avatar name={userName} size="lg" />
            <div className="text-center md:text-left space-y-2">
              <h1 className="text-3xl text-text">{userName}</h1>
              <p className="text-base text-muted">{userEmail}</p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start mt-2">
                <span className={`rounded-[3px] border border-line px-2.5 py-1 font-mono text-xs uppercase tracking-[0.1em] ${
                  'bg-accent-soft text-accent'
                }`}>
                  Free Tier
                </span>
                <span className={`rounded-[3px] border border-line px-2.5 py-1 font-mono text-xs uppercase tracking-[0.1em] ${
                  'bg-surface-2 text-muted'
                }`}>
                  Member since {new Date().getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid — four columns, so four stats. Previously the grid
            declared four but rendered two, which stretched both cards. */}
        <div className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Debates', value: chats.length, accent: true },
            {
              label: 'Agents',
              value: new Set(chats.flatMap((c) => c.participants?.map((p) => p.personaId))).size || 0,
              accent: false,
            },
            { label: 'Running', value: chats.filter((c) => c.isAutoMode).length, accent: false },
            { label: 'Feedback', value: feedbacks.length, accent: false },
          ].map((stat) => (
            <div key={stat.label} className="rounded-[4px] border border-line bg-surface p-4">
              <p className="eyebrow mb-2">{stat.label}</p>
              {loading ? (
                <span className="block h-8 w-12 animate-pulse rounded-[3px] bg-surface-2" />
              ) : (
                <p
                  className={`font-display text-3xl tabular-nums ${
                    stat.accent ? 'text-accent' : 'text-text'
                  }`}
                >
                  {stat.value}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Manage — the two things a new account has to set up before a council
            can run, surfaced where a first-run user actually lands. */}
        <div className="mb-10 grid gap-3 sm:grid-cols-2">
          {[
            {
              href: '/personas',
              title: 'Agents',
              body: 'Give each one a job, and the tools to check its own claims.',
            },
            {
              href: '/providers',
              title: 'Providers',
              body: 'Add an API key from any of twelve providers. Encrypted at rest.',
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-[4px] border border-line bg-surface p-4 transition-colors hover:border-accent-line"
            >
              <h2 className="font-display text-[0.9375rem] text-text transition-colors group-hover:text-accent">
                {item.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {item.body}
              </p>
            </Link>
          ))}
        </div>

        {/* History Section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl text-text">Recent debates</h2>
          <Link 
            href="/debate" 
            className="rounded-[3px] border border-accent bg-accent px-3.5 py-2 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover" 
          >
            + New Debate
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-[3px] animate-spin" />
          </div>
        ) : chats.length === 0 ? (
          <div className={`rounded-[4px] border border-dashed border-line py-16 text-center ${
            'border-line bg-surface-2'
          }`}>
            <div className={`w-16 h-16 mx-auto mb-4 rounded-[3px] flex items-center justify-center ${
              'bg-surface-2'
            }`}>
              <svg className="h-7 w-7 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className={`mb-4 ${'text-muted'}`}>No debates found</p>
            <Link
              href="/debate"
              className="inline-flex items-center gap-2 rounded-[3px] border border-accent bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover" 
            >
              Start Debate
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chats.map(chat => (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="group relative rounded-[4px] border border-line bg-surface p-5 transition-colors hover:border-accent-line" 
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex -space-x-2">
                    {chat.participants?.slice(0, 3).map((p, i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-[3px] overflow-hidden border-2 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${
                          'border-line'
                        } ${
                           'bg-surface-2 border border-line text-muted'
                        }`}
                      >
                        <span className="truncate max-w-[90%]">
                          {(p.persona?.name || '?')
                            .split(/\s+/)
                            .filter(Boolean)
                            .slice(0, 2)
                            .map(w => w[0]?.toUpperCase() || '')
                            .join('')}
                        </span>
                      </div>
                    ))}
                    {(chat.participants?.length || 0) > 3 && (
                      <div className={`w-8 h-8 rounded-[3px] border-2 flex items-center justify-center text-[10px] font-bold ${
                        'border-line bg-surface-2 text-muted'
                      }`}>
                        +{(chat.participants?.length || 0) - 3}
                      </div>
                    )}
                  </div>
                  {chat.isAutoMode && (
                    <span className="flex items-center gap-1.5 rounded-[3px] border border-success/30 bg-success-soft px-2 py-0.5 font-mono text-xs uppercase tracking-[0.1em] text-success">
                      <span className="h-1 w-1 animate-pulse rounded-full bg-success" />
                      Auto
                    </span>
                  )}
                </div>
                
                <h3 className={`font-bold text-lg mb-2 line-clamp-2 group-hover:text-accent transition-colors ${
                  'text-text'
                }`}>
                  {chat.topic || 'Untitled Debate'}
                </h3>
                
                <div className={`flex items-center gap-3 text-xs font-medium ${
                  'text-subtle'
                }`}>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(chat.createdAt).toLocaleDateString()}
                  </span>
                  <span>·</span>
                  <span>{chat.participants?.length || 0} participants</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Feedback Section */}
        {feedbacks.length > 0 && (
          <div className="mt-16">
            <h2 className={`text-2xl font-bold mb-6 ${'text-text'}`}>Feedback Reports</h2>
            <div className="grid gap-4">
              {feedbacks.map((item) => (
                <div key={item.id} className={`p-6 rounded-[4px] border ${'bg-surface border-line'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`mb-2 inline-block rounded-[3px] px-2 py-0.5 font-mono text-xs uppercase tracking-[0.1em] ${
                        item.type === 'bug' ? 'border border-danger/30 bg-danger-soft text-danger' :
                        item.type === 'feature' ? 'border border-accent-line bg-accent-soft text-accent' :
                        'border border-line bg-surface-2 text-subtle'
                      }`}>
                        {item.type}
                      </span>
                      <h3 className={`font-semibold ${'text-text'}`}>{item.name || 'Anonymous'}</h3>
                      <p className="text-sm text-subtle">{item.email}</p>
                    </div>
                    <span className="text-xs text-subtle">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={'text-text'}>{item.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
