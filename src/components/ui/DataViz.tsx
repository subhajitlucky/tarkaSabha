import { ReactNode } from 'react'
import { Card } from './Card'
import { cx } from './cx'

const TONES = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function MetricCard({
  label,
  value,
  detail,
  accent,
  className,
}: {
  label: string
  value: string | number
  detail?: ReactNode
  accent?: string
  className?: string
}) {
  return (
    <Card
      className={cx('p-4', className)}
      style={accent ? { borderTopColor: accent, borderTopWidth: 2 } : undefined}
    >
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-subtle">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl leading-none text-text">{value}</p>
      {detail && <p className="mt-2 text-xs leading-relaxed text-muted">{detail}</p>}
    </Card>
  )
}

export function BarList({
  items,
  maxValue,
  className,
}: {
  items: Array<{ label: string; value: number; meta?: string; color?: string }>
  maxValue?: number
  className?: string
}) {
  const max = Math.max(1, maxValue ?? Math.max(...items.map((item) => item.value), 0))

  return (
    <div className={cx('space-y-4', className)}>
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 break-words text-sm text-text">{item.label}</span>
            <span className="shrink-0 font-mono text-xs text-subtle">
              {item.meta ?? item.value}
            </span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden bg-surface-3">
            <div
              className="h-full transition-[width] duration-500"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color ?? 'var(--chart-1)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DonutChart({
  segments,
  centerValue,
  centerLabel,
  className,
  size = 'md',
}: {
  segments: Array<{ label: string; value: number; color?: string }>
  centerValue: string | number
  centerLabel: string
  className?: string
  size?: 'sm' | 'md'
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  const radius = 48
  const circumference = 2 * Math.PI * radius
  const arcs = segments.map((segment, index) => {
    const length = total > 0 ? (segment.value / total) * circumference : 0
    const offset = segments
      .slice(0, index)
      .reduce(
        (sum, previous) =>
          sum + (total > 0 ? (previous.value / total) * circumference : 0),
        0
      )
    return { ...segment, length, offset }
  })

  return (
    <div className={cx('flex items-center gap-5', className)}>
      <div
        className={cx(
          'relative shrink-0',
          size === 'sm' ? 'h-24 w-24' : 'h-36 w-36'
        )}
      >
        <svg viewBox="0 0 120 120" className="h-full w-full">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--surface-3)"
            strokeWidth="17"
          />
          {arcs.map((arc, index) => {
            const color = arc.color ?? TONES[index % TONES.length]
            return (
              <circle
                key={arc.label}
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="17"
                strokeDasharray={`${arc.length} ${circumference - arc.length}`}
                strokeDashoffset={-arc.offset}
                transform="rotate(-90 60 60)"
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl leading-none text-text">{centerValue}</span>
          <span className="mt-1 max-w-16 text-center font-mono text-[0.52rem] uppercase leading-tight tracking-[0.1em] text-subtle">
            {centerLabel}
          </span>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2.5">
        {segments.map((segment, index) => (
          <li key={segment.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-muted">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0"
                style={{ backgroundColor: segment.color ?? TONES[index % TONES.length] }}
              />
              <span className="truncate">{segment.label}</span>
            </span>
            <span className="shrink-0 font-mono text-subtle">{segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function StackedBar({
  segments,
  className,
}: {
  segments: Array<{ label: string; value: number; color?: string }>
  className?: string
}) {
  const total = Math.max(
    1,
    segments.reduce((sum, segment) => sum + segment.value, 0)
  )

  return (
    <div className={cx('flex h-2.5 overflow-hidden bg-surface-3', className)}>
      {segments.map((segment, index) => (
        <div
          key={segment.label}
          title={`${segment.label}: ${segment.value}`}
          style={{
            width: `${(segment.value / total) * 100}%`,
            backgroundColor: segment.color ?? TONES[index % TONES.length],
          }}
        />
      ))}
    </div>
  )
}
