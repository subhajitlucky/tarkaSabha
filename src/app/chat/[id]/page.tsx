'use client'

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Artifact, Chat, Message } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/components/AuthProvider'

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

const USERNAME_STORAGE_KEY = 'tarka_username'

function subscribeToStoredUsername(onChange: () => void) {
  window.addEventListener('storage', onChange)
  return () => window.removeEventListener('storage', onChange)
}

function getStoredUsername() {
  return localStorage.getItem(USERNAME_STORAGE_KEY) || ''
}

// SSR and the hydration pass have no localStorage, so render the default and let
// React re-read the real value once the client takes over.
function getServerStoredUsername() {
  return ''
}

const subscribeToNothing = () => () => {}

function useHydrated() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  )
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.id as string

  const { session, signOut } = useAuth()
  const [chat, setChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showChatSettings, setShowChatSettings] = useState(false)
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [showDeliverable, setShowDeliverable] = useState(false)
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [showOtherCandidates, setShowOtherCandidates] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usernameModalRequested, setUsernameModalRequested] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showWipeConfirm, setShowWipeConfirm] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // The display name lives in an external store (localStorage). useSyncExternalStore
  // reads it without a setState-in-effect cascade and defers to the SSR default
  // during hydration, so server and client markup agree.
  const storedUsername = useSyncExternalStore(
    subscribeToStoredUsername,
    getStoredUsername,
    getServerStoredUsername
  )
  const [savedUsername, setSavedUsername] = useState<string | null>(null)
  const localUsername = savedUsername ?? storedUsername

  const hydrated = useHydrated()
  const needsUsername = !localUsername || localUsername === 'You'
  const showUsernameModal = usernameModalRequested || (hydrated && needsUsername)

  // Ownership is derived from the loaded chat and the session — no effect needed.
  const isOwner = Boolean(
    chat?.creatorId && session?.user?.id && chat.creatorId === session.user.id
  )

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`)
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
  }, [chatId])

  // Get username
  const username = localUsername || 'Guest'

  const saveUsername = (name: string) => {
    const trimmed = name.trim()
    if (trimmed) {
      localStorage.setItem(USERNAME_STORAGE_KEY, trimmed)
      setSavedUsername(trimmed)
      setUsernameModalRequested(false)
    }
  }

  // Turns are executed server-side by the debate runner, so this component only
  // polls for messages. Previously a timer here POSTed to /send every 4 seconds,
  // which meant closing the tab stopped the debate.
  const startRun = async (turns?: number) => {
    setError(null)
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAutoMode: true, turns }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Could not start the debate')
      }
      const data = await res.json()
      setChat(data.chat)
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not start the debate'))
    }
  }

  const fetchArtifacts = useCallback(async () => {
    try {
      const res = await fetch(`/api/chats/${chatId}/artifacts`)
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data)) setArtifacts(data)
    } catch (e) {
      console.error('Failed to fetch deliverables', e)
    }
  }, [chatId])

  // Ask the server to turn the discussion so far into a deliverable. It
  // generates several candidates, scores them against the rubric, and keeps the
  // best one; all of them are stored so the run is auditable.
  const synthesize = async (rounds = 1) => {
    setError(null)
    setIsSynthesizing(true)
    try {
      const res = await fetch(`/api/chats/${chatId}/artifacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates: 3, rounds }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || 'Could not produce a deliverable')
      }
      await fetchArtifacts()
      setShowDeliverable(true)
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not produce a deliverable'))
    } finally {
      setIsSynthesizing(false)
    }
  }
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

  // Load the chat once, then poll for new messages every 3 seconds.
  useEffect(() => {
    if (!chatId) return
    let isActive = true

    const loadChat = async () => {
      try {
        const res = await fetch(`/api/chats/${chatId}`)
        if (!res.ok || !isActive) return
        const data = await res.json()
        if (isActive) setChat(data)
      } catch (e) {
        console.error('Failed to fetch chat', e)
      }
    }

    const tick = async () => {
      if (!isActive) return
      await fetchMessages()
    }

    // Wrapped locally: calling the memoised callback straight from the effect
    // body trips the set-state-in-effect rule, which cannot see through it.
    const loadDeliverables = async () => {
      await fetchArtifacts()
    }

    loadChat()
    loadDeliverables()
    tick()
    const interval = setInterval(tick, 3000)

    return () => {
      isActive = false
      clearInterval(interval)
    }
  }, [chatId, fetchMessages, fetchArtifacts])

  const sendMessage = async () => {
    if (!newMessage.trim() || !chat) return
    if (!localUsername) {
      setUsernameModalRequested(true)
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
      
      // If manual mode, let every participant respond once. The server runs the
      // turns, so this does not depend on the tab staying open.
      if (!chat.isAutoMode) {
        await startRun(chat.participants?.length || 1)
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to send message'))
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
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to toggle auto mode'))
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
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to stop debate'))
    }
  }

  const deleteChat = async () => {
    try {
      await fetch(`/api/chats/${chatId}`, { method: 'DELETE' })
      router.push('/history')
    } catch {
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
    } catch {
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
      <div className={`min-h-screen flex items-center justify-center ${'bg-bg'}`}>
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Dynamic style variables to avoid parser errors with forward slashes
  const themeBg = 'bg-bg';
  const themeText = 'text-text';
  const headerBg = 'bg-surface border-line';
  const sidebarBtn = 'hover:bg-surface-2 text-muted';
  const identityBtn = 'bg-surface border border-line text-text hover:bg-surface-2';
  const actionGroup = 'bg-surface border-line';
  const toggleBtn = chat.isAutoMode 
    ? 'border-danger bg-danger-soft text-danger' 
    : ('bg-surface-2 text-text hover:bg-surface-3');
  const settingsBtn = showChatSettings 
    ? ('bg-surface-3 text-text')
    : ('hover:bg-surface-2 text-muted');
  const trayBg = 'bg-surface border-line shadow-lift';
  const trayItem = 'bg-surface border border-line text-text hover:bg-surface-2';
  const deleteBtn = 'bg-danger-soft text-danger border border-danger/30 hover:border-danger';
  const signOutBtn = 'bg-surface border border-line text-muted hover:bg-surface-2 hover:text-text';
  const messageInputBg = 'bg-surface shadow-lift border border-line';

  return (
    <div className={`min-h-screen flex flex-col font-sans ${themeBg} ${themeText}`}>
      {/* Username Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-[4px] border border-line bg-surface p-7 shadow-lift">
            <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-[3px] border border-accent-line bg-accent-soft font-display text-xl text-accent">
              त
            </span>
            <h2 className="text-xl text-text">Take your seat</h2>
            <p className="mb-6 mt-2 text-sm leading-relaxed text-muted">
              Choose the name the agents will know you by in this council.
            </p>
            <input
              type="text"
              placeholder="Your display name"
              className="mb-6 w-full rounded-[3px] border border-line bg-surface-2 px-4 py-3 text-base text-text transition-colors placeholder:text-subtle focus:border-accent focus:outline-none" 
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
              className="w-full rounded-[3px] border border-accent bg-accent py-3 font-medium text-accent-ink transition-colors hover:bg-accent-hover" 
            >
              Start Chatting
            </button>
          </div>
        </div>
      )}

      {/* Deliverable Modal */}
      {showDeliverable && (() => {
        const ranked = [...artifacts].sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
        const best = ranked.find(a => a.selected) ?? ranked[0]
        const others = ranked.filter(a => a !== best)

        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`p-6 rounded-[4px] max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl ${'bg-surface border border-line'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className={`text-xl font-bold ${'text-text'}`}>Deliverable</h2>
                  {best?.score != null && (
                    <span
                      title="Weighted rubric score out of 10"
                      className="rounded-[3px] border border-accent-line bg-accent-soft px-2 py-0.5 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-accent"
                    >
                      {best.score.toFixed(1)} / 10
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowDeliverable(false)}
                  className={`w-8 h-8 rounded-[3px] flex items-center justify-center cursor-pointer ${'hover:bg-surface-2 text-muted'}`}
                  title="Close"
                >
                  ✕
                </button>
              </div>

              {!best ? (
                <p className={`text-sm py-8 text-center ${'text-muted'}`}>
                  No deliverable yet. Run a few turns, then synthesise the discussion into an answer.
                </p>
              ) : (
                <div className="overflow-y-auto flex-1 pr-1">
                  <h3 className={`text-lg font-semibold mb-3 ${'text-text'}`}>
                    {best.title}
                  </h3>
                  <div className={`text-sm whitespace-pre-wrap leading-relaxed ${'text-text'}`}>
                    {best.content}
                  </div>

                  {best.breakdown && best.breakdown.length > 0 && (
                    <div className="mt-5">
                      <h4 className={`text-xs font-bold uppercase tracking-wide mb-2 ${'text-muted'}`}>
                        Rubric
                      </h4>
                      <div className="space-y-1.5">
                        {best.breakdown.map(criterion => (
                          <div key={criterion.key} className="flex items-start gap-3 text-xs">
                            <span className={`w-24 flex-shrink-0 font-semibold ${'text-text'}`}>
                              {criterion.label}
                            </span>
                            <span className="w-8 flex-shrink-0 font-mono text-accent">{criterion.score}</span>
                            <span className={'text-subtle'}>{criterion.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-subtle mt-4">
                    {best.model && `Produced by ${best.model}`}
                    {best.angle && ` · ${best.angle} angle`}
                    {best.round ? ` · round ${best.round}` : ''}
                  </p>

                  {others.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-line">
                      <button
                        onClick={() => setShowOtherCandidates(!showOtherCandidates)}
                        className={`text-xs font-bold cursor-pointer ${'text-muted hover:text-text'}`}
                      >
                        {showOtherCandidates ? '▾' : '▸'} {others.length} other candidate{others.length > 1 ? 's' : ''} considered
                      </button>

                      {showOtherCandidates && (
                        <div className="mt-3 space-y-2">
                          {others.map(candidate => (
                            <div key={candidate.id} className={`p-3 rounded-[3px] text-xs ${'bg-surface-2'}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono font-bold text-accent">
                                  {candidate.score != null ? candidate.score.toFixed(1) : '—'}
                                </span>
                                <span className={'text-text'}>{candidate.title}</span>
                                <span className="text-subtle">
                                  {candidate.angle}{candidate.round ? ` · round ${candidate.round}` : ''}
                                </span>
                              </div>
                              <div className={`whitespace-pre-wrap line-clamp-3 ${'text-subtle'}`}>
                                {candidate.content.slice(0, 240)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-line">
                <button
                  onClick={() => synthesize(2)}
                  disabled={isSynthesizing}
                  title="Generate candidates, judge them, and retry once if the best scores below 7"
                  className={`px-4 py-3 rounded-[3px] font-bold text-sm transition-all cursor-pointer ${
                    isSynthesizing
                      ? 'cursor-not-allowed bg-surface-3 text-subtle'
                      : 'bg-surface-2 border border-line text-text hover:border-line-strong'
                  }`}
                >
                  Thorough
                </button>
                <button
                  onClick={() => synthesize(1)}
                  disabled={isSynthesizing}
                  className={`px-5 py-3 rounded-[3px] font-bold text-sm transition-all cursor-pointer ${
                    isSynthesizing
                      ? 'cursor-not-allowed bg-surface-3 text-subtle'
                      : 'border-accent bg-accent text-accent-ink hover:bg-accent-hover'
                  }`}
                >
                  {isSynthesizing
                    ? 'Synthesising…'
                    : artifacts.length > 0 ? 'Regenerate' : 'Synthesise'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={`p-8 rounded-[4px] max-w-md w-full shadow-2xl ${'bg-surface border border-line'}`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-[4px] bg-danger-soft flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">Delete Debate?</h3>
                <p className="text-sm text-muted">This action cannot be undone.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`flex-1 px-6 py-3.5 rounded-[4px] text-sm font-bold transition-all ${
                  'bg-surface-2 hover:bg-surface-3 text-text'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={deleteChat}
                className="flex-1 cursor-pointer rounded-[3px] border border-danger bg-danger-soft px-5 py-3 text-sm font-medium text-danger transition-colors hover:bg-danger hover:text-white"
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
          <div className={`p-8 rounded-[4px] max-w-md w-full shadow-2xl ${'bg-surface border border-line'}`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[3px] border border-danger/30 bg-danger-soft">
                <svg className="h-6 w-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">Wipe Messages?</h3>
                <p className="text-sm text-muted">This will delete all messages. The debate will remain.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowWipeConfirm(false)}
                className={`flex-1 px-6 py-3.5 rounded-[4px] text-sm font-bold transition-all ${
                  'bg-surface-2 hover:bg-surface-3 text-text'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={wipeMessages}
                className="flex-1 cursor-pointer rounded-[3px] border border-danger bg-danger-soft px-5 py-3 text-sm font-medium text-danger transition-colors hover:bg-danger hover:text-white"
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
                className={`p-2.5 rounded-[3px] transition-all hover:scale-105 active:scale-95 ${sidebarBtn}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0">
                <h1 className="mb-1 truncate font-display text-lg leading-tight text-text">
                  {chat.topic || chat.title}
                </h1>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-[3px] border px-1.5 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.1em] ${
                      chat.isAutoMode
                        ? 'border-success/30 bg-success-soft text-success'
                        : 'border-line bg-surface-2 text-subtle'
                    }`}
                  >
                    {chat.isAutoMode && (
                      <span className="h-1 w-1 animate-pulse rounded-full bg-success" />
                    )}
                    {chat.isAutoMode ? 'Running' : 'Manual'}
                  </span>
                  <span className="font-mono text-[0.625rem] text-subtle">
                    {chat.participants?.length || 0} agent{chat.participants?.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setUsernameModalRequested(true)}
                className={`hidden sm:flex items-center gap-3 px-4 py-2 rounded-[3px] transition-all border group cursor-pointer ${identityBtn}`}
              >
                <Avatar name={username} size="sm" />
                <span className="text-sm font-bold tracking-tight">{username}</span>
              </button>

              <div className={`flex items-center p-1 rounded-[3px] border ${actionGroup}`}>
                {isOwner && (
                  <button
                    onClick={() => setShowDeliverable(true)}
                    className={`px-3 py-2 rounded-[3px] text-xs font-bold transition-all cursor-pointer ${settingsBtn} ${'text-muted'}`}
                    title="The synthesised deliverable for this task"
                  >
                    Deliverable{artifacts.length > 0 ? ` (${artifacts.length})` : ''}
                  </button>
                )}

                {isOwner && (
                  <button
                    onClick={chat.isAutoMode ? stopDebate : toggleAutoMode}
                    className={`p-2 rounded-[3px] transition-all cursor-pointer ${toggleBtn}`}
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
                  className={`p-2 rounded-[3px] transition-all cursor-pointer ${settingsBtn} ${'text-muted'}`}
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
            <div className={`p-2 rounded-[4px] border flex flex-col sm:flex-row gap-1 ${trayBg}`}>
              <button
                onClick={() => setUsernameModalRequested(true)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-[3px] font-bold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${trayItem}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Change Identity
              </button>
              
              {isOwner && (
                <>
                  <button
                    onClick={() => setShowWipeConfirm(true)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-[3px] font-bold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${trayItem}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Wipe Messages
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-[3px] font-bold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${deleteBtn}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Delete Debate
                  </button>
                </>
              )}

              <button 
                onClick={() => signOut()}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-[3px] font-bold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${signOutBtn}`}
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
              <span className="eyebrow mb-4 block">The floor is open</span>
              <h3 className="text-xl text-text">Nothing on the record yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
                Say something to open the discussion, or start the council and let the
                agents work the objective on their own.
              </p>
            </div>
          )}

          {messages.map((message, idx) => {
            const persona = chat.participants?.find(p => p.persona?.id === message.personaId)?.persona
            const isUser = message.role === 'user'

            return (
              <div key={message.id || idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex gap-4 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="flex-shrink-0 mt-1">
                    <Avatar name={isUser ? username : (persona?.name || message.personaName || "Agent")} size="md" />
                  </div>

                  <div className={`space-y-1.5 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isUser && (
                      <div className="flex items-center gap-2 px-1">
                        <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-muted">{persona?.name || 'Agent'}</span>
                        <span className="font-mono text-[0.625rem] text-subtle">{formatTime(message.createdAt)}</span>
                      </div>
                    )}
                    
                    <div className={`prose-ledger rounded-[4px] px-4 py-3 text-[0.9375rem] ${
                      isUser
                        ? 'bg-accent text-accent-ink'
                        : 'border border-line bg-surface text-text'
                    }`}>
                      {message.content}
                    </div>

                    {isUser && (
                      <div className="flex items-center gap-2 px-1">
                        <span className="font-mono text-[0.625rem] text-subtle">{formatTime(message.createdAt)}</span>
                        <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-accent">You</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {chat?.isAutoMode && (
            <div className="flex justify-start animate-in fade-in duration-500">
              <div className="flex gap-4">
                <div className="w-9 h-9 rounded-[4px] bg-surface-2 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <div className="w-1.5 h-1.5 bg-subtle rounded-full" />
                </div>
                <div className={`px-5 py-4 rounded-[4px] rounded-tl-none flex items-center gap-3 ${
                  'bg-surface-2'
                }`}>
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
                  </div>
                  <span className="eyebrow">Working</span>
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
            <div className="mb-4 p-4 rounded-[4px] bg-danger-soft border border-danger/30 text-danger text-sm animate-in fade-in slide-in-from-bottom-2 duration-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="p-1 hover:bg-danger-soft rounded-[3px] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {isOwner ? (
            <div className={`relative group p-1 rounded-[4px] transition-all shadow-lift ${messageInputBg}`}>
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value)
                  adjustTextareaHeight()
                }}
                onKeyDown={handleKeyPress}
                placeholder="Message the debate room..."
                className={`w-full bg-transparent pl-5 pr-16 py-4 rounded-[3px] focus:outline-none resize-none text-[15px] font-medium leading-relaxed ${themeText}`}
                rows={1}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isSending}
                className={`absolute right-3 bottom-3 w-12 h-12 rounded-[3px] flex items-center justify-center transition-all ${
                  !newMessage.trim() || isSending
                    ? 'cursor-not-allowed bg-surface-2 text-subtle'
                    : 'bg-accent text-accent-ink hover:bg-accent-hover active:scale-95'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="rounded-[4px] border border-dashed border-line py-4 text-center">
              <p className="eyebrow">Read-only — only the creator can post</p>
            </div>
          )}
          <p className="eyebrow mt-4 text-center">Brahmodya Protocol</p>
        </div>
      </footer>
    </div>
  )
}
