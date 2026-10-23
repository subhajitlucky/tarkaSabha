import { HTMLAttributes, forwardRef } from 'react'
import { cx } from './cx'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds the lift shadow. Use sparingly — most surfaces should stay flat. */
  raised?: boolean
  /** Removes padding when the card wraps a table or list. */
  flush?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { raised = false, flush = false, className, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={cx(
        'rounded-[8px] border border-line bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
        !flush && 'p-4',
        raised && 'raised',
        className
      )}
      {...rest}
    />
  )
})

/** A hairline rule with an optional mono label sitting on it. */
export function Rule({ label, className }: { label?: string; className?: string }) {
  if (!label) {
    return <hr className={cx('border-0 border-t border-line', className)} />
  }

  return (
    <div className={cx('flex items-center gap-3', className)}>
      <span className="eyebrow whitespace-nowrap">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  )
}
