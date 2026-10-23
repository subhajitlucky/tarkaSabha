'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Rule } from '@/components/ui/Card'

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
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
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callbackUrl = searchParams.get('callbackUrl') || '/workspaces'

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(callbackUrl.startsWith('/login') ? '/workspaces' : callbackUrl)
    }
  }, [authLoading, callbackUrl, isAuthenticated, router])

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await signIn('google', { callbackUrl }, { prompt: 'consent select_account' })
    } catch {
      setError('Could not sign you in. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center px-5 py-14">
      <div className="grid w-full overflow-hidden border border-line bg-surface shadow-lift lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="hidden flex-col justify-between border-r border-line bg-surface-2 p-8 lg:flex lg:p-10">
          <div>
            <span
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center border border-accent-line bg-surface font-display text-lg text-accent"
            >
              त
            </span>
            <p className="eyebrow mt-8">The private workspace</p>
            <h2 className="mt-4 text-4xl leading-[1.05] text-text">
              The record behind the decision.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Open your workspaces, keep source-backed evidence, and leave an approval trail
              behind every decision.
            </p>
          </div>

          <div className="mt-10 space-y-4 border-t border-accent-line pt-5">
            {[
              ['Source-backed evidence', 'Every claim carries a path, quote, and hash.'],
              ['Decision records', 'Ownership, trade-offs, pins, and approvals in one place.'],
              ['Shareable dossiers', 'A board-ready record with open questions called out.'],
            ].map(([title, body]) => (
              <div key={title}>
                <p className="text-sm font-semibold text-text">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </aside>

        <div className="p-6 sm:p-10">
          <div className="mb-6">
            <span
              aria-hidden="true"
              className="mb-4 flex h-11 w-11 items-center justify-center border border-accent-line bg-accent-soft font-display text-lg text-accent lg:hidden"
            >
              त
            </span>
            <p className="eyebrow">Workspace access</p>
            <h1 className="mt-3 text-3xl text-text">Sign in to the record</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Use the account that owns or reviews the workspace.
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="mb-5 rounded-[3px] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger"
            >
              {error}
            </p>
          )}

          <Button
            variant="secondary"
            size="lg"
            // Deliberately off-palette: Google's brand guidelines require the
            // white button with dark text for this mark.
            className="w-full bg-white text-slate-900 hover:bg-slate-50"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <GoogleMark />
            {isLoading ? 'Signing in…' : 'Continue with Google'}
          </Button>

          <p className="mt-4 text-center text-[0.8125rem] text-subtle">
            By continuing you agree to the <a href="/terms" className="text-muted underline decoration-line underline-offset-4 hover:text-accent">terms</a> and <a href="/privacy" className="text-muted underline decoration-line underline-offset-4 hover:text-accent">privacy policy</a>.
          </p>

          <Rule className="my-6" />

          <p className="text-center text-[0.8125rem] text-subtle">
            Just here to look?{' '}
            <a href="/diligence" className="text-accent transition-colors hover:text-accent-hover">
              See the sample dossier
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <span className="font-mono text-xs uppercase tracking-[0.14em] text-subtle">
        Loading…
      </span>
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
