'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { cx } from './cx'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  /** Optional mono label above the title. */
  eyebrow?: string
  children: ReactNode
  /** Actions rendered in the footer, right-aligned. */
  footer?: ReactNode
  className?: string
}

/**
 * A dialog panel. Handles the things that are easy to forget: Escape to close,
 * a labelled dialog role, focus moved into the panel on open, and focus
 * restored to whatever was focused before.
 */
export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement as HTMLElement | null
    panelRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      data-modal-overlay=""
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cx(
          'relative flex max-h-[86vh] w-full max-w-2xl flex-col',
          'rounded-[5px] border border-line bg-surface pop focus:outline-none',
          className
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
            <h2 className="truncate text-lg text-text">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 rounded-[3px] px-2 py-1 font-mono text-sm text-subtle transition-colors hover:bg-surface-2 hover:text-text"
          >
            ✕
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <footer className="flex justify-end gap-2 border-t border-line px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
