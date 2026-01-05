'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/components/ThemeProvider'
import { useAuth } from '@/components/AuthProvider'

export default function FeedbackPage() {
  const { theme } = useTheme()
  const { session } = useAuth()
  const isLight = theme === 'light'
  
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

      if (!res.ok) throw new Error('Failed to submit feedback')

      setSuccess(true)
      setMessage('')
      if (!session) {
        setName('')
        setEmail('')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen pt-24 pb-12 px-6 ${isLight ? 'bg-slate-50' : 'bg-slate-950'}`}>
      <div className="max-w-2xl mx-auto">
        <h1 className={`text-3xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Feedback & Support
        </h1>
        <p className={`mb-8 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          Have a suggestion, found a bug, or just want to say hi? We'd love to hear from you.
        </p>

        <div className={`p-8 rounded-2xl border ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          {success ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Thank You!
              </h3>
              <p className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                Your feedback has been received. We appreciate your input!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <button
                  onClick={() => setSuccess(false)}
                  className={`px-6 py-2 rounded-xl font-medium transition-all ${
                    isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Send another message
                </button>
                <Link
                  href="/dashboard"
                  className={`px-6 py-2 rounded-xl font-medium transition-all ${
                    isLight 
                      ? 'bg-slate-900 text-white hover:bg-slate-800' 
                      : 'bg-amber-500 text-slate-900 hover:bg-amber-400'
                  }`}
                >
                  View your feedback
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {!session && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${
                        isLight 
                          ? 'bg-slate-50 border-slate-200 text-slate-900' 
                          : 'bg-slate-800 border-slate-700 text-white'
                      }`}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${
                        isLight 
                          ? 'bg-slate-50 border-slate-200 text-slate-900' 
                          : 'bg-slate-800 border-slate-700 text-white'
                      }`}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-900' 
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <option value="general">General Inquiry</option>
                  <option value="feature">Feature Request</option>
                  <option value="bug">Bug Report</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-amber-500 outline-none transition-all ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-900' 
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                  placeholder="How can we help you?"
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border ${
                  isLight
                    ? 'bg-gradient-to-b from-slate-800 to-slate-950 border-slate-800 text-white shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 hover:-translate-y-0.5'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/20 border-transparent'
                }`}
              >
                {loading ? 'Sending...' : 'Send Feedback'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
