import { ReactNode } from 'react'
import { cx } from './cx'

/** A quiet placeholder for empty lists and unrun states. */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center rounded-[8px] border border-dashed border-line',
        'px-6 py-10 text-center',
        className
      )}
    >
      <p className="text-sm font-semibold text-text">{title}</p>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** Page masthead: mono eyebrow, display title, optional lede and actions. */
export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
  className,
}: {
  eyebrow?: string
  title: string
  lede?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <header className={cx('mb-6', className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
          <h1 className="max-w-4xl font-sans text-2xl font-semibold leading-[1.1] tracking-[-0.025em] text-text sm:text-3xl">
            {title}
          </h1>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {lede && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{lede}</p>}
      <span className="draw-rule mt-5 block h-px bg-line" />
    </header>
  )
}
