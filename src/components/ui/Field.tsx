import {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  forwardRef,
  useId,
} from 'react'
import { cx } from './cx'

const control =
  'w-full rounded-[3px] border border-line bg-surface-2 px-3 py-2 text-sm text-text ' +
  'placeholder:text-subtle transition-colors duration-150 ' +
  'hover:border-line-strong focus:border-accent focus:outline-none'

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: string
  hint?: string
  error?: string | null
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cx('space-y-1.5', className)}>
      {label && <label className="eyebrow block">{label}</label>}
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-subtle">{hint}</p>
      ) : null}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cx(control, className)} {...rest} />
  }
)

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cx(control, 'resize-none', className)} {...rest} />
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={cx(control, 'cursor-pointer', className)} {...rest}>
        {children}
      </select>
    )
  }
)

/** A labelled control wired together for accessibility in one call. */
export function TextField({
  label,
  hint,
  error,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  error?: string | null
}) {
  const id = useId()
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      <Input id={id} aria-invalid={error ? true : undefined} {...rest} />
    </Field>
  )
}
