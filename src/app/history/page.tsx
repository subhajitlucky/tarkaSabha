'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Chat } from '@/types'

export default function HistoryPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChats()
  }, [])

  const fetchChats = async () => {
    const res = await fetch('/api/chats')
    const data = await res.json()
    setChats(data)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Debate History
          </h1>
          <p className="text-slate-400 text-lg">
            Your past discussions and debates
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-400 mb-4">No debates yet</p>
            <Link
              href="/debate"
              className="text-amber-400 hover:text-amber-300 font-medium"
            >
              Start your first debate
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chats.map(chat => (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="bg-slate-900 border border-slate-800 hover:border-amber-500/30 rounded-xl p-5 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex -space-x-2">
                    {chat.participants?.slice(0, 3).map((p, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-white"
                      >
                        {(p.persona?.name || '?').charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                  {chat.isAutoMode && (
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </div>
                <h3 className="font-semibold text-white mb-1 group-hover:text-amber-400 transition-colors">
                  {chat.topic || chat.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>{chat.participants?.length || 0} participants</span>
                  <span>·</span>
                  <span>{new Date(chat.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
