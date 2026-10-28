import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cx } from './cx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

/**
 * A restrained financial-action hierarchy: solid primary, bordered secondary,
 * quiet ghost. Corners stay tight; the primary action carries the only lifted
 * edge in the system.
 */
const base =
  'inline-flex items-center justify-center gap-2 font-semibold tracking-[-0.01em] select-none ' +
  'rounded-[6px] border transition-[background-color,border-color,color,box-shadow,transform] duration-150 ' +
  'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-ink border-accent shadow-[0_1px_2px_rgba(18,28,23,0.18)] hover:bg-accent-hover hover:border-accent-hover hover:shadow-[0_2px_4px_rgba(18,28,23,0.2)]',
  secondary:
    'bg-surface text-text border-line-strong hover:border-accent hover:text-accent hover:bg-accent-soft/40',
  ghost:
    'bg-transparent text-muted border-transparent hover:text-text hover:bg-surface-2',
  danger:
    'bg-danger text-white border-danger hover:bg-danger/90 hover:border-danger/90',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'text-[0.8125rem] px-3 py-1.5 tracking-[0.01em]',
  md: 'text-sm px-4 py-2',
  lg: 'text-[0.9375rem] px-5 py-2.5',
}

export function buttonClasses({
  variant = 'secondary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
} = {}) {
  return cx(base, variants[variant], sizes[size], className)
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', className, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...rest}
    />
  )
})
