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
        'flex flex-col items-center justify-center rounded-[4px] border border-dashed border-line',
        'px-6 py-12 text-center',
        className
      )}
    >
      <p className="font-display text-base text-text">{title}</p>
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
    <header className={cx('mb-8', className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="eyebrow mb-3 flex items-center gap-2">
              <span aria-hidden="true" className="h-1.5 w-1.5 bg-accent" />
              {eyebrow}
            </p>
          )}
          <h1 className="max-w-4xl text-3xl leading-[1.04] tracking-[-0.03em] text-text sm:text-4xl">
            {title}
          </h1>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {lede && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">{lede}</p>}
      <span className="draw-rule mt-6 block h-px bg-line" />
    </header>
  )
}
