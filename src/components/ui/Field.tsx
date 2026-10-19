import { Check, ChevronDown } from 'lucide-react'
import { useId, type InputHTMLAttributes, type ReactNode, type Ref, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'
import { textLength } from '@/lib/validation/brief'

export const inputClass =
  'w-full rounded-xl border border-line-strong bg-surface px-3.5 text-[16px] text-ink placeholder:text-muted/70 transition-colors focus:border-brown focus:outline-none focus:ring-2 focus:ring-sunny disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20'

interface FieldShellProps {
  id: string
  label: ReactNode
  hint?: ReactNode
  error?: string
  required?: boolean
  optional?: boolean
  counter?: { value: string; max: number }
  className?: string
  children: ReactNode
}

/** Label + control + hint/error, with ids wired for aria-describedby. */
function FieldShell({ id, label, hint, error, required, optional, counter, className, children }: FieldShellProps) {
  const len = counter ? textLength(counter.value) : 0
  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
          {required && (
            <span className="ml-0.5 text-danger" aria-hidden>
              *
            </span>
          )}
          {optional && <span className="ml-1.5 text-xs font-normal text-muted">(ไม่บังคับ)</span>}
        </label>
        {counter && (
          <span className={cn('text-xs tabular-nums', len > counter.max ? 'font-semibold text-danger' : 'text-muted')} aria-hidden>
            {len}/{counter.max}
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

const describedBy = (id: string, error?: string, hint?: ReactNode) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined)

type Common = { label: ReactNode; hint?: ReactNode; error?: string; optional?: boolean; maxChars?: number; wrapperClassName?: string }

export function TextField({
  label,
  hint,
  error,
  optional,
  maxChars,
  wrapperClassName,
  className,
  id: idProp,
  ref,
  ...rest
}: Common & InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  const auto = useId()
  const id = idProp ?? auto
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={rest.required}
      optional={optional}
      counter={maxChars ? { value: String(rest.value ?? ''), max: maxChars } : undefined}
      className={wrapperClassName}
    >
      <input
        ref={ref}
        id={id}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(inputClass, 'h-11', className)}
        {...rest}
      />
    </FieldShell>
  )
}

export function TextArea({
  label,
  hint,
  error,
  optional,
  maxChars,
  wrapperClassName,
  className,
  id: idProp,
  ref,
  ...rest
}: Common & TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }) {
  const auto = useId()
  const id = idProp ?? auto
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={rest.required}
      optional={optional}
      counter={maxChars ? { value: String(rest.value ?? ''), max: maxChars } : undefined}
      className={wrapperClassName}
    >
      <textarea
        ref={ref}
        id={id}
        rows={rest.rows ?? 3}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(inputClass, 'block resize-y py-2.5 leading-relaxed', className)}
        {...rest}
      />
    </FieldShell>
  )
}

export function Select({
  label,
  hint,
  error,
  optional,
  wrapperClassName,
  className,
  id: idProp,
  children,
  ...rest
}: Omit<Common, 'maxChars'> & SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId()
  const id = idProp ?? auto
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={rest.required} optional={optional} className={wrapperClassName}>
      <div className="relative">
        <select
          id={id}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={cn(inputClass, 'h-11 appearance-none pr-10', className)}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown size={18} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted" aria-hidden />
      </div>
    </FieldShell>
  )
}

/** Compact select without a visible label shell (filters, toolbars). Needs an aria-label. */
export function InlineSelect({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { 'aria-label': string }) {
  return (
    <div className={cn('relative', className)}>
      <select className={cn(inputClass, 'h-10 appearance-none pr-9 text-sm')} {...rest}>
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted" aria-hidden />
    </div>
  )
}

export function Checkbox({
  label,
  description,
  error,
  className,
  id: idProp,
  ...rest
}: { label: ReactNode; description?: ReactNode; error?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const auto = useId()
  const id = idProp ?? auto
  return (
    <div className={className}>
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 py-1">
        <span className="relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
          <input
            id={id}
            type="checkbox"
            aria-invalid={!!error || undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className="peer h-6 w-6 cursor-pointer appearance-none rounded-md border-2 border-line-strong bg-surface checked:border-brown checked:bg-brown focus-visible:ring-2 focus-visible:ring-sunny aria-[invalid=true]:border-danger"
            {...rest}
          />
          <Check size={16} strokeWidth={3} className="pointer-events-none absolute text-cream opacity-0 peer-checked:opacity-100" aria-hidden />
        </span>
        <span className="text-sm leading-relaxed text-ink">
          {label}
          {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
        </span>
      </label>
      {error && (
        <p id={`${id}-error`} className="ml-9 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

export interface RadioCardOption<T extends string | number> {
  value: T
  label: ReactNode
  description?: ReactNode
  icon?: ReactNode
  disabled?: boolean
}

/** Large tappable radio options (channel choice, sticker count). Arrow keys move within the group natively. */
export function RadioCards<T extends string | number>({
  name,
  legend,
  options,
  value,
  onChange,
  columns = 2,
  error,
  hideLegend,
  className,
}: {
  name: string
  legend: ReactNode
  options: RadioCardOption<T>[]
  value: T | undefined
  onChange(v: T): void
  columns?: 2 | 3 | 5
  error?: string
  hideLegend?: boolean
  className?: string
}) {
  const errId = useId()
  const cols = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 5: 'grid-cols-5' }[columns]
  return (
    <fieldset className={className} aria-describedby={error ? errId : undefined}>
      <legend className={cn('mb-2 text-sm font-medium text-ink', hideLegend && 'sr-only')}>{legend}</legend>
      <div className={cn('grid gap-2.5', columns === 5 ? cols : `grid-cols-1 ${cols}`)}>
        {options.map((o) => {
          const checked = o.value === value
          return (
            <label
              key={String(o.value)}
              className={cn(
                'relative flex min-h-11 cursor-pointer gap-3 rounded-2xl border-2 bg-surface p-3.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brown has-[:focus-visible]:ring-offset-2',
                checked ? 'border-brown bg-sunny-50' : 'border-line hover:border-line-strong',
                o.disabled && 'cursor-not-allowed opacity-50',
                columns === 5 && 'items-center justify-center p-2 text-center',
              )}
            >
              <input
                type="radio"
                name={name}
                className="sr-only"
                checked={checked}
                disabled={o.disabled}
                onChange={() => onChange(o.value)}
              />
              {o.icon && <span className="mt-0.5 shrink-0 text-ink">{o.icon}</span>}
              <span className="min-w-0">
                <span className="block font-medium text-ink">{o.label}</span>
                {o.description && <span className="mt-0.5 block text-sm text-muted">{o.description}</span>}
              </span>
              {checked && columns !== 5 && (
                <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-brown text-cream" aria-hidden>
                  <Check size={13} strokeWidth={3} />
                </span>
              )}
            </label>
          )
        })}
      </div>
      {error && (
        <p id={errId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  )
}
