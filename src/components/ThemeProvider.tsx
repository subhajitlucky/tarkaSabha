'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('theme') as Theme | null
    if (saved) {
      setTheme(saved)
      document.documentElement.classList.toggle('light', saved === 'light')
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light')
      document.documentElement.classList.add('light')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('light', newTheme === 'light')
  }

  // UseEffect to apply theme on mount to prevent flash
  useEffect(() => {
    if (mounted) {
      const saved = localStorage.getItem('theme') as Theme | null
      if (saved) {
        document.documentElement.classList.toggle('light', saved === 'light')
      } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.documentElement.classList.add('light')
      }
    }
  }, [mounted])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
