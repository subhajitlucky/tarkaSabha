'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Chat } from '@/types'
import { useAuth } from '@/components/AuthProvider'
import { useTheme } from '@/components/ThemeProvider'

export default function DashboardPage() {
  const { session } = useAuth()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChats()
  }, [])

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats')
      if (res.ok) {
        const data = await res.json()
        setChats(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const userImage = session?.user?.image
  const userName = session?.user?.name || 'User'
  const userEmail = session?.user?.email
  const userInitials =
    userName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase() || '')
      .join('') || 'U'

  return (
    <div className={`min-h-screen py-12 ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#050505] text-white'}`}>
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Profile Section */}
        <div className={`mb-12 p-8 rounded-3xl border shadow-lg ${
          isLight ? 'bg-white border-slate-100' : 'bg-slate-900/50 border-slate-800'
        }`}>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              {userImage ? (
                <img src={userImage} alt={userName} className="relative w-24 h-24 rounded-full ring-4 ring-white dark:ring-slate-900 shadow-xl object-cover" />
              ) : (
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                  <span className="max-w-[80%] text-center truncate leading-none">{userInitials}</span>
                </div>
              )}
            </div>
            <div className="text-center md:text-left space-y-2">
              <h1 className="text-3xl font-bold">{userName}</h1>
              <p className={`text-lg ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{userEmail}</p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                  isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  Free Tier
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                  isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'
                }`}>
                  Member since {new Date().getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900/50 border-slate-800'}`}>
            <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Debates</p>
            <p className="text-3xl font-bold text-amber-500">{chats.length}</p>
          </div>
          <div className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900/50 border-slate-800'}`}>
            <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Personas</p>
            <p className="text-3xl font-bold text-indigo-500">
              {new Set(chats.flatMap(c => c.participants?.map(p => p.personaId))).size || 0}
            </p>
          </div>
        </div>

        {/* History Section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recent Debates</h2>
          <Link href="/debate" className="text-sm font-bold text-amber-500 hover:text-amber-400 transition-colors">
            + New Debate
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : chats.length === 0 ? (
          <div className={`text-center py-16 rounded-3xl border-2 border-dashed ${
            isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/20'
          }`}>
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isLight ? 'bg-slate-100' : 'bg-slate-800'
            }`}>
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className={`mb-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>No debates found</p>
            <Link
              href="/debate"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm transition-transform hover:scale-105"
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
                className={`group relative p-6 rounded-3xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                  isLight 
                    ? 'bg-white border-slate-100 hover:border-amber-500/30 hover:shadow-amber-500/10' 
                    : 'bg-slate-900 border-slate-800 hover:border-amber-500/30 hover:shadow-amber-500/10'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex -space-x-2">
                    {chat.participants?.slice(0, 3).map((p, i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${
                          isLight ? 'border-white' : 'border-slate-900'
                        } ${
                           i % 2 === 0 ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-amber-400 to-orange-500'
                        }`}
                      >
                        {(p.persona?.name || '?').charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {(chat.participants?.length || 0) > 3 && (
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                        isLight ? 'border-white bg-slate-100 text-slate-500' : 'border-slate-900 bg-slate-800 text-slate-400'
                      }`}>
                        +{(chat.participants?.length || 0) - 3}
                      </div>
                    )}
                  </div>
                  {chat.isAutoMode && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider border border-green-500/20">
                      <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                      Auto
                    </span>
                  )}
                </div>
                
                <h3 className={`font-bold text-lg mb-2 line-clamp-2 group-hover:text-amber-500 transition-colors ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  {chat.topic || 'Untitled Debate'}
                </h3>
                
                <div className={`flex items-center gap-3 text-xs font-medium ${
                  isLight ? 'text-slate-400' : 'text-slate-500'
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
      </div>
    </div>
  )
}
