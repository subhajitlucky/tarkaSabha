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
  const [isSending, setIsSending] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [manualTurnsLeft, setManualTurnsLeft] = useState(0)
  const [showChatSettings, setShowChatSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showWipeConfirm, setShowWipeConfirm] = useState(false)
  const [localUsername, setLocalUsername] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isOwner, setIsOwner] = useState(false)

  // Load username from localStorage on client mount
  useEffect(() => {
    const saved = localStorage.getItem('tarka_username') || ''
    if (saved && saved !== 'You') {
      setLocalUsername(saved)
    } else {
      setShowUsernameModal(true)
    }
  }, [])

  // Get username
  const username = localUsername || 'Guest'

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

  // Poll for messages continuously
  useEffect(() => {
    let interval: NodeJS.Timeout
    let isActive = true

    // Poll every 3 seconds
    interval = setInterval(async () => {
      if (!isActive) return
      await fetchMessages()
    }, 3000)

    return () => {
      isActive = false
      clearInterval(interval)
    }
  }, [])

  // Client-driven Debate Loop (Vercel Stable)
  useEffect(() => {
    // Should we trigger a persona response?
    const shouldTrigger = chat?.isAutoMode || manualTurnsLeft > 0;
    if (!shouldTrigger || isProcessing || isSending) return;

    const timer = setTimeout(async () => {
      // Re-verify conditions
      if ((!chat?.isAutoMode && manualTurnsLeft <= 0) || isProcessing || isSending) return;

      setIsProcessing(true);
      setIsTyping(true);

      try {
        const res = await fetch(`/api/chats/${chatId}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isUser: false }),
        });

        if (res.ok) {
          await fetchMessages();
          if (manualTurnsLeft > 0) {
            setManualTurnsLeft(prev => prev - 1);
          }
        } else {
          const data = await res.json();
          setError(data.error || 'Agent failed to respond');
          setManualTurnsLeft(0);
          // If it's a persistent error, stop auto mode to prevent spamming
          if (chat?.isAutoMode) {
             setChat(prev => prev ? { ...prev, isAutoMode: false } : null);
          }
        }
      } catch (err) {
        console.error("Failed to trigger persona", err);
        setError("Connection error: Failed to reach the debate server.");
        setManualTurnsLeft(0);
      } finally {
        setIsProcessing(false);
        setIsTyping(false);
      }
    }, 4000); // 4 second wait between turns

    return () => clearTimeout(timer);
  }, [chat?.isAutoMode, manualTurnsLeft, messages.length, isProcessing, isSending]);
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
      const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null
      const url = `/api/chats/${chatId}/messages${lastMessageId ? `?lastId=${lastMessageId}` : ''}`
      
      const res = await fetch(url)
      if (res.ok) {
        const newMessages = await res.json()
        if (newMessages.length > 0) {
          setMessages(prev => {
            // Filter out any optimistic messages that have been confirmed by the server
            const filteredPrev = prev.filter(m => !m.id.startsWith('temp-'))
            
            // Check if we actually have new messages (avoid duplicates if polling overlaps)
            const existingIds = new Set(filteredPrev.map(m => m.id))
            const uniqueNewMessages = newMessages.filter((m: Message) => !existingIds.has(m.id))
            
            if (uniqueNewMessages.length === 0) return prev
            return [...filteredPrev, ...uniqueNewMessages]
          })
        }
      }
    } catch (e) {
      console.error('Failed to fetch messages', e)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !chat) return
    if (!localUsername) {
      setShowUsernameModal(true)
      return
    }

    const currentMessage = newMessage.trim()
    setError(null)
    
    // OPTIMISTIC UPDATE: Add message to UI immediately
    const tempId = 'temp-' + Date.now()
    const optimisticMessage: Message = {
      id: tempId,
      content: currentMessage,
      role: 'user',
      chatId,
      personaName: localUsername,
      createdAt: new Date()
    }
    
    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage('')
    adjustTextareaHeight()
    setIsSending(true)

    try {
      const res = await fetch(`/api/chats/${chatId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: currentMessage, isUser: true, userName: localUsername }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || 'Failed to send message')
      }

      const savedMessage = await res.json()
      
      // Replace optimistic message with saved one to get real ID
      setMessages(prev => prev.map(m => m.id === tempId ? savedMessage : m))
      
      // If manual mode, trigger one round of persona responses
      if (!chat.isAutoMode) {
        setManualTurnsLeft(chat.participants?.length || 0)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message')
      // Remove the optimistic message if it failed
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setNewMessage(currentMessage) // Restore the text so they don't lose it
    } finally {
      setIsSending(false)
    }
  }

  const toggleAutoMode = async () => {
    if (!chat) return
    const originalMode = chat.isAutoMode
    setError(null)
    
    // OPTIMISTIC UPDATE
    setChat({ ...chat, isAutoMode: !originalMode })

    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAutoMode: !originalMode }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to toggle auto mode')
      }
      const data = await res.json()
      setChat(data.chat)
    } catch (error: any) {
      setError(error.message || 'Failed to toggle auto mode')
      // Revert on error
      setChat(prev => prev ? { ...prev, isAutoMode: originalMode } : null)
    }
  }

  const stopDebate = async () => {
    if (!chat) return
    setError(null)
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAutoMode: false }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to stop debate')
      }
      setChat({ ...chat, isAutoMode: false })
      setIsTyping(false)
    } catch (error: any) {
      setError(error.message || 'Failed to stop debate')
    }
  }

  const deleteChat = async () => {
    try {
      await fetch(`/api/chats/${chatId}`, { method: 'DELETE' })
      router.push('/history')
    } catch (error) {
      setError('Failed to delete chat')
    }
  }

  const wipeMessages = async () => {
    if (!chat) return
    try {
      await fetch(`/api/chats/${chatId}/messages`, { method: 'DELETE' })
      setMessages([])
      setShowWipeConfirm(false)
      setShowChatSettings(false)
    } catch (error) {
      setError('Failed to wipe messages')
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
      <div className={`min-h-screen flex items-center justify-center ${isLight ? 'bg-slate-50' : 'bg-slate-950'}`}>
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Dynamic style variables to avoid parser errors with forward slashes
  const themeBg = isLight ? 'bg-slate-50' : 'bg-slate-950';
  const themeText = isLight ? 'text-slate-900' : 'text-slate-100';
  const headerBg = isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800';
  const sidebarBtn = isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-400';
  const statusBadge = chat.isAutoMode 
    ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' 
    : 'bg-slate-500/10 border-slate-500/20 text-slate-500 dark:text-slate-400';
  const identityBtn = isLight 
    ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-[0_2px_8px_rgba(0,0,0,0.05)]' 
    : 'bg-slate-900 border-slate-800 hover:border-amber-500 hover:bg-slate-800';
  const actionGroup = isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800';
  const toggleBtn = chat.isAutoMode 
    ? 'bg-red-500 text-white hover:bg-red-600 shadow-md' 
    : (isLight ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md' : 'text-slate-400 hover:bg-slate-800');
  const settingsBtn = showChatSettings 
    ? (isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-800')
    : (isLight ? 'hover:bg-slate-50 text-slate-600' : 'hover:bg-slate-800');
  const trayBg = isLight ? 'bg-white border-slate-200 shadow-xl' : 'bg-slate-900 border-slate-800 shadow-2xl';
  const trayItem = isLight ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-[0_2px_8px_rgba(0,0,0,0.05)]' : 'hover:bg-slate-800 text-slate-300';
  const deleteBtn = 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-sm';
  const signOutBtn = isLight ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-[0_2px_8px_rgba(0,0,0,0.05)]' : 'hover:bg-slate-800 text-slate-500 hover:text-slate-300';
  const messageInputBg = isLight ? 'bg-white shadow-xl shadow-slate-200/50 border border-slate-100' : 'bg-slate-900 shadow-black shadow-opacity-50';

  return (
    <div className={`min-h-screen flex flex-col font-sans ${themeBg} ${themeText}`}>
      {/* Username Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`p-8 rounded-3xl max-w-md w-full shadow-2xl ${isLight ? 'bg-white' : 'bg-slate-900 border border-slate-800'}`}>
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Identity Setup</h2>
            <p className="mb-6 text-sm opacity-60">
              Choose a name to represent you in this debate. This name will be shared with the AI personas.
            </p>
            <input
              type="text"
              placeholder="Your display name"
              className={`w-full px-5 py-4 rounded-2xl border-2 focus:ring-4 transition-all mb-6 text-lg font-medium ${
                isLight 
                  ? 'bg-slate-50 border-slate-100 focus:border-amber-500 focus:ring-amber-500 focus:ring-opacity-10 text-slate-900' 
                  : 'bg-slate-800 border-slate-700 focus:border-amber-500 focus:ring-amber-500 focus:ring-opacity-10 text-white'
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
              className={`w-full font-bold py-4 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
                isLight
                  ? 'bg-gradient-to-b from-slate-800 to-slate-950 text-white shadow-slate-900/20'
                  : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white'
              }`}
            >
              Start Chatting
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={`p-8 rounded-3xl max-w-md w-full shadow-2xl ${isLight ? 'bg-white' : 'bg-slate-900 border border-slate-800'}`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-red-500 bg-opacity-10 flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">Delete Debate?</h3>
                <p className="text-sm opacity-60">This action cannot be undone.</p>
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
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3.5 rounded-2xl text-sm font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-500 shadow-opacity-25"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wipe Confirmation Modal */}
      {showWipeConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={`p-8 rounded-3xl max-w-md w-full shadow-2xl ${isLight ? 'bg-white' : 'bg-slate-900 border border-slate-800'}`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 bg-opacity-10 flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">Wipe Messages?</h3>
                <p className="text-sm opacity-60">This will delete all messages. The debate will remain.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowWipeConfirm(false)}
                className={`flex-1 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={wipeMessages}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3.5 rounded-2xl text-sm font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500 shadow-opacity-25"
              >
                Wipe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-30 border-b transition-colors duration-300 ${headerBg} backdrop-blur-md`}>
        <div className="max-w-5xl mx-auto px-6 py-4 text-inherit">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => router.push('/history')}
                className={`p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 ${sidebarBtn}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight truncate leading-tight mb-0.5">
                  {chat.topic || chat.title}
                </h1>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusBadge}`}>
                    {chat.isAutoMode && <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />}
                    {chat.isAutoMode ? 'Autonomous' : 'Manual Mode'}
                  </div>
                  <span className="text-[10px] font-medium opacity-50">
                    {chat.participants?.length || 0} Agents active
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowUsernameModal(true)}
                className={`hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl transition-all border group cursor-pointer ${identityBtn}`}
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-[11px] font-black text-white shadow-sm transition-transform group-hover:scale-110">
                  <span className="truncate max-w-[90%]">
                    {username
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map(w => w[0]?.toUpperCase() || '')
                      .join('')}
                  </span>
                </div>
                <span className="text-sm font-bold tracking-tight">{username}</span>
              </button>

              <div className={`flex items-center p-1 rounded-xl border ${actionGroup}`}>
                {isOwner && (
                  <button
                    onClick={chat.isAutoMode ? stopDebate : toggleAutoMode}
                    className={`p-2 rounded-lg transition-all cursor-pointer ${toggleBtn}`}
                    title={chat.isAutoMode ? "Stop Debate" : "Start Debate"}
                  >
                    {chat.isAutoMode ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v6a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                    )}
                  </button>
                )}

                <button
                  onClick={() => setShowChatSettings(!showChatSettings)}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${settingsBtn} ${isLight ? 'text-slate-600' : 'text-slate-400'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {showChatSettings && (
          <div className="max-w-5xl mx-auto px-6 pb-4 animate-in slide-in-from-top-2 duration-200">
            <div className={`p-2 rounded-2xl border flex flex-col sm:flex-row gap-1 ${trayBg}`}>
              <button
                onClick={() => setShowUsernameModal(true)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${trayItem}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Change Identity
              </button>
              
              {isOwner && (
                <>
                  <button
                    onClick={() => setShowWipeConfirm(true)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${trayItem}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Wipe Messages
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${deleteBtn}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Delete Debate
                  </button>
                </>
              )}

              <button 
                onClick={() => signOut()}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${signOutBtn}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto px-6 py-8 bg-inherit">
        <div className="max-w-3xl mx-auto space-y-8">
          {messages.length === 0 && (
            <div className="py-20 text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-600 bg-opacity-20 rounded-3xl flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">New Debate Session</h3>
                <p className="text-sm opacity-50">Start the conversation or enable auto-mode to watch agents interact.</p>
              </div>
            </div>
          )}

          {messages.map((message, idx) => {
            const persona = chat.participants?.find(p => p.persona?.id === message.personaId)?.persona
            const isUser = message.role === 'user'
            
            // Generate a distinct color for each agent based on their ID
            const agentGradients = [
              'from-indigo-500 to-purple-600',
              'from-emerald-500 to-teal-600',
              'from-rose-500 to-pink-600',
              'from-blue-600 to-cyan-500',
              'from-violet-600 to-fuchsia-500',
              'from-sky-500 to-blue-700',
              'from-lime-500 to-green-600',
              'from-red-500 to-rose-700',
            ];
            
            const agentColor = persona 
              ? agentGradients[persona.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % agentGradients.length]
              : 'from-slate-500 to-slate-600';

            return (
              <div key={message.id || idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex gap-4 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-9 h-9 rounded-2xl overflow-hidden flex items-center justify-center text-sm font-bold text-white shadow-md bg-gradient-to-br ${
                      isUser 
                        ? 'from-amber-400 to-orange-600' 
                        : agentColor
                    }`}>
                      <span className="truncate max-w-[90%]">
                        {(isUser ? username : (persona?.name || 'A'))
                          .split(/\s+/)
                          .filter(Boolean)
                          .slice(0, 2)
                          .map(w => w[0]?.toUpperCase() || '')
                          .join('')}
                      </span>
                    </div>
                  </div>

                  <div className={`space-y-1.5 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isUser && (
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[11px] font-black uppercase tracking-widest opacity-50">{persona?.name || 'Agent'}</span>
                        <span className="text-[10px] font-medium opacity-40">{formatTime(message.createdAt)}</span>
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
                        <span className="text-[10px] font-medium opacity-40">{formatTime(message.createdAt)}</span>
                        <span className="text-[11px] font-black uppercase tracking-widest text-amber-500 opacity-80">You</span>
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
                <div className="w-9 h-9 rounded-2xl bg-slate-500 bg-opacity-10 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                </div>
                <div className={`px-5 py-4 rounded-3xl rounded-tl-none flex items-center gap-3 ${
                  isLight ? 'bg-slate-100' : 'bg-slate-900 bg-opacity-50'
                }`}>
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-tighter opacity-50">Processing Round</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* Input Area */}
      <footer className={`p-6 ${themeBg}`}>
        <div className="max-w-3xl mx-auto">
          {error && (
            <div className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/10 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {isOwner ? (
            <div className={`relative group p-1 rounded-[2rem] transition-all shadow-2xl ${messageInputBg}`}>
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value)
                  adjustTextareaHeight()
                }}
                onKeyDown={handleKeyPress}
                placeholder="Message the debate room..."
                className={`w-full bg-transparent pl-6 pr-16 py-5 rounded-[1.8rem] focus:outline-none resize-none text-[15px] font-medium leading-relaxed ${themeText}`}
                rows={1}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isSending}
                className={`absolute right-3 bottom-3 w-12 h-12 rounded-[1.2rem] flex items-center justify-center transition-all ${
                  !newMessage.trim() || isSending 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : isLight
                      ? 'bg-gradient-to-b from-slate-800 to-slate-950 text-white shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 active:scale-95'
                      : 'bg-amber-500 text-slate-900 hover:bg-amber-400 active:scale-95 shadow-lg'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="py-4 text-center rounded-3xl border-2 border-dashed border-opacity-20 border-slate-500 opacity-50">
              <p className="text-sm font-bold uppercase tracking-widest">Read Only Mode</p>
            </div>
          )}
          <p className="text-[10px] text-center mt-4 uppercase tracking-[0.2em] font-black opacity-20">
            Powered by Tarka Sabha Orchestrator v2.0
          </p>
        </div>
      </footer>
    </div>
  )
}
