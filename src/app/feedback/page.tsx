'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Card, Rule } from '@/components/ui/Card'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/EmptyState'

export default function FeedbackPage() {
  const { session } = useAuth()

  const [message, setMessage] = useState('')
  const [type, setType] = useState('general')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          type,
          name: session?.user?.name || name,
          email: session?.user?.email || email,
        }),
      })

      // Surface the server's own message where there is one — a rate limit is
      // actionable, "something went wrong" is not.
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Could not send your message')
      }

      setSuccess(true)
      setMessage('')
      if (!session) {
        setName('')
        setEmail('')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send your message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-[80rem] px-5 sm:px-8 lg:px-10 py-14">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div>
          <PageHeader
            eyebrow="Feedback"
            title="Tell us what is wrong"
            lede="A bug, a missing feature, or an argument the council got badly wrong — all of it is useful."
          />

          <Card className="mt-8">
            <p className="eyebrow">What helps</p>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent" />
                The page and the action you were trying to complete.
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent" />
                What you expected, and what happened instead.
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent" />
                A source or screenshot if the record looks wrong.
              </li>
            </ul>
            <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-subtle">
              Feedback is read by the team. If you leave an email, we may follow up with a
              question — not a newsletter.
            </p>
          </Card>
        </div>

        <Card className="self-start">
        {success ? (
          <div className="py-8 text-center">
            <p className="eyebrow mb-3 text-success">Received</p>
            <h2 className="text-xl text-text">Thank you</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
              Your message is on the record. If you left an email we may follow up.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              <Button variant="secondary" onClick={() => setSuccess(false)}>
                Send another
              </Button>
              <Link href="/workspaces">
                <Button variant="primary">Open your workspaces</Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {!session && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Name — optional">
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </Field>
                <Field label="Email — optional">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </Field>
              </div>
            )}

            <Field label="Kind">
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="general">General enquiry</option>
                <option value="feature">Feature request</option>
                <option value="bug">Bug report</option>
                <option value="other">Other</option>
              </Select>
            </Field>

            <Field label="Message" hint="Up to 2000 characters.">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                placeholder="What happened, and what did you expect instead?"
              />
            </Field>

            {error && (
              <p
                role="alert"
                className="rounded-[3px] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger"
              >
                {error}
              </p>
            )}

            <Rule />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Sending…' : 'Send feedback'}
            </Button>
          </form>
        )}
        </Card>
      </div>
    </div>
  )
}
