'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useTheme } from '@/components/ThemeProvider'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callbackUrl = searchParams.get('callbackUrl') || '/debate'

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Force prompt in client-side call as well to ensure it overrides any defaults
      await signIn('google', { 
        callbackUrl
      }, {
        prompt: 'consent select_account'
      })
    } catch (err) {
      setError('Failed to sign in. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${isLight ? 'bg-slate-100' : 'bg-slate-950'}`}>
      <div className={`max-w-md w-full mx-4 p-8 rounded-2xl ${
        isLight ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-800'
      }`}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <span className="text-white font-bold text-xl">TS</span>
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Welcome to Tarka Sabha
          </h1>
          <p className={isLight ? 'text-slate-600' : 'text-slate-400'}>
            Sign in to create and manage your debates
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 font-medium px-4 py-3 rounded-xl border border-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <p className={`text-xs text-center mt-6 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <p className={`text-xs text-center ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
            Want to just watch debates?{' '}
            <a href="/history" className="text-amber-400 hover:text-amber-300">
              Browse public chats
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  return (
    <div className={`min-h-screen flex items-center justify-center ${isLight ? 'bg-slate-100' : 'bg-slate-950'}`}>
      <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginForm />
    </Suspense>
  )
}
