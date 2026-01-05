'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Session, User } from 'next-auth'
import { signOut as nextAuthSignOut } from 'next-auth/react'

type AuthContextType = {
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  user: User | null
  signIn: () => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Fetch initial session
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        setSession(data)
        setIsLoading(false)
      })
      .catch(() => {
        setSession(null)
        setIsLoading(false)
      })

    // Listen for session changes
    const interval = setInterval(() => {
      fetch('/api/auth/session')
        .then(res => res.json())
        .then(data => {
          if (JSON.stringify(data) !== JSON.stringify(session)) {
            setSession(data)
          }
        })
        .catch(() => setSession(null))
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const signIn = async () => {
    router.push('/login')
  }

  const signOut = async () => {
    await nextAuthSignOut({ redirect: false })
    setSession(null)
    router.push('/')
    router.refresh()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        isAuthenticated: !!session?.user,
        user: session?.user ?? null,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
