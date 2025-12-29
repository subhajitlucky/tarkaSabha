'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Chat, Message } from '@/types'
import { useTheme } from '@/components/ThemeProvider'
import { useAuth } from '@/components/AuthProvider'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.id as string

  const { theme } = useTheme()
  const { session, isAuthenticated, signIn, signOut } = useAuth()
  const isLight = theme === 'light'
  const [chat, setChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showChatSettings, setShowChatSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [localUsername, setLocalUsername] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isOwner, setIsOwner] = useState(false)

  // Load username from localStorage on client mount
  useEffect(() => {
    const saved = localStorage.getItem('tarka_username') || ''
    setLocalUsername(saved)
    // ALWAYS show modal if no saved local username, to prevent exposing real name to LLMs
    if (!saved) {
      setShowUsernameModal(true)
    }
  }, [])

  // Get username - MUST use localUsername to protect privacy from LLMs
  const username = localUsername || 'Anonymous'

  // Check ownership
  useEffect(() => {
    if (chat?.creatorId && session?.user?.id) {
      setIsOwner(chat.creatorId === session.user.id)
    } else {
      setIsOwner(false)
    }
  }, [chat?.creatorId, session?.user?.id])

  const saveUsername = (name: string) => {
    const trimmed = name.trim()
    if (trimmed) {
      localStorage.setItem('tarka_username', trimmed)
      setLocalUsername(trimmed)
      setShowUsernameModal(false)
    }
  }

  // Poll for messages when in auto mode
  useEffect(() => {
    let interval: NodeJS.Timeout
    let isActive = true

    if (chat?.isAutoMode) {
      setIsTyping(true) // Assume typing while in auto mode
      interval = setInterval(async () => {
        if (!isActive) return
        await fetchMessages()
      }, 3000)
    } else {
      setIsTyping(false)
    }

    return () => {
      isActive = false
      clearInterval(interval)
    }
  }, [chat?.isAutoMode])

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px'
    }
  }, [])

  const scrollToBottom = useCallback(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages.length])

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages.length, scrollToBottom])

  useEffect(() => {
    if (chatId) {
      fetchChat()
      fetchMessages()
    }
  }, [chatId])

  const fetchChat = async () => {
    try {
      const res = await fetch(`/api/chats/${chatId}`)
      if (res.ok) {
        const data = await res.json()
        setChat(data)
      }
    } catch (e) {
      console.error('Failed to fetch chat', e)
    }
  }

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(data)) {
            return data
          }
          return prev
        })
      }
    } catch (e) {
      console.error('Failed to fetch messages', e)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !chat) return
    
    // Safety check: ensure username is set
    if (!localUsername) {
      setShowUsernameModal(true)
      return
    }

    setError(null)
    setIsTyping(true)

    try {
      const res = await fetch(`/api/chats/${chatId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage, isUser: true }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || 'Failed to send message')
      }

      const data = await res.json()
      
      // Refresh messages immediately
      await fetchMessages()
      
      // If auto-debate triggered, ensure we fetch chat to update isAutoMode status if needed
      if (data.autoDebateTriggered) {
         await fetchChat()
      } else {
        setIsTyping(false)
      }

      setNewMessage('')
      adjustTextareaHeight()
    } catch (err: any) {
      setError(err.message || 'Failed to send message')
      setIsTyping(false)
    }
  }

  const toggleAutoMode = async () => {
    if (!chat) return

    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAutoMode: !chat.isAutoMode }),
      })
      const data = await res.json()
      const newAutoState = data.chat.isAutoMode
      setChat(data.chat)

      if (newAutoState && messages.length === 0) {
        setIsTyping(true)
        try {
          const sendRes = await fetch(`/api/chats/${chatId}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: 'Start the debate on this topic.', isUser: false }),
          })
          if (!sendRes.ok) {
            setIsTyping(false)
          }
        } catch (err) {
          setIsTyping(false)
          setError('Failed to start auto-debate')
        }
      }
    } catch (error) {
      setError('Failed to toggle auto mode')
    }
  }

  const stopDebate = async () => {
    if (!chat) return
    try {
      await fetch(`/api/chats/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAutoMode: false }),
      })
      setChat({ ...chat, isAutoMode: false })
      setIsTyping(false)
    } catch (error) {
      setError('Failed to stop debate')
    }
  }

  const deleteChat = async () => {
    if (!confirm('Are you sure you want to delete this chat?')) return

    try {
      await fetch(`/api/chats/${chatId}`, { method: 'DELETE' })
      router.push('/history')
    } catch (error) {
      setError('Failed to delete chat')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!chat) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isLight ? 'bg-slate-50' : 'bg-[#050505]'}`}>
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#050505] text-slate-100'}`}>
      {/* Username Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`p-8 rounded-3xl max-w-md w-full shadow-2xl ${isLight ? 'bg-white' : 'bg-slate-900 border border-slate-800'}`}>
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Identity Setup</h2>
            <p className={`mb-6 text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Choose a name to represent you in this debate. This name will be shared with the AI personas.
            </p>
            <input
              type="text"
              placeholder="Your display name"
              className={`w-full px-5 py-4 rounded-2xl border-2 focus:ring-4 transition-all mb-6 text-lg font-medium ${
                isLight 
                  ? 'bg-slate-50 border-slate-100 focus:border-amber-500 focus:ring-amber-500/10 text-slate-900' 
                  : 'bg-slate-800 border-slate-700 focus:border-amber-500 focus:ring-amber-500/10 text-white'
              }`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveUsername((e.target as HTMLInputElement).value)
                }
              }}
              autoFocus
            />
            <button
              onClick={(e) => {
                const input = (e.target as HTMLElement).parentElement?.querySelector('input')
                if (input) saveUsername(input.value)
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold py-4 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/25"
            >
              Start Chatting
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`p-8 rounded-3xl max-w-md w-full shadow-2xl ${isLight ? 'bg-white' : 'bg-slate-900 border border-slate-800'}`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">Delete Debate?</h3>
                <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>This action cannot be undone.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`flex-1 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={deleteChat}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3.5 rounded-2xl text-sm font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-500/25"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-xl ${
        isLight ? 'bg-white/80 border-slate-200' : 'bg-[#050505]/80 border-slate-800'
      }`}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/history')}
              className={`p-2.5 rounded-xl transition-all ${isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight truncate max-w-[200px] sm:max-w-md">
                {chat.topic || chat.title}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex -space-x-1.5">
                  {chat.participants?.slice(0, 3).map((p, i) => (
                    <div key={i} className="w-5 h-5 rounded-full ring-2 ring-white dark:ring-[#050505] bg-gradient-to-br from-indigo-500 to-purple-600" />
                  ))}
                </div>
                <span className={`text-[11px] font-medium uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  {chat.participants?.length || 0} Agents
                </span>
                {chat.isAutoMode && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Auto
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-500/5 border border-slate-500/10">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {username.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-bold">{username}</span>
            </div>

            <div className="flex items-center gap-1">
              {isOwner && (
                <button
                  onClick={chat.isAutoMode ? stopDebate : toggleAutoMode}
                  className={`p-2.5 rounded-xl transition-all ${
                    chat.isAutoMode 
                      ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                      : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                  }`}
                  title={chat.isAutoMode ? "Stop Auto-Debate" : "Start Auto-Debate"}
                >
                  {chat.isAutoMode ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v6a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                  )}
                </button>
              )}

              <button
                onClick={() => setShowChatSettings(!showChatSettings)}
                className={`p-2.5 rounded-xl transition-all ${isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown Menu */}
        {showChatSettings && (
          <div className="max-w-5xl mx-auto px-6 pb-4">
            <div className={`p-4 rounded-3xl border shadow-xl ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowUsernameModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-all"
                  >
                    Change Identity
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                    >
                      Delete Debate
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => signOut()}
                  className={`text-sm font-bold ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {messages.length === 0 && (
            <div className="py-20 text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400/20 to-orange-600/20 rounded-3xl flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">New Debate Session</h3>
                <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Start the conversation or enable auto-mode to watch agents interact.</p>
              </div>
            </div>
          )}

          {messages.map((message, idx) => {
            const persona = chat.participants?.find(p => p.persona?.id === message.personaId)?.persona
            const isUser = message.role === 'user'
            
            return (
              <div key={message.id || idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex gap-4 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-md ${
                      isUser 
                        ? 'bg-gradient-to-br from-amber-400 to-orange-600' 
                        : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                    }`}>
                      {(isUser ? username : (persona?.name || 'A')).charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Message Bubble */}
                  <div className={`space-y-1.5 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isUser && (
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{persona?.name || 'Agent'}</span>
                        <span className="text-[10px] font-medium text-slate-400">{formatTime(message.createdAt)}</span>
                      </div>
                    )}
                    
                    <div className={`px-5 py-3.5 rounded-3xl text-[15px] leading-relaxed shadow-sm transition-all ${
                      isUser 
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-tr-none' 
                        : isLight 
                          ? 'bg-white border border-slate-100 text-slate-800 rounded-tl-none hover:border-slate-200' 
                          : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none hover:border-slate-700'
                    }`}>
                      {message.content}
                    </div>

                    {isUser && (
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[10px] font-medium text-slate-400">{formatTime(message.createdAt)}</span>
                        <span className="text-[11px] font-black uppercase tracking-widest text-amber-500/80">You</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {isTyping && (
            <div className="flex justify-start animate-in fade-in duration-500">
              <div className="flex gap-4">
                <div className="w-9 h-9 rounded-2xl bg-slate-500/10 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                </div>
                <div className={`px-5 py-4 rounded-3xl rounded-tl-none flex items-center gap-3 ${
                  isLight ? 'bg-slate-100' : 'bg-slate-900/50'
                }`}>
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-tighter text-slate-500">Processing Round</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* Input Area */}
      <footer className={`p-6 ${isLight ? 'bg-slate-50' : 'bg-[#050505]'}`}>
        <div className="max-w-3xl mx-auto">
          {isOwner ? (
            <div className={`relative group p-1 rounded-[2rem] transition-all shadow-2xl ${
              isLight ? 'bg-white shadow-slate-200' : 'bg-slate-900 shadow-black/50'
            }`}>
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value)
                  adjustTextareaHeight()
                }}
                onKeyDown={handleKeyPress}
                placeholder="Message the debate room..."
                className={`w-full bg-transparent pl-6 pr-16 py-5 rounded-[1.8rem] focus:outline-none resize-none text-[15px] font-medium leading-relaxed ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
                rows={1}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isTyping}
                className={`absolute right-3 bottom-3 w-12 h-12 rounded-[1.2rem] flex items-center justify-center transition-all ${
                  !newMessage.trim() || isTyping 
                    ? 'bg-slate-500/10 text-slate-500 opacity-50 cursor-not-allowed' 
                    : 'bg-amber-500 text-slate-900 hover:bg-amber-400 active:scale-95 shadow-lg shadow-amber-500/20'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          ) : (
            <div className={`py-4 text-center rounded-3xl border-2 border-dashed ${isLight ? 'border-slate-200 text-slate-400' : 'border-slate-800 text-slate-500'}`}>
              <p className="text-sm font-bold uppercase tracking-widest">Read Only Mode</p>
            </div>
          )}
          <p className="text-[10px] text-center mt-4 uppercase tracking-[0.2em] font-black opacity-30">
            Powered by Tarka Sabha Orchestrator v2.0
          </p>
        </div>
      </footer>
    </div>
  )
}