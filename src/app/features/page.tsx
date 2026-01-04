'use client'

import { useTheme } from '@/components/ThemeProvider'

export default function FeaturesPage() {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      title: 'Unique Personas',
      description: 'Create agents with custom names, bios, and personalities. Each has their own identity.',
      color: 'amber',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      title: 'Multi-Provider',
      description: 'Use OpenAI, Anthropic, Google, Groq, Ollama, or any custom API endpoint.',
      color: 'orange',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Secure & Encrypted',
      description: 'API keys are encrypted with AES-256-GCM. Your secrets stay safe.',
      color: 'green',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Auto-Debate Mode',
      description: 'Enable auto-debate and watch agents argue with each other automatically.',
      color: 'blue',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
      title: '@Mentions',
      description: 'Use @AgentName to call on specific personas in the discussion.',
      color: 'purple',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Topic Isolation',
      description: 'Personas only remember the current topic. Clean context for every debate.',
      color: 'red',
    },
  ]

  const colorClasses: Record<string, { bg: string; text: string }> = {
    amber: { bg: 'bg-amber-500/20', text: 'text-amber-500' },
    orange: { bg: 'bg-orange-500/20', text: 'text-orange-500' },
    green: { bg: 'bg-green-500/20', text: 'text-green-500' },
    blue: { bg: 'bg-blue-500/20', text: 'text-blue-500' },
    purple: { bg: 'bg-purple-500/20', text: 'text-purple-500' },
    red: { bg: 'bg-red-500/20', text: 'text-red-500' },
  }

  return (
    <div className={`min-h-screen py-12 ${isLight ? 'bg-slate-50' : 'bg-slate-950'}`}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Features
          </h1>
          <p className={`text-lg ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Everything you need for intelligent discussions
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`rounded-xl p-6 transition-all border hover:shadow-lg ${
                isLight 
                  ? 'bg-white border-slate-200 hover:border-amber-500/30' 
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl ${colorClasses[feature.color].bg} flex items-center justify-center mb-4`}>
                <span className={colorClasses[feature.color].text}>{feature.icon}</span>
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{feature.title}</h3>
              <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Protocol Info */}
        <div className={`mt-20 rounded-2xl p-8 border ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-800'
        }`}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-4">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-amber-500 font-medium">Brahmodya Protocol v1.0</span>
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>Advanced Multi-Agent Architecture</h2>
            <p className={isLight ? 'text-slate-500' : 'text-slate-400'}>Secure, scalable, and intelligent discussion platform</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                isLight ? 'bg-slate-100' : 'bg-slate-800'
              }`}>
                <svg className={`w-6 h-6 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className={`font-semibold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>AES-256 Encryption</h4>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>End-to-end encryption for all API keys</p>
            </div>

            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                isLight ? 'bg-slate-100' : 'bg-slate-800'
              }`}>
                <svg className={`w-6 h-6 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className={`font-semibold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Multi-Provider</h4>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Support for 6+ LLM providers</p>
            </div>

            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                isLight ? 'bg-slate-100' : 'bg-slate-800'
              }`}>
                <svg className={`w-6 h-6 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className={`font-semibold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Auto Mode</h4>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Round-robin speaker selection</p>
            </div>

            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                isLight ? 'bg-slate-100' : 'bg-slate-800'
              }`}>
                <svg className={`w-6 h-6 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className={`font-semibold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Rate Limiting</h4>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Per-provider rate limit handling</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
