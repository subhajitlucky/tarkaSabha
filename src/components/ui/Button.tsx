import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cx } from './cx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

/**
 * Deliberately squared. The previous design leaned on large radii and a global
 * translateY hover, which reads as generic; a printed-journal direction wants
 * crisp corners and a change of ink rather than a lift.
 */
const base =
  'inline-flex items-center justify-center gap-2 font-medium select-none ' +
  'rounded-[3px] border transition-colors duration-150 ' +
  'disabled:opacity-45 disabled:cursor-not-allowed ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2'

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-ink border-accent hover:bg-accent-hover hover:border-accent-hover glow-accent',
  secondary:
    'bg-surface-2 text-text border-line hover:border-line-strong hover:bg-surface-3',
  ghost:
    'bg-transparent text-muted border-transparent hover:text-text hover:bg-surface-2',
  danger:
    'bg-transparent text-danger border-line hover:bg-danger-soft hover:border-danger hover:glow-danger',
}

const sizes: Record<Size, string> = {
  sm: 'text-xs px-2.5 py-1.5 tracking-wide',
  md: 'text-sm px-3.5 py-2',
  lg: 'text-[0.9375rem] px-5 py-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', className, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(base, variants[variant], sizes[size], className)}
      {...rest}
    />
  )
})
