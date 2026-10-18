import { cx } from './cx'

/**
 * Five earthy tones drawn from the manuscript palette. Deterministic on the
 * seed, so a given agent keeps the same mark across the app, and warm enough
 * that no avatar reads as a foreign accent colour.
 */
const TONES = ['var(--tone-1)', 'var(--tone-2)', 'var(--tone-3)', 'var(--tone-4)', 'var(--tone-5)']

export function avatarTone(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return TONES[hash % TONES.length]
}

/** First letters of the first two words, e.g. "Dr. Sharma" -> "DS". */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('')
}

const SIZES = {
  xs: 'h-6 w-6 text-[0.5625rem]',
  sm: 'h-7 w-7 text-[0.625rem]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-16 w-16 text-lg',
} as const

/**
 * A squared monogram. Replaces the gradient circles the old design used: the
 * hue is derived from the name so agents stay distinguishable, and the shape
 * matches the rest of the system.
 */
export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string
  size?: keyof typeof SIZES
  className?: string
}) {
  const tone = avatarTone(name || '?')

  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-flex flex-shrink-0 items-center justify-center rounded-[3px] border font-mono font-medium',
        SIZES[size],
        className
      )}
      style={{
        color: tone,
        borderColor: tone,
        backgroundColor: `color-mix(in srgb, ${tone} 14%, transparent)`,
      }}
    >
      {initialsOf(name) || '?'}
    </span>
  )
}
