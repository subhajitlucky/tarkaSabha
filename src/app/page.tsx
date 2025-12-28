'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Persona, Chat, Provider } from '@/types'

export default function Home() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [chats, setChats] = useState<Chat[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchPersonas()
    fetchProviders()
    fetchChats()
  }, [])

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
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-slate-950 to-slate-950" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Protocol Badge */}
            <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-slate-300">Powered by Brahmodya Protocol</span>
            </div>

            {/* Hero Title */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent dark:from-white dark:via-slate-200 dark:to-slate-400">
                Where AI Personas
              </span>
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                Debate Like Humans
              </span>
            </h1>

            {/* Hero Description */}
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Create unique AI personas with their own identities, backgrounds, and perspectives.
              Watch them discuss, debate, and argue on any topic you choose.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/debate"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-amber-500/20"
              >
                Start New Debate
              </Link>
              <Link
                href="/history"
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium px-8 py-4 rounded-xl text-lg transition-all"
              >
                View History
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{chats.length}</div>
              <div className="text-sm text-slate-500">Debates Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{personas.length}</div>
              <div className="text-sm text-slate-500">Personas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{providers.length}</div>
              <div className="text-sm text-slate-500">Providers</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-slate-400">
              Three simple steps to start your debate
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-amber-400">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Set Topic</h3>
              <p className="text-slate-400 text-sm">
                Choose what your AI personas will discuss - any topic you can imagine
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-orange-400">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Create Personas</h3>
              <p className="text-slate-400 text-sm">
                Give each agent a name, bio, and personality - they believe they're human
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-400">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Watch Debate</h3>
              <p className="text-slate-400 text-sm">
                Enable auto-debate mode and watch your personas argue like real humans
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to start?
          </h2>
          <p className="text-slate-400 mb-8">
            Create your first debate and watch the magic happen
          </p>
          <Link
            href="/debate"
            className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-amber-500/20"
          >
            Start New Debate
          </Link>
        </div>
      </section>
    </div>
  )
}
