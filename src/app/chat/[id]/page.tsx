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
  const { session, isAuthenticated, isLoading: authLoading, signIn, signOut } = useAuth()
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

  // ... (adjusting sendMessage to check for username)

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
         // Force a chat refresh to check if auto-mode was enabled on server
         // (though usually we toggle it explicitly via toggleAutoMode)
         // Actually, let's just wait for the useEffect to kick in if chat.isAutoMode is true
         // But if the server enables it, we need to know.
         // Let's re-fetch chat too.
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

  // Removed legacy pollMessages function

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
          if (sendRes.ok) {
            // Poll will start automatically due to useEffect dependence on chat.isAutoMode
          } else {
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
      <div className={`min-h-screen flex items-center justify-center ${isLight ? 'bg-slate-100' : 'bg-slate-950'}`}>
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex flex-col ${isLight ? 'bg-slate-100' : 'bg-slate-950'}`}>
      {/* Username Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-2xl max-w-md w-full mx-4 ${isLight ? 'bg-white' : 'bg-slate-900 border border-slate-800'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Identity Setup
            </h2>
            <p className={`mb-4 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Choose a name to represent you in this debate. This name will be shared with the AI personas.
            </p>
            <input
              type="text"
              placeholder="Your name"
              className={`w-full px-4 py-3 rounded-xl border focus:border-amber-500/50 focus:outline-none mb-4 ${
                isLight ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
              }`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveUsername((e.target as HTMLInputElement).value)
                }
              }}
              autoFocus
            />
            <button
              onClick={(e) => saveUsername((e.target as HTMLElement).previousElementSibling?.querySelector('input')?.value || '')}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-semibold px-4 py-3 rounded-xl transition-all"
            >
              Start Chatting
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className={`p-6 rounded-2xl max-w-md w-full mx-4 ${isLight ? 'bg-white' : 'bg-slate-900 border border-slate-800'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Delete Debate?
                </h3>
                <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  This will permanently delete:
                </p>
              </div>
            </div>

            <ul className={`text-sm space-y-1 mb-4 pl-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              <li>- All chat messages</li>
              <li>- All personas and their configurations</li>
              <li>- Associated API keys/providers</li>
            </ul>

            <p className={`text-sm mb-6 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              This action <strong>cannot be undone</strong>.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={deleteChat}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 hover:text-red-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <header className={`flex-shrink-0 backdrop-blur-lg border-b ${
        isLight ? 'bg-white/80 border-slate-200' : 'bg-slate-950/80 border-slate-800'
      }`}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/history')}
                className={`p-2 rounded-lg transition-colors hover:bg-slate-200 dark:hover:bg-slate-800`}
              >
                <svg className={`w-5 h-5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {chat.topic || chat.title}
                </h1>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  {chat.participants?.length || 0} participants
                  {chat.isAutoMode && (
                    <span className="ml-2 inline-flex items-center gap-1 text-green-400">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Auto
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm">
                    {session?.user?.image ? (
                      <img src={session.user.image} alt="" className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
                        {username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                      {username}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
                >
                  Sign In
                </button>
              )}

              {isOwner ? (
                chat.isAutoMode ? (
                  <button
                    onClick={stopDebate}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={toggleAutoMode}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      chat.isAutoMode
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : isLight ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Auto
                  </button>
                )
              ) : (
                <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">
                  View Only
                </span>
              )}

              <button
                onClick={() => setShowChatSettings(!showChatSettings)}
                className={`p-2 rounded-lg transition-colors hover:bg-slate-200 dark:hover:bg-slate-800`}
              >
                <svg className={`w-5 h-5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat Settings Dropdown */}
          {showChatSettings && (
            <div className={`mt-3 p-3 rounded-lg border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {chat.participants?.map((p, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs font-bold text-white"
                        title={p.persona?.name}
                      >
                        {(p.persona?.name || '?').charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {chat.participants?.map(p => p.persona?.name).filter(Boolean).join(', ')}
                    </p>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                      Click to mention @name
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowUsernameModal(true)}
                    className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                      isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    Edit Name
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-red-400 hover:text-red-300 text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-500/10"
                    >
                      Delete Chat
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Chat Container - Distinct background */}
          <div className={`rounded-2xl ${
            isLight
              ? 'bg-white shadow-sm border border-slate-200'
              : 'bg-slate-900/50 shadow-xl border border-slate-800/50'
          }`}>
            <div className="p-6">
              {/* Welcome Message */}
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    isLight ? 'bg-slate-100' : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20'
                  }`}>
                    <svg className={`w-8 h-8 ${isLight ? 'text-slate-500' : 'text-amber-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {chat.topic || chat.title}
                  </h3>
                  <p className={`mb-6 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {isOwner ? 'Start the conversation or enable auto-debate mode' : 'Watch the debate unfold'}
                  </p>
                  {isOwner ? (
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => textareaRef.current?.focus()}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        Start Conversation
                      </button>
                      <button
                        onClick={toggleAutoMode}
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-green-500/30"
                      >
                        Enable Auto-Debate
                      </button>
                    </div>
                  ) : (
                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                      Only the debate creator can participate
                    </p>
                  )}
                </div>
              )}

              {/* Messages */}
              {messages.map((message, idx) => {
            const persona = chat.participants?.find(p => p.persona?.id === message.personaId)?.persona
            const isUserMessage = message.role === 'user'
            const showPersonaName = message.role !== 'user'

            return (
              <div
                key={message.id || idx}
                className={`mb-6 flex ${isUserMessage ? 'justify-end' : 'justify-start'}`}
              >
                {!isUserMessage && (
                  <div className="mr-3 flex-shrink-0">
                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                      {(persona?.name || '?').charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
                
                <div className={`flex flex-col ${isUserMessage ? 'items-end' : 'items-start'} max-w-[80%]`}>
                  {showPersonaName && (
                    <div className="flex items-center gap-2 mb-1 ml-1">
                      <span className={`text-xs font-bold tracking-wide ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        {persona?.name || 'Unknown'}
                      </span>
                      <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-5 py-3 shadow-md ${
                      isUserMessage
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-br-none'
                        : isLight
                          ? 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
                          : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  </div>
                  
                  {isUserMessage && (
                    <div className={`text-[10px] mt-1 mr-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                      {username} • {formatTime(message.createdAt)}
                    </div>
                  )}
                </div>

                {isUserMessage && (
                  <div className="ml-3 flex-shrink-0">
                     {session?.user?.image ? (
                        <img src={session.user.image} alt="" className="w-8 h-8 rounded-full shadow-lg" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                          {username.charAt(0).toUpperCase()}
                        </div>
                      )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start mb-6">
               <div className="mr-3 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center animate-pulse">
                    <div className="w-2 h-2 bg-slate-400 rounded-full" />
                  </div>
               </div>
               <div className={`rounded-2xl px-4 py-3 rounded-bl-none flex items-center gap-2 ${
                 isLight ? 'bg-white border border-slate-100' : 'bg-slate-800 border border-slate-700'
               }`}>
                 <div className="flex gap-1">
                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                 </div>
                 <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                   {chat.participants && chat.participants.length > 0 ? "Someone is typing..." : "Thinking..."}
                 </span>
               </div>
            </div>
          )}

          <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className={`flex-shrink-0 border-t ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          {!isOwner && (
            <div className="text-center mb-3">
              <span className="text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg">
                Viewing {chat.creatorId ? "someone else's" : "a shared"} debate
              </span>
            </div>
          )}

          {/* Only show input for owners */}
          {isOwner ? (
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value)
                  adjustTextareaHeight()
                }}
                onKeyPress={handleKeyPress}
                placeholder="Type a message... (use @name to mention)"
                className={`w-full rounded-2xl px-4 py-3 pr-14 focus:outline-none resize-none transition-colors ${
                  isLight
                    ? 'bg-slate-100 border border-slate-200 placeholder-slate-400 text-slate-800 focus:border-amber-500/50'
                    : 'bg-slate-900 border border-slate-800 placeholder-slate-500 text-white focus:border-amber-500/50'
                }`}
                rows={1}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isTyping}
                className="absolute right-2 bottom-2 p-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-900 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                {isAuthenticated
                  ? "You can watch but not participate in this debate"
                  : "Sign in to join the conversation"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
