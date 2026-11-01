import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { cn } from '@/lib/utils/cn'
import { Tooltip } from './Tooltip'

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Square button; `label` becomes the sr-only text and tooltip. */
  iconOnly?: boolean
  label?: string
  /** Tooltip text — rendered via <Tooltip>, never the native title attribute. */
  title?: string
  icon?: ReactNode
  iconRight?: ReactNode
  loading?: boolean
  block?: boolean
  ref?: Ref<HTMLButtonElement>
}

export const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-brown text-cream hover:bg-brown-800',
  accent: 'bg-sunny text-[#26221f] hover:brightness-95',
  secondary: 'border border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-muted',
  ghost: 'text-ink hover:bg-surface-muted',
  danger: 'bg-danger text-white hover:brightness-95',
  success: 'bg-success text-white hover:brightness-95',
}

/* Heights are explicit, not padding-derived, so bordered and borderless variants align.
   md/lg meet the 44px touch-target guidance (spec §4). */
export const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 pointer-coarse:min-h-10',
  md: 'h-11 px-5 text-[0.9375rem] gap-2 pointer-coarse:min-h-11',
  lg: 'h-12 px-6 text-base gap-2 pointer-coarse:min-h-12',
}
const iconSizes: Record<ButtonSize, string> = {
  sm: 'h-9 w-9 pointer-coarse:min-h-10 pointer-coarse:min-w-10',
  md: 'h-11 w-11',
  lg: 'h-12 w-12',
}

export const buttonBase =
  'group/btn inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-full font-medium transition-[color,background-color,border-color,opacity,transform,filter] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50'

/** Wraps a trailing icon. A trailing chevron slides right on hover (see globals.css, "Go-on chevron"). */
export const iconRightClass = 'inline-flex shrink-0'

export function Button({
  variant = 'secondary',
  size = 'md',
  iconOnly,
  label,
  title,
  icon,
  iconRight,
  loading,
  block,
  className,
  children,
  disabled,
  type = 'button',
  ref,
  ...rest
}: ButtonProps) {
  const btn = (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-label={iconOnly ? label : rest['aria-label']}
      aria-busy={loading || undefined}
      className={cn(buttonBase, buttonVariants[variant], iconOnly ? iconSizes[size] : buttonSizes[size], block && 'w-full', className)}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {iconOnly ? <span className="sr-only">{label}</span> : children}
      {!iconOnly && iconRight && <span className={iconRightClass}>{iconRight}</span>}
    </button>
  )
  const tip = title ?? (iconOnly ? label : undefined)
  return tip ? <Tooltip content={tip}>{btn}</Tooltip> : btn
}
