import { HTMLAttributes } from 'react'
import { cx } from './cx'

type Tone = 'neutral' | 'accent' | 'danger' | 'success' | 'warning' | 'info' | 'outline'

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-muted border-line',
  accent: 'bg-accent-soft text-accent border-accent-line',
  danger: 'bg-danger-soft text-danger border-danger/30',
  success: 'bg-success-soft text-success border-success/30',
  warning: 'bg-warning-soft text-warning border-warning/30',
  info: 'bg-info-soft text-info border-info/30',
  outline: 'bg-transparent text-muted border-line',
}

/**
 * A squared tag in the mono face — the journal's marginalia. Sized to read as
 * metadata rather than as a button.
 */
export function Badge({
  tone = 'neutral',
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-0.5',
        'whitespace-nowrap font-mono text-[0.6875rem] uppercase tracking-[0.12em]',
        tones[tone],
        className
      )}
      {...rest}
    />
  )
}
