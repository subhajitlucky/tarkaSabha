'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Persona, Chat, Provider } from '@/types'
import { useTheme } from '@/components/ThemeProvider'
import { useAuth } from '@/components/AuthProvider'

export default function Home() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [chats, setChats] = useState<Chat[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const isLight = theme === 'light'

  useEffect(() => {
    setMounted(true)
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated])

  const fetchData = async () => {
    setDataLoading(true)
    try {
      await Promise.all([
        fetchPersonas(),
        fetchProviders(),
        fetchChats()
      ])
    } finally {
      setDataLoading(false)
    }
  }

  const fetchPersonas = async () => {
    const res = await fetch('/api/personas')
    const data = await res.json()
    setPersonas(data)
  }

  const fetchProviders = async () => {
    const res = await fetch('/api/providers')
    const data = await res.json()
    setProviders(data)
  }

  const fetchChats = async () => {
    const res = await fetch('/api/chats')
    const data = await res.json()
    setChats(data)
  }

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 text-center">
          <div className="h-96 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isLight ? 'bg-slate-50' : 'bg-slate-950'}`}>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${
          isLight 
            ? 'from-amber-500/5 via-slate-50 to-slate-50' 
            : 'from-amber-500/10 via-slate-950 to-slate-950'
        }`} />
        
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Protocol Badge */}
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 border ${
              isLight 
                ? 'bg-white/50 border-slate-200 text-slate-600' 
                : 'bg-slate-800/50 border-slate-700 text-slate-300'
            }`}>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm">Powered by Brahmodya Protocol</span>
            </div>

            {/* Hero Title */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className={`bg-clip-text text-transparent bg-gradient-to-r ${
                isLight 
                  ? 'from-slate-900 via-slate-700 to-slate-500' 
                  : 'from-white via-slate-200 to-slate-400'
              }`}>
                Where AI Personas
              </span>
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                Debate Like Humans
              </span>
            </h1>

            {/* Hero Description */}
            <p className={`text-xl mb-10 max-w-2xl mx-auto ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Create unique AI personas with their own identities, backgrounds, and perspectives.
              Watch them discuss, debate, and argue on any topic you choose.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/debate"
                className={`font-bold px-8 py-4 rounded-xl text-lg transition-all cursor-pointer hover:-translate-y-0.5 border ${
                  isLight
                    ? 'bg-gradient-to-b from-slate-800 to-slate-950 border-slate-800 text-white shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/20 hover:shadow-xl border-transparent'
                }`}
              >
                Start New Debate
              </Link>
              <Link
                href="/history"
                className={`font-bold px-8 py-4 rounded-xl text-lg transition-all cursor-pointer hover:-translate-y-0.5 border ${
                  isLight 
                    ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]' 
                    : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                }`}
              >
                View History
              </Link>
            </div>
          </div>

          {/* Stats - Only show when authenticated */}
          {isAuthenticated && (
            <div className="mt-16 grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto pb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-center">
                {dataLoading ? (
                  <div className="h-9 w-12 mx-auto bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-1" />
                ) : (
                  <div className={`text-3xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{chats.length}</div>
                )}
                <div className="text-xs md:text-sm text-slate-500">Your Debates</div>
              </div>
              <div className="text-center">
                {dataLoading ? (
                  <div className="h-9 w-12 mx-auto bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-1" />
                ) : (
                  <div className={`text-3xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{personas.length}</div>
                )}
                <div className="text-xs md:text-sm text-slate-500">Your Personas</div>
              </div>
              <div className="text-center">
                {dataLoading ? (
                  <div className="h-9 w-12 mx-auto bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-1" />
                ) : (
                  <div className={`text-3xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{providers.length}</div>
                )}
                <div className="text-xs md:text-sm text-slate-500">Your Providers</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className={`py-20 ${isLight ? 'bg-white border-t border-slate-100' : 'bg-slate-900/50'}`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              How It Works
            </h2>
            <p className="text-slate-500">
              Three simple steps to start your debate
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className={`border rounded-2xl p-8 text-center transition-all hover:shadow-lg ${
              isLight ? 'bg-slate-50 border-slate-100' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-amber-500">1</span>
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>Set Topic</h3>
              <p className="text-slate-500 text-sm">
                Choose what your AI personas will discuss - any topic you can imagine
              </p>
            </div>

            <div className={`border rounded-2xl p-8 text-center transition-all hover:shadow-lg ${
              isLight ? 'bg-slate-50 border-slate-100' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-orange-500">2</span>
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>Create Personas</h3>
              <p className="text-slate-500 text-sm">
                Give each agent a name, bio, and personality - they believe they're human
              </p>
            </div>

            <div className={`border rounded-2xl p-8 text-center transition-all hover:shadow-lg ${
              isLight ? 'bg-slate-50 border-slate-100' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-500">3</span>
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>Watch Debate</h3>
              <p className="text-slate-500 text-sm">
                Enable auto-debate mode and watch your personas argue like real humans
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-20 ${isLight ? 'bg-slate-50' : 'bg-slate-950'}`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Features
            </h2>
            <p className={`text-lg ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Everything you need for intelligent discussions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
                title: 'Unique Personas',
                description: 'Create agents with custom names, bios, and personalities. Each has their own identity.',
                color: 'amber',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                ),
                title: 'Multi-Provider',
                description: 'Use OpenAI, Anthropic, Google, Groq, Ollama, or any custom API endpoint.',
                color: 'orange',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'Secure & Encrypted',
                description: 'API keys are encrypted with AES-256-GCM. Your secrets stay safe.',
                color: 'green',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Auto-Debate Mode',
                description: 'Enable auto-debate and watch agents argue with each other automatically.',
                color: 'blue',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                ),
                title: '@Mentions',
                description: 'Use @AgentName to call on specific personas in the discussion.',
                color: 'purple',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Topic Isolation',
                description: 'Personas only remember the current topic. Clean context for every debate.',
                color: 'red',
              },
            ].map((feature, index) => {
              const colorClasses: Record<string, { bg: string; text: string }> = {
                amber: { bg: 'bg-amber-500/20', text: 'text-amber-500' },
                orange: { bg: 'bg-orange-500/20', text: 'text-orange-500' },
                green: { bg: 'bg-green-500/20', text: 'text-green-500' },
                blue: { bg: 'bg-blue-500/20', text: 'text-blue-500' },
                purple: { bg: 'bg-purple-500/20', text: 'text-purple-500' },
                red: { bg: 'bg-red-500/20', text: 'text-red-500' },
              }
              return (
                <div
                  key={index}
                  className={`rounded-xl p-6 transition-all border hover:shadow-lg ${
                    isLight 
                      ? 'bg-white border-slate-200 hover:border-amber-500/30' 
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl ${colorClasses[feature.color].bg} flex items-center justify-center mb-4`}>
                    <span className={colorClasses[feature.color].text}>{feature.icon}</span>
                  </div>
                  <h3 className={`text-xl font-semibold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{feature.title}</h3>
                  <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Ready to start?
          </h2>
          <p className="text-slate-500 mb-8">
            Create your first debate and watch the magic happen
          </p>
          <Link
            href="/debate"
            className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-amber-500/20 cursor-pointer hover:shadow-xl hover:-translate-y-0.5"
          >
            Start New Debate
          </Link>
        </div>
      </section>
    </div>
  )
}
