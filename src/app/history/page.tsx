'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Chat } from '@/types'
import { useTheme } from '@/components/ThemeProvider'

export default function HistoryPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()
  const isLight = theme === 'light'

  useEffect(() => {
    fetchChats()
  }, [])

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats')
      if (!res.ok) {
        if (res.status === 401) {
          // Redirect handled by middleware/auth provider usually, but we can set empty
          setChats([])
        }
        return
      }
      const data = await res.json()
      if (Array.isArray(data)) {
        setChats(data)
      } else {
        setChats([])
      }
    } catch (e) {
      console.error('Failed to fetch history', e)
      setChats([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen py-12 ${isLight ? 'bg-slate-50' : 'bg-slate-950'}`}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Debate History
          </h1>
          <p className={`text-lg ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Your past discussions and debates
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-16">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isLight ? 'bg-slate-100' : 'bg-slate-800'
            }`}>
              <svg className={`w-10 h-10 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className={`mb-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>No debates yet</p>
            <Link
              href="/debate"
              className="text-amber-500 hover:text-amber-600 font-medium transition-colors"
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
                className={`rounded-xl p-5 transition-all group border hover:-translate-y-1 hover:shadow-lg ${
                  isLight 
                    ? 'bg-white border-slate-200 hover:border-amber-500/30 hover:shadow-amber-500/10' 
                    : 'bg-slate-900 border-slate-800 hover:border-amber-500/30'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex -space-x-2">
                    {chat.participants?.slice(0, 3).map((p, i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 border-2 flex items-center justify-center text-xs font-bold text-white ${
                          isLight ? 'border-white' : 'border-slate-900'
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
                  </div>
                  {chat.isAutoMode && (
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </div>
                <h3 className={`font-semibold mb-1 group-hover:text-amber-500 transition-colors ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  {chat.topic || chat.title}
                </h3>
                <div className={`flex items-center gap-2 text-sm ${
                  isLight ? 'text-slate-500' : 'text-slate-500'
                }`}>
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
